<?php

namespace App\Events;

use App\Models\GameMove;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MoveMadeEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $gameCode;
    public GameMove $move;
    public string $fen;
    public string $currentTurn;
    public int $whiteTimeLeftMs;
    public int $blackTimeLeftMs;
    public int $moveCount;

    public function __construct(
        string $gameCode,
        GameMove $move,
        string $fen,
        string $currentTurn,
        int $whiteTimeLeftMs,
        int $blackTimeLeftMs,
        int $moveCount
    ) {
        $this->gameCode = $gameCode;
        $this->move = $move;
        $this->fen = $fen;
        $this->currentTurn = $currentTurn;
        $this->whiteTimeLeftMs = $whiteTimeLeftMs;
        $this->blackTimeLeftMs = $blackTimeLeftMs;
        $this->moveCount = $moveCount;
    }

    /**
     * Canal de presencia exclusivo para la partida.
     */
    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('presence-game.' . $this->gameCode);
    }

    /**
     * Nombre limpio del evento para el frontend.
     */
    public function broadcastAs(): string
    {
        return 'MoveMade';
    }

    /**
     * Carga útil (payload) enviada a los suscriptores.
     */
    public function broadcastWith(): array
    {
        return [
            'move' => $this->move,
            'fen' => $this->fen,
            'current_turn' => $this->currentTurn,
            'white_time_left_ms' => $this->whiteTimeLeftMs,
            'black_time_left_ms' => $this->blackTimeLeftMs,
            'move_count' => $this->moveCount,
        ];
    }
}
