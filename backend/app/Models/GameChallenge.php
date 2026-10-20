<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GameChallenge extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'code',
        'challenger_id',
        'challenged_id',
        'game_mode_id',
        'color_preference',
        'is_rated',
        'challenge_status',
        'expires_at',
        'status',
        'user_created',
        'user_edited',
    ];

    protected function casts(): array
    {
        return [
            'is_rated' => 'boolean',
            'expires_at' => 'datetime',
            'status' => 'integer',
        ];
    }

    /**
     * Usuario que emite el reto.
     */
    public function challenger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'challenger_id');
    }

    /**
     * Usuario desafiado (nullable si es sala abierta con código).
     */
    public function challenged(): BelongsTo
    {
        return $this->belongsTo(User::class, 'challenged_id');
    }

    /**
     * Modalidad del reto.
     */
    public function gameMode(): BelongsTo
    {
        return $this->belongsTo(GameMode::class);
    }

    /**
     * Partida generada tras aceptar el reto.
     */
    public function game(): HasOne
    {
        return $this->hasOne(Game::class, 'challenge_id');
    }
}
