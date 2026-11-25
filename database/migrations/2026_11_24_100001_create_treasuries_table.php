<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Treasuries (cash boxes / accounts) with one main treasury per region.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('treasuries', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('region', 10)->index();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('treasury_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treasury_id')->constrained()->restrictOnDelete();
            $table->string('type', 20);
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->string('note', 255)->nullable();
            $table->foreignId('transfer_treasury_id')->nullable()->constrained('treasuries')->nullOnDelete();
            $table->uuid('transfer_id')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['treasury_id', 'date']);
        });

        $now = now();

        DB::table('treasuries')->insert([
            ['name' => 'الخزينة الرئيسية', 'region' => 'east', 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'الخزينة الرئيسية', 'region' => 'west', 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treasury_transactions');
        Schema::dropIfExists('treasuries');
    }
};
