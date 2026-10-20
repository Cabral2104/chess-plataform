<?php

namespace App\Http\Controllers\Api;

use App\Events\ChatMessageSentEvent;
use App\Events\DrawOfferedEvent;
use App\Events\GameOverEvent;
use App\Events\MoveMadeEvent;
use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameChatMessage;
use App\Models\GameMove;
use App\Services\EloCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    public function __construct(
        protected EloCalculatorService $eloService
    ) {}

    /**
     * Consultar el estado autoritativo completo de una partida.
     */
    public function show(string $code): JsonResponse
    {
        $game = Game::with([
            'whitePlayer:id,name,username,avatar_url',
            'blackPlayer:id,name,username,avatar_url',
            'gameMode',
            'moves',
            'chatMessages.user:id,username,avatar_url',
        ])
        ->where('code', $code)
        ->firstOrFail();

        // Cálculo dinámico de reloj en tiempo real
        $dynamicWhiteTime = $game->white_time_left_ms;
        $dynamicBlackTime = $game->black_time_left_ms;

        if ($game->game_status === 'in_progress' && $game->last_move_at) {
            $elapsedMs = (int) now()->diffInMilliseconds($game->last_move_at);

            if ($game->current_turn === 'w') {
                $dynamicWhiteTime = max(0, $game->white_time_left_ms - $elapsedMs);
            } else {
                $dynamicBlackTime = max(0, $game->black_time_left_ms - $elapsedMs);
            }
        }

        return response()->json([
            'game' => $game,
            'dynamic_clocks' => [
                'white_time_left_ms' => $dynamicWhiteTime,
                'black_time_left_ms' => $dynamicBlackTime,
            ],
        ]);
    }

    /**
     * Ejecutar y registrar un movimiento autoritativo con cálculo atómico de reloj.
     */
    public function makeMove(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'string', 'size:2'],
            'to' => ['required', 'string', 'size:2'],
            'piece' => ['required', 'string', 'size:1'],
            'captured_piece' => ['nullable', 'string', 'size:1'],
            'promotion' => ['nullable', 'string', 'in:q,r,b,n'],
            'san' => ['required', 'string', 'max:15'],
            'fen' => ['required', 'string'],
            'is_checkmate' => ['boolean'],
            'is_stalemate' => ['boolean'],
            'is_draw' => ['boolean'],
        ]);

        $user = $request->user();
        $game = Game::where('code', $code)->firstOrFail();

        // 1. Validaciones de estado y turno
        if ($game->game_status !== 'in_progress') {
            return response()->json([
                'message' => 'La partida no está activa.',
            ], 400);
        }

        $isWhite = ($user->id === $game->white_player_id);
        $isBlack = ($user->id === $game->black_player_id);

        if (!$isWhite && !$isBlack) {
            return response()->json([
                'message' => 'No eres un jugador de esta partida.',
            ], 403);
        }

        $expectedTurn = $game->current_turn;
        if (($expectedTurn === 'w' && !$isWhite) || ($expectedTurn === 'b' && !$isBlack)) {
            return response()->json([
                'message' => 'No es tu turno de mover.',
            ], 400);
        }

        $now = now();
        $gameMode = $game->gameMode;
        $incrementMs = $gameMode->increment_seconds * 1000;

        // 2. Cálculo atómico del reloj
        $elapsedMs = 0;
        $whiteTime = $game->white_time_left_ms;
        $blackTime = $game->black_time_left_ms;

        if ($game->last_move_at !== null) {
            $elapsedMs = (int) $now->diffInMilliseconds($game->last_move_at);

            if ($expectedTurn === 'w') {
                $whiteTime -= $elapsedMs;
                if ($whiteTime <= 0) {
                    return $this->handleTimeout($game, $game->black_player_id);
                }
                $whiteTime += $incrementMs;
            } else {
                $blackTime -= $elapsedMs;
                if ($blackTime <= 0) {
                    return $this->handleTimeout($game, $game->white_player_id);
                }
                $blackTime += $incrementMs;
            }
        } else {
            // Primer movimiento de la partida: se suma incremento si aplica
            if ($expectedTurn === 'w') {
                $whiteTime += $incrementMs;
            }
        }

        // 3. Persistencia de la jugada y actualización de la partida
        $result = DB::transaction(function () use (
            $game, $user, $validated, $now, $elapsedMs, $whiteTime, $blackTime, $expectedTurn
        ) {
            $ply = $game->move_count + 1;
            $moveNumber = (int) floor($game->move_count / 2) + 1;

            $move = GameMove::create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'move_number' => $moveNumber,
                'ply' => $ply,
                'color' => $expectedTurn,
                'from_square' => $validated['from'],
                'to_square' => $validated['to'],
                'piece' => $validated['piece'],
                'captured_piece' => $validated['captured_piece'] ?? null,
                'promotion' => $validated['promotion'] ?? null,
                'san' => $validated['san'],
                'uci' => $validated['from'] . $validated['to'] . ($validated['promotion'] ?? ''),
                'fen_after' => $validated['fen'],
                'time_spent_ms' => $elapsedMs,
                'remaining_time_ms' => ($expectedTurn === 'w' ? $whiteTime : $blackTime),
                'status' => 1,
            ]);

            // Actualizar PGN
            $sanPart = ($expectedTurn === 'w') ? " {$moveNumber}. {$validated['san']}" : " {$validated['san']}";
            $newPgn = trim(($game->pgn ?? '') . $sanPart);

            // Siguiente turno
            $nextTurn = ($expectedTurn === 'w') ? 'b' : 'w';

            $game->update([
                'fen' => $validated['fen'],
                'pgn' => $newPgn,
                'current_turn' => $nextTurn,
                'move_count' => $ply,
                'white_time_left_ms' => $whiteTime,
                'black_time_left_ms' => $blackTime,
                'last_move_at' => $now,
                'draw_offered_by' => null, // El movimiento anula cualquier oferta de tablas pendiente
            ]);

            // Verificar Jaque Mate / Tablas declaradas por la jugada
            $isGameOver = false;
            $ratingChanges = ['white_change' => 0, 'black_change' => 0];

            if (!empty($validated['is_checkmate'])) {
                $isGameOver = true;
                $game->update([
                    'game_status' => 'completed',
                    'end_reason' => 'checkmate',
                    'winner_id' => $user->id,
                    'ended_at' => $now,
                ]);
                $ratingChanges = $this->eloService->updateRatings($game);
                $this->resetUsersPresence($game);
            } elseif (!empty($validated['is_stalemate']) || !empty($validated['is_draw'])) {
                $isGameOver = true;
                $reason = !empty($validated['is_stalemate']) ? 'stalemate' : 'draw_rule';
                $game->update([
                    'game_status' => 'completed',
                    'end_reason' => $reason,
                    'winner_id' => null,
                    'ended_at' => $now,
                ]);
                $ratingChanges = $this->eloService->updateRatings($game);
                $this->resetUsersPresence($game);
            }

            return [
                'move' => $move,
                'is_game_over' => $isGameOver,
                'rating_changes' => $ratingChanges,
            ];
        });

        // 4. Emitir eventos en tiempo real a través de Reverb (con tolerancia a fallos)
        $this->safeBroadcast(new MoveMadeEvent(
            $game->code,
            $result['move'],
            $game->fen,
            $game->current_turn,
            $game->white_time_left_ms,
            $game->black_time_left_ms,
            $game->move_count
        ), toOthers: true);

        if ($result['is_game_over']) {
            $this->safeBroadcast(new GameOverEvent(
                $game->code,
                $game->winner_id,
                $game->end_reason,
                $result['rating_changes']['white_change'],
                $result['rating_changes']['black_change']
            ));
        }

        return response()->json([
            'message' => 'Movimiento procesado.',
            'move' => $result['move'],
            'game' => $game->fresh(['whitePlayer', 'blackPlayer', 'gameMode']),
        ]);
    }

    /**
     * Rendición de un jugador.
     */
    public function resign(Request $request, string $code): JsonResponse
    {
        $user = $request->user();
        $game = Game::where('code', $code)->firstOrFail();

        if ($game->game_status !== 'in_progress') {
            return response()->json(['message' => 'La partida ya no está activa.'], 400);
        }

        $winnerId = ($user->id === $game->white_player_id) 
            ? $game->black_player_id 
            : $game->white_player_id;

        $game->update([
            'game_status' => 'completed',
            'end_reason' => 'resignation',
            'winner_id' => $winnerId,
            'ended_at' => now(),
        ]);

        $ratingChanges = $this->eloService->updateRatings($game);
        $this->resetUsersPresence($game);

        $this->safeBroadcast(new GameOverEvent(
            $game->code,
            $winnerId,
            'resignation',
            $ratingChanges['white_change'],
            $ratingChanges['black_change']
        ));

        return response()->json([
            'message' => 'Has abandonado la partida.',
            'game' => $game->fresh(['whitePlayer', 'blackPlayer']),
        ]);
    }

    /**
     * Ofrecer o aceptar tablas.
     */
    public function drawOffer(Request $request, string $code): JsonResponse
    {
        $user = $request->user();
        $game = Game::where('code', $code)->firstOrFail();

        if ($game->game_status !== 'in_progress') {
            return response()->json(['message' => 'La partida no está activa.'], 400);
        }

        // Si el oponente ya había ofrecido tablas, se aceptan de inmediato
        if ($game->draw_offered_by && $game->draw_offered_by !== $user->id) {
            $game->update([
                'game_status' => 'completed',
                'end_reason' => 'draw_agreed',
                'winner_id' => null,
                'ended_at' => now(),
                'draw_offered_by' => null,
            ]);

            $ratingChanges = $this->eloService->updateRatings($game);
            $this->resetUsersPresence($game);

            $this->safeBroadcast(new GameOverEvent(
                $game->code,
                null,
                'draw_agreed',
                $ratingChanges['white_change'],
                $ratingChanges['black_change']
            ));

            return response()->json([
                'message' => 'Tablas acordadas mutuamente.',
                'game' => $game->fresh(),
            ]);
        }

        // Emitir oferta de tablas
        $game->update(['draw_offered_by' => $user->id]);

        $this->safeBroadcast(new DrawOfferedEvent($game->code, $user->id), toOthers: true);

        return response()->json([
            'message' => 'Propuesta de tablas enviada a tu oponente.',
        ]);
    }

    /**
     * Enviar mensaje al chat en vivo de la partida.
     */
    public function chat(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $game = Game::where('code', $code)->firstOrFail();

        $chat = GameChatMessage::create([
            'game_id' => $game->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'type' => 'chat',
            'status' => 1,
        ]);

        $this->safeBroadcast(new ChatMessageSentEvent($game->code, $chat), toOthers: true);

        return response()->json([
            'message' => 'Mensaje enviado.',
            'chat' => $chat->load('user:id,username,avatar_url'),
        ]);
    }

    /**
     * Manejar la finalización de partida por caída de bandera (tiempo agotado).
     */
    private function handleTimeout(Game $game, int $winnerId): JsonResponse
    {
        $game->update([
            'game_status' => 'completed',
            'end_reason' => 'timeout',
            'winner_id' => $winnerId,
            'ended_at' => now(),
        ]);

        $ratingChanges = $this->eloService->updateRatings($game);
        $this->resetUsersPresence($game);

        $this->safeBroadcast(new GameOverEvent(
            $game->code,
            $winnerId,
            'timeout',
            $ratingChanges['white_change'],
            $ratingChanges['black_change']
        ));

        return response()->json([
            'message' => 'Tiempo agotado. Partida finalizada.',
            'game' => $game->fresh(['whitePlayer', 'blackPlayer']),
        ], 400);
    }

    /**
     * Emitir eventos de WebSocket con tolerancia a fallos.
     */
    private function safeBroadcast(mixed $event, bool $toOthers = false): void
    {
        try {
            $pending = broadcast($event);
            if ($toOthers) {
                $pending->toOthers();
            }
            unset($pending); // Forzar ejecución de __destruct() dentro del try-catch
        } catch (\Throwable $e) {
            Log::warning("Fallo al emitir evento de WebSocket: " . $e->getMessage());
        }
    }

    private function resetUsersPresence(Game $game): void
    {
        $game->whitePlayer()->update(['presence_status' => 'online']);
        $game->blackPlayer()->update(['presence_status' => 'online']);
    }
}
