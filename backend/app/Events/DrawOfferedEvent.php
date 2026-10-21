<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DrawOfferedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $gameCode;
    public int $offeredBy;

    public function __construct(string $gameCode, int $offeredBy)
    {
        $this->gameCode = $gameCode;
        $this->offeredBy = $offeredBy;
    }

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('game.' . $this->gameCode);
    }

    public function broadcastAs(): string
    {
        return 'DrawOffered';
    }

    public function broadcastWith(): array
    {
        return [
            'offered_by' => $this->offeredBy,
        ];
    }
}
