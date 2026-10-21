<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRating;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Modos de juego
        $this->call(GameModeSeeder::class);

        // 2. Usuarios de prueba
        $users = [
            [
                'name' => 'Carlos Player',
                'username' => 'jugador1',
                'email' => 'jugador1@chess.local',
                'password' => Hash::make('password123'),
                'avatar_url' => 'https://api.dicebear.com/7.x/bottts/svg?seed=jugador1',
                'presence_status' => 'offline',
                'total_games' => 0,
                'total_wins' => 0,
                'total_losses' => 0,
                'total_draws' => 0,
            ],
            [
                'name' => 'Ana Rival',
                'username' => 'jugador2',
                'email' => 'jugador2@chess.local',
                'password' => Hash::make('password123'),
                'avatar_url' => 'https://api.dicebear.com/7.x/bottts/svg?seed=jugador2',
                'presence_status' => 'offline',
                'total_games' => 0,
                'total_wins' => 0,
                'total_losses' => 0,
                'total_draws' => 0,
            ],
        ];

        $ratingsData = [
            'jugador1@chess.local' => [
                'total_games' => 14,
                'total_wins' => 9,
                'total_losses' => 3,
                'total_draws' => 2,
                'ratings' => [
                    'blitz' => ['rating' => 1450, 'games' => 8, 'wins' => 6, 'losses' => 1, 'draws' => 1],
                    'bullet' => ['rating' => 1380, 'games' => 3, 'wins' => 2, 'losses' => 1, 'draws' => 0],
                    'rapid' => ['rating' => 1520, 'games' => 3, 'wins' => 1, 'losses' => 1, 'draws' => 1],
                    'classical' => ['rating' => 1400, 'games' => 0, 'wins' => 0, 'losses' => 0, 'draws' => 0],
                ]
            ],
            'jugador2@chess.local' => [
                'total_games' => 12,
                'total_wins' => 7,
                'total_losses' => 4,
                'total_draws' => 1,
                'ratings' => [
                    'blitz' => ['rating' => 1390, 'games' => 6, 'wins' => 4, 'losses' => 2, 'draws' => 0],
                    'bullet' => ['rating' => 1430, 'games' => 4, 'wins' => 2, 'losses' => 1, 'draws' => 1],
                    'rapid' => ['rating' => 1410, 'games' => 2, 'wins' => 1, 'losses' => 1, 'draws' => 0],
                    'classical' => ['rating' => 1350, 'games' => 0, 'wins' => 0, 'losses' => 0, 'draws' => 0],
                ]
            ]
        ];

        foreach ($users as $userData) {
            $userRatingsInfo = $ratingsData[$userData['email']] ?? null;

            if ($userRatingsInfo) {
                $userData['total_games'] = $userRatingsInfo['total_games'];
                $userData['total_wins'] = $userRatingsInfo['total_wins'];
                $userData['total_losses'] = $userRatingsInfo['total_losses'];
                $userData['total_draws'] = $userRatingsInfo['total_draws'];
            }

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            $modes = ['bullet', 'blitz', 'rapid', 'classical'];

            foreach ($modes as $type) {
                $rInfo = $userRatingsInfo['ratings'][$type] ?? null;
                $ratingVal = $rInfo['rating'] ?? 1200;

                UserRating::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => $type,
                    ],
                    [
                        'rating' => $ratingVal,
                        'peak_rating' => max(1200, $ratingVal),
                        'games_count' => $rInfo['games'] ?? 0,
                        'wins_count' => $rInfo['wins'] ?? 0,
                        'losses_count' => $rInfo['losses'] ?? 0,
                        'draws_count' => $rInfo['draws'] ?? 0,
                        'status' => 1,
                    ]
                );
            }
        }
    }
}
