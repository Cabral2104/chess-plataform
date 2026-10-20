<?php

namespace App\Models;

use App\Traits\Auditable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, Auditable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'avatar_url',
        'presence_status',
        'total_games',
        'total_wins',
        'total_losses',
        'total_draws',
        'last_seen_at',
        'status',
        'user_created',
        'user_edited',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
            'status' => 'integer',
            'total_games' => 'integer',
            'total_wins' => 'integer',
            'total_losses' => 'integer',
            'total_draws' => 'integer',
        ];
    }

    /**
     * Puntuaciones Elo del usuario por modalidad.
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(UserRating::class);
    }

    /**
     * Partidas donde jugó con piezas blancas.
     */
    public function gamesAsWhite(): HasMany
    {
        return $this->hasMany(Game::class, 'white_player_id');
    }

    /**
     * Partidas donde jugó con piezas negras.
     */
    public function gamesAsBlack(): HasMany
    {
        return $this->hasMany(Game::class, 'black_player_id');
    }

    /**
     * Retos creados por este usuario.
     */
    public function createdChallenges(): HasMany
    {
        return $this->hasMany(GameChallenge::class, 'challenger_id');
    }

    /**
     * Retos recibidos por este usuario.
     */
    public function receivedChallenges(): HasMany
    {
        return $this->hasMany(GameChallenge::class, 'challenged_id');
    }
}
