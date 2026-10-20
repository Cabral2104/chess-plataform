<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameMove extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'game_id',
        'user_id',
        'move_number',
        'ply',
        'color',
        'from_square',
        'to_square',
        'piece',
        'captured_piece',
        'promotion',
        'san',
        'uci',
        'fen_after',
        'time_spent_ms',
        'remaining_time_ms',
        'status',
        'user_created',
        'user_edited',
    ];

    protected function casts(): array
    {
        return [
            'move_number' => 'integer',
            'ply' => 'integer',
            'time_spent_ms' => 'integer',
            'remaining_time_ms' => 'integer',
            'status' => 'integer',
        ];
    }

    /**
     * Partida a la que pertenece esta jugada.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Jugador que realizó el movimiento.
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
