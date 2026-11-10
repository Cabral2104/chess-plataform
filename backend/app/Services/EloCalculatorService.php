<?php

namespace App\Services;

use App\Models\Game;
use App\Models\User;
use App\Models\UserRating;

class EloCalculatorService
{
    private const K_FACTOR = 32;

    /**
     * Calcular y aplicar la actualización de Elo y estadísticas para una partida finalizada.
     *
     * @return array{white_change: int, black_change: int}
     */
    public function updateRatings(Game $game): array
    {
        $white = $game->whitePlayer;
        $black = $game->blackPlayer;
        $modeType = $game->gameMode->type ?? 'blitz';

        if (!$white || !$black) {
            return ['white_change' => 0, 'black_change' => 0];
        }

        // Obtener o inicializar ratings por modalidad
        $whiteRating = UserRating::firstOrCreate(
            ['user_id' => $white->id, 'type' => $modeType],
            ['rating' => 1200, 'peak_rating' => 1200]
        );

        $blackRating = UserRating::firstOrCreate(
            ['user_id' => $black->id, 'type' => $modeType],
            ['rating' => 1200, 'peak_rating' => 1200]
        );

        $deltaA = 0;
        $deltaB = 0;

        if ($game->is_rated && $game->end_reason !== 'aborted') {
            $ra = $whiteRating->rating;
            $rb = $blackRating->rating;

            // Probabilidades esperadas (Fórmula oficial FIDE)
            $expectedA = 1 / (1 + pow(10, ($rb - $ra) / 400));
            $expectedB = 1 / (1 + pow(10, ($ra - $rb) / 400));

            // Puntuaciones reales obtenidas (1.0 victoria, 0.5 tablas/empate, 0.0 derrota)
            if ($game->winner_id !== null && (int) $game->winner_id === (int) $white->id) {
                $scoreA = 1.0;
                $scoreB = 0.0;
            } elseif ($game->winner_id !== null && (int) $game->winner_id === (int) $black->id) {
                $scoreA = 0.0;
                $scoreB = 1.0;
            } else {
                // Empate / Tablas
                $scoreA = 0.5;
                $scoreB = 0.5;
            }

            // Variaciones de Elo FIDE (K=32)
            $deltaA = (int) round(self::K_FACTOR * ($scoreA - $expectedA));
            $deltaB = (int) round(self::K_FACTOR * ($scoreB - $expectedB));

            $newRa = max(100, $ra + $deltaA);
            $whiteRating->update([
                'rating' => $newRa,
                'peak_rating' => max($whiteRating->peak_rating, $newRa),
            ]);

            $newRb = max(100, $rb + $deltaB);
            $blackRating->update([
                'rating' => $newRb,
                'peak_rating' => max($blackRating->peak_rating, $newRb),
            ]);
        }

        // Sincronizar contadores exactos de partidas, victorias, empates (tablas) y derrotas
        $this->syncUserStats($white);
        $this->syncUserStats($black);

        return [
            'white_change' => $deltaA,
            'black_change' => $deltaB,
        ];
    }

    /**
     * Sincroniza de forma autoritativa los contadores globales (total_games, total_wins,
     * total_draws, total_losses) y por ritmo (games_count, wins_count, draws_count, losses_count)
     * a partir de las partidas finalizadas en la base de datos.
     */
    public function syncUserStats(User $user): void
    {
        $completedGames = Game::with('gameMode:id,type')
            ->where('game_status', 'completed')
            ->where(function ($q) {
                $q->whereNull('end_reason')
                  ->orWhere('end_reason', '!=', 'aborted');
            })
            ->where(function ($q) use ($user) {
                $q->where('white_player_id', $user->id)
                  ->orWhere('black_player_id', $user->id);
            })
            ->get();

        $totalGames = 0;
        $totalWins = 0;
        $totalDraws = 0;
        $totalLosses = 0;

        $byMode = [
            'bullet' => ['games' => 0, 'wins' => 0, 'draws' => 0, 'losses' => 0],
            'blitz' => ['games' => 0, 'wins' => 0, 'draws' => 0, 'losses' => 0],
            'rapid' => ['games' => 0, 'wins' => 0, 'draws' => 0, 'losses' => 0],
            'classical' => ['games' => 0, 'wins' => 0, 'draws' => 0, 'losses' => 0],
        ];

        foreach ($completedGames as $g) {
            $modeType = $g->gameMode->type ?? 'blitz';
            if (!isset($byMode[$modeType])) {
                $byMode[$modeType] = ['games' => 0, 'wins' => 0, 'draws' => 0, 'losses' => 0];
            }

            $totalGames++;
            $byMode[$modeType]['games']++;

            if ($g->winner_id === null) {
                $totalDraws++;
                $byMode[$modeType]['draws']++;
            } elseif ((int) $g->winner_id === (int) $user->id) {
                $totalWins++;
                $byMode[$modeType]['wins']++;
            } else {
                $totalLosses++;
                $byMode[$modeType]['losses']++;
            }
        }

        if (
            (int) $user->total_games !== $totalGames ||
            (int) $user->total_wins !== $totalWins ||
            (int) $user->total_draws !== $totalDraws ||
            (int) $user->total_losses !== $totalLosses
        ) {
            $user->update([
                'total_games' => $totalGames,
                'total_wins' => $totalWins,
                'total_draws' => $totalDraws,
                'total_losses' => $totalLosses,
            ]);
        }

        foreach ($byMode as $type => $counts) {
            $ratingRow = UserRating::firstOrCreate(
                ['user_id' => $user->id, 'type' => $type],
                ['rating' => 1200, 'peak_rating' => 1200]
            );

            if (
                (int) $ratingRow->games_count !== $counts['games'] ||
                (int) $ratingRow->wins_count !== $counts['wins'] ||
                (int) $ratingRow->draws_count !== $counts['draws'] ||
                (int) $ratingRow->losses_count !== $counts['losses']
            ) {
                $ratingRow->update([
                    'games_count' => $counts['games'],
                    'wins_count' => $counts['wins'],
                    'draws_count' => $counts['draws'],
                    'losses_count' => $counts['losses'],
                ]);
            }
        }
    }
}
