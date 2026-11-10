<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    /**
     * Obtener tabla de clasificación (Leaderboard) por modalidad.
     */
    public function index(Request $request, \App\Services\EloCalculatorService $eloService): JsonResponse
    {
        $mode = $request->query('mode', 'blitz');

        $users = \App\Models\User::where('status', 1)->limit(50)->get();
        foreach ($users as $u) {
            $eloService->syncUserStats($u);
        }

        $rankings = UserRating::with('user:id,name,username,avatar_url,presence_status,total_games,total_wins,total_draws,total_losses')
            ->where('type', $mode)
            ->whereHas('user', function ($q) {
                $q->where('status', 1);
            })
            ->orderBy('rating', 'desc')
            ->orderBy('wins_count', 'desc')
            ->orderBy('draws_count', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'mode' => $mode,
            'leaderboard' => $rankings,
        ]);
    }
}
