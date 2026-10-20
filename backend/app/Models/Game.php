<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'code',
        'white_player_id',
        'black_player_id',
        'winner_id',
        'game_mode_id',
        'challenge_id',
        'is_rated',
        'game_status',
        'end_reason',
        'fen',
        'pgn',
        'current_turn',
        'move_count',
        'white_time_left_ms',
        'black_time_left_ms',
        'last_move_at',
        'started_at',
        'ended_at',
        'white_rating_change',
        'black_rating_change',
        'draw_offered_by',
        'status',
        'user_created',
        'user_edited',
    ];

    protected function casts(): array
    {
        return [
            'is_rated' => 'boolean',
            'move_count' => 'integer',
            'white_time_left_ms' => 'integer',
            'black_time_left_ms' => 'integer',
            'white_rating_change' => 'integer',
            'black_rating_change' => 'integer',
            'last_move_at' => 'datetime',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'status' => 'integer',
        ];
    }

    /**
     * Jugador con piezas blancas.
     */
    public function whitePlayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'white_player_id');
    }

    /**
     * Jugador con piezas negras.
     */
    public function blackPlayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'black_player_id');
    }

    /**
     * Ganador de la partida (null en tablas o partida en curso).
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    /**
     * Modalidad de la partida.
     */
    public function gameMode(): BelongsTo
    {
        return $this->belongsTo(GameMode::class);
    }

    /**
     * Reto que dio origen a la partida (si aplica).
     */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(GameChallenge::class, 'challenge_id');
    }

    /**
     * Jugador que ha propuesto tablas.
     */
    public function drawOfferedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'draw_offered_by');
    }

    /**
     * Movimientos registrados en la partida.
     */
    public function moves(): HasMany
    {
        return $this->hasMany(GameMove::class)->orderBy('ply', 'asc');
    }

    /**
     * Mensajes del chat en vivo y del sistema.
     */
    public function chatMessages(): HasMany
    {
        return $this->hasMany(GameChatMessage::class)->orderBy('created_at', 'asc');
    }
}
