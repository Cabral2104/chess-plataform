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
        Schema::create('game_modes', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // ej. "Blitz 3+2"
            $table->string('slug')->unique(); // ej. "blitz-3-2"
            $table->string('type'); // bullet, blitz, rapid, classical, custom
            $table->integer('initial_time_seconds'); // 180 (3 min)
            $table->integer('increment_seconds')->default(0); // 2 (+2s por jugada)
            $table->boolean('is_rated_default')->default(true);
            $table->string('icon')->nullable(); // Identificador o SVG del icono para el frontend
            $table->string('description')->nullable();

            // Auditoría
            $table->smallInteger('status')->default(1)->comment('1: Activo, 0: Inactivo');
            $table->foreignId('user_created')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_edited')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_modes');
    }
};
