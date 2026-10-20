<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Perfil público del jugador con estadísticas y puntuaciones Elo.
     */
    public function profile(string $username): JsonResponse
    {
        $user = User::with('ratings')
            ->where('username', $username)
            ->where('status', 1)
            ->firstOrFail();

        $winRate = $user->total_games > 0 
            ? round(($user->total_wins / $user->total_games) * 100, 1) 
            : 0;

        return response()->json([
            'user' => $user,
            'stats' => [
                'win_rate' => $winRate,
                'total_games' => $user->total_games,
                'total_wins' => $user->total_wins,
                'total_losses' => $user->total_losses,
                'total_draws' => $user->total_draws,
            ],
        ]);
    }

    /**
     * Historial de partidas jugadas por el usuario.
     */
    public function history(string $username): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        $games = Game::with([
            'whitePlayer:id,name,username,avatar_url',
            'blackPlayer:id,name,username,avatar_url',
            'winner:id,username',
            'gameMode:id,name,type',
        ])
        ->where(function ($q) use ($user) {
            $q->where('white_player_id', $user->id)
              ->orWhere('black_player_id', $user->id);
        })
        ->where('game_status', 'completed')
        ->orderBy('ended_at', 'desc')
        ->limit(20)
        ->get();

        return response()->json([
            'games' => $games,
        ]);
    }
}
