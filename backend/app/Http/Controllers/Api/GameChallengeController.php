<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameChallenge;
use App\Models\GameMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GameChallengeController extends Controller
{
    /**
     * Listar retos públicos pendientes (para el lobby de partidas abiertas).
     */
    public function index(): JsonResponse
    {
        $challenges = GameChallenge::with(['challenger.ratings', 'gameMode'])
            ->where('challenge_status', 'pending')
            ->whereNull('challenged_id') // Solo retos abiertos públicos
            ->where('is_private', false) // Excluir salas privadas de amigos
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'challenges' => $challenges,
        ]);
    }

    /**
     * Crear un nuevo reto (público para la comunidad o privado con enlace).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_mode_id' => ['required', 'exists:game_modes,id'],
            'color_preference' => ['required', 'in:white,black,random'],
            'is_rated' => ['boolean'],
            'is_private' => ['nullable', 'boolean'],
            'challenged_id' => ['nullable', 'exists:users,id', 'different:challenger_id'],
        ]);

        $user = $request->user();

        // Evitar que el usuario cree múltiples retos pendientes simultáneos
        $existing = GameChallenge::where('challenger_id', $user->id)
            ->where('challenge_status', 'pending')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Ya tienes un reto pendiente activo.',
                'challenge' => $existing->load(['gameMode', 'challenger.ratings']),
            ], 400);
        }

        // Generar código único de 8 caracteres
        $code = Str::upper(Str::random(8));

        $challenge = GameChallenge::create([
            'code' => $code,
            'challenger_id' => $user->id,
            'challenged_id' => $validated['challenged_id'] ?? null,
            'game_mode_id' => $validated['game_mode_id'],
            'color_preference' => $validated['color_preference'],
            'is_rated' => $validated['is_rated'] ?? true,
            'is_private' => $validated['is_private'] ?? false,
            'challenge_status' => 'pending',
            'expires_at' => now()->addMinutes(10),
            'status' => 1,
        ]);

        return response()->json([
            'message' => 'Reto creado exitosamente.',
            'challenge' => $challenge->load(['gameMode', 'challenger.ratings']),
        ], 201);
    }

    /**
     * Consultar información de un reto por su código (para sala de espera).
     */
    public function show(string $code): JsonResponse
    {
        $challenge = GameChallenge::with(['challenger', 'challenged', 'gameMode', 'game'])
            ->where('code', $code)
            ->firstOrFail();

        // Marcar como expirado si el tiempo límite venció
        if ($challenge->challenge_status === 'pending' && $challenge->expires_at && $challenge->expires_at->isPast()) {
            $challenge->update(['challenge_status' => 'expired']);
        }

        return response()->json([
            'challenge' => $challenge,
        ]);
    }

    /**
     * Aceptar un reto y crear la partida oficial en la base de datos.
     */
    public function accept(Request $request, string $code): JsonResponse
    {
        $user = $request->user();

        $challenge = GameChallenge::where('code', $code)->firstOrFail();

        // Validaciones de negocio
        if ($challenge->challenge_status !== 'pending') {
            return response()->json([
                'message' => "Este reto ya no está disponible (Estado: {$challenge->challenge_status}).",
            ], 400);
        }

        if ($challenge->expires_at && $challenge->expires_at->isPast()) {
            $challenge->update(['challenge_status' => 'expired']);
            return response()->json([
                'message' => 'Este reto ha expirado.',
            ], 400);
        }

        if ($challenge->challenger_id === $user->id) {
            return response()->json([
                'message' => 'No puedes aceptar tu propio reto.',
            ], 400);
        }

        if ($challenge->challenged_id && $challenge->challenged_id !== $user->id) {
            return response()->json([
                'message' => 'Este reto está dirigido a otro jugador específico.',
            ], 403);
        }

        $gameMode = GameMode::findOrFail($challenge->game_mode_id);

        // Transacción atómica: Asignar colores, crear Game y actualizar Challenge
        $game = DB::transaction(function () use ($challenge, $user, $gameMode) {
            // Asignación de piezas
            $challengerId = $challenge->challenger_id;
            $acceptorId = $user->id;

            if ($challenge->color_preference === 'white') {
                $whiteId = $challengerId;
                $blackId = $acceptorId;
            } elseif ($challenge->color_preference === 'black') {
                $whiteId = $acceptorId;
                $blackId = $challengerId;
            } else { // random
                $random = (bool) random_int(0, 1);
                $whiteId = $random ? $challengerId : $acceptorId;
                $blackId = $random ? $acceptorId : $challengerId;
            }

            $initialTimeMs = $gameMode->initial_time_seconds * 1000;
            $gameCode = 'gm_' . Str::lower(Str::random(8));

            // Crear la partida oficial
            $createdGame = Game::create([
                'code' => $gameCode,
                'white_player_id' => $whiteId,
                'black_player_id' => $blackId,
                'winner_id' => null,
                'game_mode_id' => $gameMode->id,
                'challenge_id' => $challenge->id,
                'is_rated' => $challenge->is_rated,
                'game_status' => 'in_progress',
                'fen' => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                'pgn' => '',
                'current_turn' => 'w',
                'move_count' => 0,
                'white_time_left_ms' => $initialTimeMs,
                'black_time_left_ms' => $initialTimeMs,
                'last_move_at' => null, // El reloj comienza al hacer el primer movimiento
                'started_at' => now(),
                'status' => 1,
            ]);

            // Actualizar estado del reto
            $challenge->update([
                'challenge_status' => 'accepted',
                'challenged_id' => $user->id,
            ]);

            // Actualizar estado de presencia a "in_game"
            $user->update(['presence_status' => 'in_game']);
            $challenge->challenger()->update(['presence_status' => 'in_game']);

            return $createdGame;
        });

        return response()->json([
            'message' => 'Reto aceptado. Partida iniciada.',
            'game' => $game->load(['whitePlayer', 'blackPlayer', 'gameMode']),
        ]);
    }

    /**
     * Cancelar un reto emitido.
     */
    public function cancel(Request $request, string $code): JsonResponse
    {
        $user = $request->user();

        $challenge = GameChallenge::where('code', $code)->firstOrFail();

        if ($challenge->challenger_id !== $user->id) {
            return response()->json([
                'message' => 'Solo el creador del reto puede cancelarlo.',
            ], 403);
        }

        if ($challenge->challenge_status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden cancelar retos pendientes.',
            ], 400);
        }

        $challenge->update(['challenge_status' => 'canceled']);

        return response()->json([
            'message' => 'Reto cancelado correctamente.',
        ]);
    }
}
