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

        $modes = ['bullet', 'blitz', 'rapid', 'classical'];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Crear ratings iniciales de 1200 Elo por modalidad
            foreach ($modes as $type) {
                UserRating::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => $type,
                    ],
                    [
                        'rating' => 1200,
                        'peak_rating' => 1200,
                        'games_count' => 0,
                        'wins_count' => 0,
                        'losses_count' => 0,
                        'draws_count' => 0,
                    ]
                );
            }
        }
    }
}
