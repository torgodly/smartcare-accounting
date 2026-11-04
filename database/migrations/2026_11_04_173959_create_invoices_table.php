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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_group_id')->constrained()->cascadeOnDelete();
            $table->char('month', 7);
            $table->integer('sequence');
            $table->string('serial', 20)->unique();
            $table->string('title', 160);
            $table->decimal('price', 12, 2);
            $table->text('reason')->nullable();
            $table->enum('type', ['once', 'recurring']);
            $table->foreignId('recurring_root_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->boolean('is_auto')->default(false);
            $table->foreignUuid('receipt_id')->nullable()->constrained('receipts')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['purchase_group_id', 'month', 'sequence']);
            $table->unique(['recurring_root_id', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
