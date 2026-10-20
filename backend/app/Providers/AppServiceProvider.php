<?php

namespace App\Providers;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Blueprint::macro('auditFields', function () {
            /** @var Blueprint $this */
            $this->smallInteger('status')->default(1)->comment('1: Activo, 0: Inactivo');
            $this->foreignId('user_created')->nullable()->constrained('users')->nullOnDelete();
            $this->foreignId('user_edited')->nullable()->constrained('users')->nullOnDelete();
            $this->timestamps();
            $this->softDeletes();
        });
    }
}
