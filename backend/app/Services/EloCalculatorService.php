<?php

namespace App\Services;

use App\Models\Game;
use App\Models\User;
use App\Models\UserRating;

class EloCalculatorService
{
    private const K_FACTOR = 32;

    /**
     * Calcular y aplicar la actualización de Elo para una partida finalizada.
     * 
     * @return array{white_change: int, black_change: int}
     */
    public function updateRatings(Game $game): array
    {
        if (!$game->is_rated) {
            return ['white_change' => 0, 'black_change' => 0];
        }

        $white = $game->whitePlayer;
        $black = $game->blackPlayer;
        $modeType = $game->gameMode->type;

        // Obtener o inicializar ratings
        $whiteRating = UserRating::firstOrCreate(
            ['user_id' => $white->id, 'type' => $modeType],
            ['rating' => 1200, 'peak_rating' => 1200]
        );

        $blackRating = UserRating::firstOrCreate(
            ['user_id' => $black->id, 'type' => $modeType],
            ['rating' => 1200, 'peak_rating' => 1200]
        );

        $ra = $whiteRating->rating;
        $rb = $blackRating->rating;

        // Probabilidades esperadas (Fórmula oficial FIDE)
        $expectedA = 1 / (1 + pow(10, ($rb - $ra) / 400));
        $expectedB = 1 / (1 + pow(10, ($ra - $rb) / 400));

        // Puntuaciones reales obtenidas
        if ($game->winner_id === $white->id) {
            $scoreA = 1.0;
            $scoreB = 0.0;
        } elseif ($game->winner_id === $black->id) {
            $scoreA = 0.0;
            $scoreB = 1.0;
        } else { // Tablas
            $scoreA = 0.5;
            $scoreB = 0.5;
        }

        // Variaciones de Elo
        $deltaA = (int) round(self::K_FACTOR * ($scoreA - $expectedA));
        $deltaB = (int) round(self::K_FACTOR * ($scoreB - $expectedB));

        // Aplicar a jugador blanco
        $newRa = max(100, $ra + $deltaA);
        $whiteRating->update([
            'rating' => $newRa,
            'peak_rating' => max($whiteRating->peak_rating, $newRa),
            'games_count' => $whiteRating->games_count + 1,
            'wins_count' => $whiteRating->wins_count + ($scoreA === 1.0 ? 1 : 0),
            'losses_count' => $whiteRating->losses_count + ($scoreA === 0.0 ? 1 : 0),
            'draws_count' => $whiteRating->draws_count + ($scoreA === 0.5 ? 1 : 0),
        ]);

        // Aplicar a jugador negro
        $newRb = max(100, $rb + $deltaB);
        $blackRating->update([
            'rating' => $newRb,
            'peak_rating' => max($blackRating->peak_rating, $newRb),
            'games_count' => $blackRating->games_count + 1,
            'wins_count' => $blackRating->wins_count + ($scoreB === 1.0 ? 1 : 0),
            'losses_count' => $blackRating->losses_count + ($scoreB === 0.0 ? 1 : 0),
            'draws_count' => $blackRating->draws_count + ($scoreB === 0.5 ? 1 : 0),
        ]);

        // Actualizar estadísticas globales del usuario
        $this->updateUserGlobalStats($white, $scoreA);
        $this->updateUserGlobalStats($black, $scoreB);

        return [
            'white_change' => $deltaA,
            'black_change' => $deltaB,
        ];
    }

    private function updateUserGlobalStats(User $user, float $score): void
    {
        $user->increment('total_games');
        if ($score === 1.0) {
            $user->increment('total_wins');
        } elseif ($score === 0.0) {
            $user->increment('total_losses');
        } else {
            $user->increment('total_draws');
        }
    }
}
