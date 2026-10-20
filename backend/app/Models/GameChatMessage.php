<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameChatMessage extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'game_id',
        'user_id',
        'message',
        'type',
        'status',
        'user_created',
        'user_edited',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
        ];
    }

    /**
     * Partida a la que pertenece el mensaje.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Usuario remitente (nullable si es mensaje automático del sistema).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
