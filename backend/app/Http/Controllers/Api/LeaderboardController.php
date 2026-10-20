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
    public function index(Request $request): JsonResponse
    {
        $mode = $request->query('mode', 'blitz');

        $rankings = UserRating::with('user:id,name,username,avatar_url,presence_status')
            ->where('type', $mode)
            ->whereHas('user', function ($q) {
                $q->where('status', 1);
            })
            ->orderBy('rating', 'desc')
            ->orderBy('wins_count', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'mode' => $mode,
            'leaderboard' => $rankings,
        ]);
    }
}
