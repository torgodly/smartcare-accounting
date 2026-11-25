<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Custodies (petty-cash floats) on the imprest system: issue, spend with invoices, replenish, close.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('custodies', function (Blueprint $table) {
            $table->id();
            $table->string('holder_name', 120);
            $table->string('title', 160)->nullable();
            $table->string('region', 10)->index();
            $table->foreignId('treasury_id')->constrained()->restrictOnDelete();
            $table->string('status', 10)->default('open')->index();
            $table->date('closed_on')->nullable();
            $table->timestamps();
        });

        Schema::create('custody_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('custody_id')->constrained('custodies')->cascadeOnDelete();
            $table->foreignId('treasury_id')->constrained()->restrictOnDelete();
            $table->string('type', 20);
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->string('note', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['treasury_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custody_movements');
        Schema::dropIfExists('custodies');
    }
};
