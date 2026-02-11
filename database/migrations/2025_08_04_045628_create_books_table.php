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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('description')->nullable();
            $table->integer('page_count');
            $table->string('publisher');
            $table->year('published_at')->nullable()->change();
            $table->enum('language', ['kh', 'en'])->default('kh');
            $table->enum('program', ['Cambodia', 'American'])->nullable();
            $table->year('published_at')->nullable(); // publish year
            $table->string('cover')->nullable();
            $table->string('pdf_url')->nullable();
            $table->string('flip_link')->nullable();
            $table->integer('view')->default(0);
            $table->boolean('is_available')->default(false);
            $table->string('author')->nullable();
            $table->string('code', 10)->unique();
            $table->string('isbn', 13)->unique()->nullable();
            $table->enum('type', ['physical', 'ebook'])->default('physical');
            $table->tinyInteger('downloadable')->default(0);
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('category_id')->constrained('categories');
            $table->foreignId('subcategory_id')->nullable()->constrained('sub_categories')->nullOnDelete();
            $table->foreignId('shelf_id')->nullable()->constrained('shelves')->nullOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->foreignId('campus_id')->nullable()->constrained('campuses')->cascadeOnDelete();
            $table->foreignId('bookcase_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->tinyInteger('is_deleted')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
