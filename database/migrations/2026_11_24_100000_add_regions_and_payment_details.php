<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * East/West regions, purchase vs expense groups and the employee's salary payment details.
 * Every existing row lands in the east region.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('region', 10)->default('east')->after('job_title')->index();
            $table->string('payment_method', 20)->default('cash')->after('base_salary');
            $table->string('account_number', 64)->nullable()->after('payment_method');
        });

        Schema::table('purchase_groups', function (Blueprint $table) {
            $table->string('region', 10)->default('east')->after('code')->index();
            $table->string('kind', 10)->default('purchase')->after('region')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_groups', function (Blueprint $table) {
            $table->dropIndex(['region']);
            $table->dropIndex(['kind']);
            $table->dropColumn(['region', 'kind']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['region']);
            $table->dropColumn(['region', 'payment_method', 'account_number']);
        });
    }
};
