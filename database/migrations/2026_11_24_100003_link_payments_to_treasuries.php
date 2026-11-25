<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Every outgoing payment points at the treasury (or custody) it came from.
 * Existing salary payments and invoices are linked to the east main treasury.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->foreignId('treasury_id')->nullable()->after('paid_amount')->constrained()->restrictOnDelete();
            $table->string('payment_method', 20)->nullable()->after('treasury_id');
            $table->string('account_number', 64)->nullable()->after('payment_method');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('treasury_id')->nullable()->after('price')->constrained()->restrictOnDelete();
            $table->foreignId('custody_id')->nullable()->after('treasury_id')->constrained('custodies')->restrictOnDelete();
            $table->foreignId('custody_movement_id')->nullable()->after('custody_id')->constrained('custody_movements')->nullOnDelete();
        });

        $eastMain = DB::table('treasuries')->where('region', 'east')->orderBy('id')->value('id');

        DB::table('payroll_records')
            ->where('paid_amount', '>', 0)
            ->update(['treasury_id' => $eastMain, 'payment_method' => 'cash']);

        DB::table('invoices')->update(['treasury_id' => $eastMain]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('custody_movement_id');
            $table->dropConstrainedForeignId('custody_id');
            $table->dropConstrainedForeignId('treasury_id');
        });

        Schema::table('payroll_records', function (Blueprint $table) {
            $table->dropConstrainedForeignId('treasury_id');
            $table->dropColumn(['payment_method', 'account_number']);
        });
    }
};
