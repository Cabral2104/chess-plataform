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
        Schema::create('game_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // Código corto para unirse mediante enlace
            $table->foreignId('challenger_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('challenged_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('game_mode_id')->constrained('game_modes');
            $table->string('color_preference')->default('random'); // white, black, random
            $table->boolean('is_rated')->default(true);
            $table->string('challenge_status')->default('pending'); // pending, accepted, declined, expired, canceled
            $table->timestamp('expires_at')->nullable();

            // Auditoría
            $table->smallInteger('status')->default(1)->comment('1: Activo, 0: Inactivo');
            $table->foreignId('user_created')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_edited')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['challenge_status', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_challenges');
    }
};
