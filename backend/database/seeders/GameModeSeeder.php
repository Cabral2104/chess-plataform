<?php

namespace Database\Seeders;

use App\Models\GameMode;
use Illuminate\Database\Seeder;

class GameModeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modes = [
            [
                'name' => 'Bullet 1+0',
                'slug' => 'bullet-1-0',
                'type' => 'bullet',
                'initial_time_seconds' => 60,
                'increment_seconds' => 0,
                'is_rated_default' => true,
                'icon' => 'bolt',
                'description' => 'Partida hiper rápida de 1 minuto sin incremento',
            ],
            [
                'name' => 'Bullet 2+1',
                'slug' => 'bullet-2-1',
                'type' => 'bullet',
                'initial_time_seconds' => 120,
                'increment_seconds' => 1,
                'is_rated_default' => true,
                'icon' => 'bolt',
                'description' => '2 minutos con 1 segundo de incremento por jugada',
            ],
            [
                'name' => 'Blitz 3+0',
                'slug' => 'blitz-3-0',
                'type' => 'blitz',
                'initial_time_seconds' => 180,
                'increment_seconds' => 0,
                'is_rated_default' => true,
                'icon' => 'flame',
                'description' => 'Partida relámpago de 3 minutos',
            ],
            [
                'name' => 'Blitz 3+2',
                'slug' => 'blitz-3-2',
                'type' => 'blitz',
                'initial_time_seconds' => 180,
                'increment_seconds' => 2,
                'is_rated_default' => true,
                'icon' => 'flame',
                'description' => '3 minutos con 2 segundos de incremento (Estándar competitivo)',
            ],
            [
                'name' => 'Rapid 10+0',
                'slug' => 'rapid-10-0',
                'type' => 'rapid',
                'initial_time_seconds' => 600,
                'increment_seconds' => 0,
                'is_rated_default' => true,
                'icon' => 'clock',
                'description' => 'Partida rápida de 10 minutos',
            ],
            [
                'name' => 'Rapid 15+10',
                'slug' => 'rapid-15-10',
                'type' => 'rapid',
                'initial_time_seconds' => 900,
                'increment_seconds' => 10,
                'is_rated_default' => true,
                'icon' => 'clock',
                'description' => '15 minutos con 10 segundos de incremento para juego reflexivo',
            ],
        ];

        foreach ($modes as $mode) {
            GameMode::updateOrCreate(
                ['slug' => $mode['slug']],
                $mode
            );
        }
    }
}
