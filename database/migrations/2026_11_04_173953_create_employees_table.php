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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('job_title', 120)->nullable();
            $table->decimal('base_salary', 12, 2);
            $table->char('start_month', 7);
            $table->enum('attendance_mode', ['time', 'notime', 'none'])->default('time');
            $table->time('shift_start')->nullable();
            $table->time('shift_end')->nullable();
            $table->decimal('absence_day_rate', 12, 2)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
