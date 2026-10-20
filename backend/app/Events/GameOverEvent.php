<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameOverEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $gameCode;
    public ?int $winnerId;
    public string $endReason;
    public ?int $whiteRatingChange;
    public ?int $blackRatingChange;

    public function __construct(
        string $gameCode,
        ?int $winnerId,
        string $endReason,
        ?int $whiteRatingChange = null,
        ?int $blackRatingChange = null
    ) {
        $this->gameCode = $gameCode;
        $this->winnerId = $winnerId;
        $this->endReason = $endReason;
        $this->whiteRatingChange = $whiteRatingChange;
        $this->blackRatingChange = $blackRatingChange;
    }

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('presence-game.' . $this->gameCode);
    }

    public function broadcastAs(): string
    {
        return 'GameOver';
    }

    public function broadcastWith(): array
    {
        return [
            'winner_id' => $this->winnerId,
            'end_reason' => $this->endReason,
            'game_status' => 'completed',
            'white_rating_change' => $this->whiteRatingChange,
            'black_rating_change' => $this->blackRatingChange,
        ];
    }
}
