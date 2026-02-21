<?php

namespace App\Providers;

use App\Events\DashboardSummaryUpdated;
use App\Models\Book;
use App\Models\Bookcase;
use App\Models\Campus;
use App\Models\Category;
use App\Models\Shelf;
use App\Models\SubCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

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
        Schema::defaultStringLength(191);
        $this->registerDashboardSummaryModelEvents();
    }

    private function registerDashboardSummaryModelEvents(): void
    {
        /**
         * Only include models that affect dashboard summary counts:
         * total books, physical/ebook, categories, subcategories, bookcases, shelves,
         * users, roles, permissions, campuses.
         */
        Book::created(function (Book $book): void {
            unset($book);
            broadcast(new DashboardSummaryUpdated('book.created'));
        });

        Book::updated(function (Book $book): void {
            if (! $book->wasChanged(['type', 'is_deleted', 'campus_id'])) {
                return;
            }

            broadcast(new DashboardSummaryUpdated('book.updated'));
        });

        Book::deleted(function (Book $book): void {
            unset($book);
            broadcast(new DashboardSummaryUpdated('book.deleted'));
        });

        User::updated(function (User $user): void {
            if (! $user->wasChanged(['isActive'])) {
                return;
            }

            broadcast(new DashboardSummaryUpdated('user.updated'));
        });

        $eventsByModel = [
            Category::class => ['created', 'deleted'],
            SubCategory::class => ['created', 'deleted'],
            Bookcase::class => ['created', 'deleted'],
            Shelf::class => ['created', 'deleted'],
            Campus::class => ['created', 'deleted'],
            User::class => ['created', 'deleted'],
            Role::class => ['created', 'deleted'],
            Permission::class => ['created', 'deleted'],
        ];

        foreach ($eventsByModel as $modelClass => $events) {
            foreach ($events as $eventName) {
                $source = strtolower(class_basename($modelClass)).'.'.$eventName;

                $modelClass::{$eventName}(function (Model $model) use ($source): void {
                    unset($model);
                    broadcast(new DashboardSummaryUpdated($source));
                });
            }
        }
    }
}
