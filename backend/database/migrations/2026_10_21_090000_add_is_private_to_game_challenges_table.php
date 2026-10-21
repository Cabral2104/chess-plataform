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
        Schema::table('game_challenges', function (Blueprint $table) {
            $table->boolean('is_private')->default(false)->after('is_rated')->comment('true: Solo accesible con enlace/código directo, false: Visible en retos públicos en vivo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_challenges', function (Blueprint $table) {
            $table->dropColumn('is_private');
        });
    }
};
