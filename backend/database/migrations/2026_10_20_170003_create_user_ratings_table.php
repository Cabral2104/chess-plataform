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
        Schema::create('user_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // bullet, blitz, rapid, classical
            $table->integer('rating')->default(1200);
            $table->integer('peak_rating')->default(1200);
            $table->unsignedInteger('games_count')->default(0);
            $table->unsignedInteger('wins_count')->default(0);
            $table->unsignedInteger('losses_count')->default(0);
            $table->unsignedInteger('draws_count')->default(0);

            // Auditoría
            $table->smallInteger('status')->default(1)->comment('1: Activo, 0: Inactivo');
            $table->foreignId('user_created')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_edited')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'type']);
            $table->index(['type', 'rating']); // Optimizado para el Leaderboard
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_ratings');
    }
};
