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
        Schema::create('game_moves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedInteger('move_number'); // Número de turno completo (1, 2, 3...)
            $table->unsignedInteger('ply'); // Media jugada (1: e4, 2: e5, 3: Nf3...)
            $table->char('color', 1); // 'w' o 'b'
            $table->string('from_square', 2); // ej. 'e2'
            $table->string('to_square', 2); // ej. 'e4'
            $table->string('piece', 1); // 'p', 'n', 'b', 'r', 'q', 'k'
            $table->string('captured_piece', 1)->nullable(); // Material capturado para cálculo de ventaja
            $table->string('promotion', 1)->nullable(); // 'q', 'r', 'b', 'n'
            $table->string('san', 15); // Notación estándar: 'Nf3', 'O-O', 'Qxf7#'
            $table->string('uci', 5); // Coordenadas: 'e2e4', 'e7e8q'
            $table->text('fen_after'); // FEN resultante para permitir rebobinar la partida al instante
            $table->integer('time_spent_ms')->default(0); // Tiempo gastado en este movimiento
            $table->integer('remaining_time_ms'); // Tiempo restante del jugador tras mover

            // Auditoría
            $table->smallInteger('status')->default(1)->comment('1: Activo, 0: Inactivo');
            $table->foreignId('user_created')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_edited')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['game_id', 'ply']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_moves');
    }
};
