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
        Schema::create('pedido_detalles_sabores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('sabor_id')->constrained('sabores')->cascadeOnDelete();
            $table->foreignId('pack_id')->nullable()->constrained('packs')->nullOnDelete();
            $table->unsignedInteger('cantidad')->default(1);
            $table->boolean('es_regalo')->default(false);
            $table->decimal('costo_extra_unitario', 8, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pedido_detalles_sabores');
    }
};
