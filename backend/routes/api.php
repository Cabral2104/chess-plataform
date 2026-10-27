<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameChallengeController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\GameModeController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

/*
|--------------------------------------------------------------------------
| API Routes - Plataforma de Ajedrez Multijugador en Tiempo Real
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. RUTAS PÚBLICAS
// ==========================================

// Autenticación pública
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Modos de juego oficiales (para lobby y creación de salas)
Route::get('/game-modes', [GameModeController::class, 'index']);

// Clasificación competitiva / Leaderboard
Route::get('/rankings', [LeaderboardController::class, 'index']);

// Perfiles públicos e historial de partidas
Route::prefix('users')->group(function () {
    Route::get('/{username}', [UserController::class, 'profile']);
    Route::get('/{username}/history', [UserController::class, 'history']);
});

// Consultas públicas de retos y partidas (para espectadores o previsualización)
Route::get('/challenges', [GameChallengeController::class, 'index']);
Route::get('/challenges/{code}', [GameChallengeController::class, 'show']);
Route::get('/games/{code}', [GameController::class, 'show']);

// ==========================================
// 2. RUTAS PROTEGIDAS (Laravel Sanctum)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // Sesión
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Gestión de Retos y Salas
    Route::prefix('challenges')->group(function () {
        Route::post('/', [GameChallengeController::class, 'store']);
        Route::post('/{code}/accept', [GameChallengeController::class, 'accept']);
        Route::post('/{code}/cancel', [GameChallengeController::class, 'cancel']);
    });

    // Operaciones en Partida en Tiempo Real
    Route::prefix('games')->group(function () {
        Route::post('/{code}/move', [GameController::class, 'makeMove']);
        Route::post('/{code}/resign', [GameController::class, 'resign']);
        Route::post('/{code}/draw-offer', [GameController::class, 'drawOffer']);
        Route::post('/{code}/chat', [GameController::class, 'chat']);
    });
});
