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
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_orden')->unique();
            $table->string('cliente_nombre');
            $table->string('cliente_telefono');
            $table->string('telefono_respaldo')->nullable();
            $table->string('tipo_entrega', 30)->default('delivery');
            $table->decimal('total', 8, 2);
            $table->dateTime('fecha_pedido')->index();
            $table->enum('estado', ['pendiente', 'confirmado', 'entregado', 'cancelado'])->default('pendiente')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
