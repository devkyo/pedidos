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
        Schema::table('pedidos', function (Blueprint $table) {
            $table->string('direccion_entrega')->nullable()->after('tipo_entrega');
            $table->string('zona_envio')->nullable()->after('direccion_entrega');
            $table->decimal('costo_envio', 8, 2)->nullable()->after('zona_envio');
            $table->text('notas')->nullable()->after('costo_envio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn(['direccion_entrega', 'zona_envio', 'costo_envio', 'notas']);
        });
    }
};
