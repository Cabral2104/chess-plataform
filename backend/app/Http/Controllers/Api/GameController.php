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
     * Listar partidas activas en curso para espectadores (Chess TV / Observar en vivo).
     * Limpia automáticamente las partidas cuyo reloj ya expiró o que fueron abandonadas.
     */
    public function activeGames(): JsonResponse
    {
        $candidates = Game::with([
            'whitePlayer:id,name,username,avatar_url,presence_status',
            'whitePlayer.ratings',
            'blackPlayer:id,name,username,avatar_url,presence_status',
            'blackPlayer.ratings',
            'gameMode',
        ])
        ->where('game_status', 'in_progress')
        ->orderBy('started_at', 'desc')
        ->limit(30)
        ->get();

        $activeGames = [];
        foreach ($candidates as $game) {
            $this->syncAndExpireGameStatus($game);
            if ($game->game_status === 'in_progress') {
                $activeGames[] = $game;
            }
        }

        return response()->json([
            'games' => array_slice($activeGames, 0, 15),
        ]);
    }

    /**
     * Consultar el estado autoritativo completo de una partida.
     */
    public function show(string $code): JsonResponse
    {
        $game = Game::with([
            'whitePlayer:id,name,username,avatar_url,presence_status',
            'whitePlayer.ratings',
            'blackPlayer:id,name,username,avatar_url,presence_status',
            'blackPlayer.ratings',
            'gameMode',
            'moves',
            'chatMessages.user:id,username,avatar_url',
        ])
        ->where('code', $code)
        ->firstOrFail();

        $dynamicClocks = $this->syncAndExpireGameStatus($game);

        return response()->json([
            'game' => $game,
            'dynamic_clocks' => $dynamicClocks,
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
        $game = Game::with('gameMode')->where('code', $code)->firstOrFail();

        // Verificar primero si la partida ya expiró por tiempo
        $this->syncAndExpireGameStatus($game);

        // 1. Validaciones de estado y turno
        if ($game->game_status !== 'in_progress') {
            return response()->json([
                'message' => 'La partida ya ha finalizado.',
                'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            ], 400);
        }

        $isWhite = ((int) $user->id === (int) $game->white_player_id);
        $isBlack = ((int) $user->id === (int) $game->black_player_id);

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
        $initialTimeMs = ($gameMode ? $gameMode->initial_time_seconds : 180) * 1000;
        $incrementMs = ($gameMode ? $gameMode->increment_seconds : 0) * 1000;

        // 2. Cálculo atómico del reloj (siempre resta el tiempo pensado en milisegundos positivos)
        $whiteTime = min($initialTimeMs, max(0, (int) $game->white_time_left_ms));
        $blackTime = min($initialTimeMs, max(0, (int) $game->black_time_left_ms));
        $referenceTime = $game->last_move_at ?? $game->started_at;
        $elapsedMs = 0;

        if ($referenceTime !== null) {
            $elapsedMs = max(0, (int) round($now->getTimestampMs() - $referenceTime->getTimestampMs()));

            if ($expectedTurn === 'w') {
                $whiteTime -= $elapsedMs;
                if ($whiteTime <= 0) {
                    return $this->handleTimeout($game, (int) $game->black_player_id, 0, $blackTime);
                }
                if ($game->last_move_at !== null && $incrementMs > 0) {
                    $whiteTime = min($initialTimeMs, $whiteTime + $incrementMs);
                }
            } else {
                $blackTime -= $elapsedMs;
                if ($blackTime <= 0) {
                    return $this->handleTimeout($game, (int) $game->white_player_id, $whiteTime, 0);
                }
                if ($incrementMs > 0) {
                    $blackTime = min($initialTimeMs, $blackTime + $incrementMs);
                }
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

            // Si quien mueve NO es quien ofreció tablas, su jugada rechaza implícitamente la oferta
            $nextDrawOfferedBy = ($game->draw_offered_by && (int) $game->draw_offered_by === (int) $user->id)
                ? $game->draw_offered_by
                : null;

            $game->update([
                'fen' => $validated['fen'],
                'pgn' => $newPgn,
                'current_turn' => $nextTurn,
                'move_count' => $ply,
                'white_time_left_ms' => $whiteTime,
                'black_time_left_ms' => $blackTime,
                'last_move_at' => $now,
                'draw_offered_by' => $nextDrawOfferedBy,
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
                $game->update([
                    'white_rating_change' => $ratingChanges['white_change'],
                    'black_rating_change' => $ratingChanges['black_change'],
                ]);
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
                $game->update([
                    'white_rating_change' => $ratingChanges['white_change'],
                    'black_rating_change' => $ratingChanges['black_change'],
                ]);
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
            'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            'rating_changes' => $result['rating_changes'],
        ]);
    }

    /**
     * Rendición de un jugador.
     */
    public function resign(Request $request, string $code): JsonResponse
    {
        $user = $request->user();
        $game = Game::with('gameMode')->where('code', $code)->firstOrFail();

        if ($game->game_status !== 'in_progress') {
            return response()->json([
                'message' => 'La partida ya ha finalizado.',
                'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            ]);
        }

        $isWhite = ((int) $user->id === (int) $game->white_player_id);
        $isBlack = ((int) $user->id === (int) $game->black_player_id);

        if (!$isWhite && !$isBlack) {
            return response()->json(['message' => 'No eres un jugador de esta partida.'], 403);
        }

        $winnerId = $isWhite ? (int) $game->black_player_id : (int) $game->white_player_id;

        $game->update([
            'game_status' => 'completed',
            'end_reason' => 'resignation',
            'winner_id' => $winnerId,
            'ended_at' => now(),
            'draw_offered_by' => null,
        ]);

        $ratingChanges = $this->eloService->updateRatings($game);
        $game->update([
            'white_rating_change' => $ratingChanges['white_change'],
            'black_rating_change' => $ratingChanges['black_change'],
        ]);
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
            'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            'rating_changes' => $ratingChanges,
        ]);
    }

    /**
     * Ofrecer, aceptar o rechazar tablas.
     */
    public function drawOffer(Request $request, string $code): JsonResponse
    {
        $user = $request->user();
        $game = Game::with('gameMode')->where('code', $code)->firstOrFail();

        if ($game->game_status !== 'in_progress') {
            return response()->json([
                'message' => 'La partida ya ha finalizado.',
                'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            ]);
        }

        $isWhite = ((int) $user->id === (int) $game->white_player_id);
        $isBlack = ((int) $user->id === (int) $game->black_player_id);

        if (!$isWhite && !$isBlack) {
            return response()->json(['message' => 'No eres un jugador de esta partida.'], 403);
        }

        // Si el jugador rechaza explícitamente la oferta de tablas
        if ($request->boolean('reject')) {
            $game->update(['draw_offered_by' => null]);
            return response()->json([
                'message' => 'Oferta de tablas rechazada.',
                'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            ]);
        }

        // Si el oponente ya había ofrecido tablas, se aceptan de inmediato
        if ($game->draw_offered_by && (int) $game->draw_offered_by !== (int) $user->id) {
            $game->update([
                'game_status' => 'completed',
                'end_reason' => 'draw_agreed',
                'winner_id' => null,
                'ended_at' => now(),
                'draw_offered_by' => null,
            ]);

            $ratingChanges = $this->eloService->updateRatings($game);
            $game->update([
                'white_rating_change' => $ratingChanges['white_change'],
                'black_rating_change' => $ratingChanges['black_change'],
            ]);
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
                'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
                'rating_changes' => $ratingChanges,
            ]);
        }

        // Emitir oferta de tablas
        $game->update(['draw_offered_by' => $user->id]);

        $this->safeBroadcast(new DrawOfferedEvent($game->code, $user->id), toOthers: true);

        return response()->json([
            'message' => 'Propuesta de tablas enviada a tu oponente.',
            'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
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
     * Sincroniza los relojes dinámicos de una partida y la cierra automáticamente
     * si el tiempo de alguno de los jugadores llegó a 0 (evita partidas zombi).
     *
     * @return array{white_time_left_ms: int, black_time_left_ms: int}
     */
    private function syncAndExpireGameStatus(Game $game): array
    {
        $now = now();
        $gameMode = $game->gameMode;
        $initialTimeMs = ($gameMode ? $gameMode->initial_time_seconds : 180) * 1000;

        // Sanear valores de reloj heredados por encima del tiempo inicial
        $baseWhiteMs = min($initialTimeMs, max(0, (int) $game->white_time_left_ms));
        $baseBlackMs = min($initialTimeMs, max(0, (int) $game->black_time_left_ms));

        if ($baseWhiteMs !== (int) $game->white_time_left_ms || $baseBlackMs !== (int) $game->black_time_left_ms) {
            $game->update([
                'white_time_left_ms' => $baseWhiteMs,
                'black_time_left_ms' => $baseBlackMs,
            ]);
        }

        $dynamicWhiteTime = $baseWhiteMs;
        $dynamicBlackTime = $baseBlackMs;

        if ($game->game_status !== 'in_progress') {
            return [
                'white_time_left_ms' => $dynamicWhiteTime,
                'black_time_left_ms' => $dynamicBlackTime,
            ];
        }

        $referenceTime = $game->last_move_at ?? $game->started_at;
        if ($referenceTime !== null) {
            $elapsedMs = max(0, (int) round($now->getTimestampMs() - $referenceTime->getTimestampMs()));

            if ($game->current_turn === 'w') {
                $dynamicWhiteTime = max(0, $baseWhiteMs - $elapsedMs);
                if ($dynamicWhiteTime <= 0) {
                    $this->finalizeTimeoutGame($game, (int) $game->black_player_id, 0, $baseBlackMs);
                }
            } else {
                $dynamicBlackTime = max(0, $baseBlackMs - $elapsedMs);
                if ($dynamicBlackTime <= 0) {
                    $this->finalizeTimeoutGame($game, (int) $game->white_player_id, $baseWhiteMs, 0);
                }
            }
        }

        return [
            'white_time_left_ms' => $dynamicWhiteTime,
            'black_time_left_ms' => $dynamicBlackTime,
        ];
    }

    /**
     * Cierra silenciosamente una partida cuyo reloj llegó a 0 y actualiza el Elo.
     */
    private function finalizeTimeoutGame(Game $game, int $winnerId, int $whiteTimeMs, int $blackTimeMs): array
    {
        $game->update([
            'game_status' => 'completed',
            'end_reason' => 'timeout',
            'winner_id' => $winnerId,
            'white_time_left_ms' => $whiteTimeMs,
            'black_time_left_ms' => $blackTimeMs,
            'ended_at' => now(),
            'draw_offered_by' => null,
        ]);

        $ratingChanges = $this->eloService->updateRatings($game);
        $game->update([
            'white_rating_change' => $ratingChanges['white_change'],
            'black_rating_change' => $ratingChanges['black_change'],
        ]);
        $this->resetUsersPresence($game);

        $this->safeBroadcast(new GameOverEvent(
            $game->code,
            $winnerId,
            'timeout',
            $ratingChanges['white_change'],
            $ratingChanges['black_change']
        ));

        return $ratingChanges;
    }

    /**
     * Manejar la finalización de partida por caída de bandera al intentar mover.
     */
    private function handleTimeout(Game $game, int $winnerId, int $whiteTimeMs = 0, int $blackTimeMs = 0): JsonResponse
    {
        $ratingChanges = $this->finalizeTimeoutGame($game, $winnerId, $whiteTimeMs, $blackTimeMs);

        return response()->json([
            'message' => 'Tiempo agotado. Partida finalizada.',
            'game' => $game->fresh(['whitePlayer.ratings', 'blackPlayer.ratings', 'gameMode']),
            'rating_changes' => $ratingChanges,
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
