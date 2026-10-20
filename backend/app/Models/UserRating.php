<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRating extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'user_id',
        'type',
        'rating',
        'peak_rating',
        'games_count',
        'wins_count',
        'losses_count',
        'draws_count',
        'status',
        'user_created',
        'user_edited',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'peak_rating' => 'integer',
            'games_count' => 'integer',
            'wins_count' => 'integer',
            'losses_count' => 'integer',
            'draws_count' => 'integer',
            'status' => 'integer',
        ];
    }

    /**
     * Usuario dueño de esta puntuación.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
