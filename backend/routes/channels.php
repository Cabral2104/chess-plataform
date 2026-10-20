<?php

use App\Models\Game;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Canal de presencia en vivo para la sala de juego.
 * Informa quiénes están conectados, quién es blancas, negras o espectador.
 */
Broadcast::channel('presence-game.{code}', function ($user, string $code) {
    $game = Game::where('code', $code)->first();
    if (!$game) {
        return false;
    }

    $role = 'spectator';
    if ($user->id === $game->white_player_id) {
        $role = 'white';
    } elseif ($user->id === $game->black_player_id) {
        $role = 'black';
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'username' => $user->username,
        'avatar_url' => $user->avatar_url,
        'role' => $role,
    ];
});
