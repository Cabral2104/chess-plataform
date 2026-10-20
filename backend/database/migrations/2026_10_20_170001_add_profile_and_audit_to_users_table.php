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
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->nullable()->after('name');
            $table->string('avatar_url')->nullable()->after('password');
            $table->string('presence_status')->default('offline')->after('avatar_url');
            $table->unsignedInteger('total_games')->default(0)->after('presence_status');
            $table->unsignedInteger('total_wins')->default(0)->after('total_games');
            $table->unsignedInteger('total_losses')->default(0)->after('total_wins');
            $table->unsignedInteger('total_draws')->default(0)->after('total_losses');
            $table->timestamp('last_seen_at')->nullable()->after('total_draws');

            // Campos de auditoría
            $table->smallInteger('status')->default(1)->after('last_seen_at')->comment('1: Activo, 0: Inactivo');
            $table->foreignId('user_created')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->foreignId('user_edited')->nullable()->after('user_created')->constrained('users')->nullOnDelete();
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['user_created']);
            $table->dropForeign(['user_edited']);
            $table->dropColumn([
                'username',
                'avatar_url',
                'presence_status',
                'total_games',
                'total_wins',
                'total_losses',
                'total_draws',
                'last_seen_at',
                'status',
                'user_created',
                'user_edited',
                'deleted_at',
            ]);
        });
    }
};
