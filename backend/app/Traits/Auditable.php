<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    use SoftDeletes;

    /**
     * Boot the Auditable trait for the model.
     */
    protected static function bootAuditable(): void
    {
        static::creating(function ($model) {
            if (Auth::check() && empty($model->user_created)) {
                $model->user_created = Auth::id();
            }

            if ($model->status === null) {
                $model->status = 1;
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->user_edited = Auth::id();
            }
        });
    }

    /**
     * Scope a query to only include active records (status = 1).
     */
    public function scopeActive($query)
    {
        return $query->where($this->getTable() . '.status', 1);
    }

    /**
     * Get the user who created this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_created');
    }

    /**
     * Get the user who last updated this record.
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_edited');
    }
}
