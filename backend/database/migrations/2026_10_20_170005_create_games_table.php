<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique(); // Código para URLs y canales WebSocket presence-game.{code}
            $table->foreignId('white_player_id')->constrained('users');
            $table->foreignId('black_player_id')->nullable()->constrained('users');
            $table->foreignId('winner_id')->nullable()->constrained('users');
            $table->foreignId('game_mode_id')->constrained('game_modes');
            $table->foreignId('challenge_id')->nullable()->constrained('game_challenges');
            $table->boolean('is_rated')->default(true);
            $table->string('game_status')->default('waiting'); // waiting, in_progress, completed, aborted
            $table->string('end_reason')->nullable(); // checkmate, resignation, timeout, stalemate, etc.
            
            // Estado autoritativo del tablero
            $table->text('fen')->default('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            $table->text('pgn')->nullable();
            $table->char('current_turn', 1)->default('w'); // 'w' o 'b'
            $table->unsignedInteger('move_count')->default(0);

            // Sincronización atómica de tiempos
            $table->integer('white_time_left_ms');
            $table->integer('black_time_left_ms');
            $table->timestamp('last_move_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            // Puntuación Elo y acuerdos
            $table->integer('white_rating_change')->nullable();
            $table->integer('black_rating_change')->nullable();
            $table->foreignId('draw_offered_by')->nullable()->constrained('users');

            // Auditoría
            $table->smallInteger('status')->default(1)->comment('1: Activo, 0: Inactivo');
            $table->foreignId('user_created')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_edited')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['game_status', 'code']);
            $table->index('white_player_id');
            $table->index('black_player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
