<?php

namespace App\Events;

use App\Models\GameChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSentEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $gameCode;
    public GameChatMessage $message;

    public function __construct(string $gameCode, GameChatMessage $message)
    {
        $this->gameCode = $gameCode;
        $this->message = $message;
    }

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('game.' . $this->gameCode);
    }

    public function broadcastAs(): string
    {
        return 'ChatMessageSent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message->load('user'),
        ];
    }
}
