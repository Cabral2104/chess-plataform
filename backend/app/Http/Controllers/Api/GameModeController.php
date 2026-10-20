<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameMode;
use Illuminate\Http\JsonResponse;

class GameModeController extends Controller
{
    /**
     * Listado de modalidades de juego activas disponibles.
     */
    public function index(): JsonResponse
    {
        $modes = GameMode::active()
            ->orderBy('initial_time_seconds', 'asc')
            ->get();

        return response()->json([
            'game_modes' => $modes,
        ]);
    }
}
