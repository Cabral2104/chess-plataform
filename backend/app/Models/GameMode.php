<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameMode extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'initial_time_seconds',
        'increment_seconds',
        'is_rated_default',
        'icon',
        'description',
        'status',
        'user_created',
        'user_edited',
    ];

    protected function casts(): array
    {
        return [
            'initial_time_seconds' => 'integer',
            'increment_seconds' => 'integer',
            'is_rated_default' => 'boolean',
            'status' => 'integer',
        ];
    }

    /**
     * Partidas jugadas bajo esta modalidad.
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }

    /**
     * Retos generados para esta modalidad.
     */
    public function challenges(): HasMany
    {
        return $this->hasMany(GameChallenge::class);
    }
}
