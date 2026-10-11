<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zonas_envio', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->decimal('precio', 8, 2)->default(8.00);
            $table->string('tiempo_estimado')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Seed common default delivery districts
        $distritos = [
            ['nombre' => 'Miraflores', 'precio' => 6.00, 'tiempo_estimado' => '25-40 min'],
            ['nombre' => 'San Isidro', 'precio' => 6.00, 'tiempo_estimado' => '30-45 min'],
            ['nombre' => 'Barranco', 'precio' => 7.00, 'tiempo_estimado' => '30-45 min'],
            ['nombre' => 'Surco', 'precio' => 8.00, 'tiempo_estimado' => '35-50 min'],
            ['nombre' => 'San Borja', 'precio' => 8.00, 'tiempo_estimado' => '35-50 min'],
            ['nombre' => 'Surquillo', 'precio' => 7.00, 'tiempo_estimado' => '30-45 min'],
            ['nombre' => 'Jesús María', 'precio' => 8.00, 'tiempo_estimado' => '35-50 min'],
            ['nombre' => 'Magdalena del Mar', 'precio' => 8.00, 'tiempo_estimado' => '35-50 min'],
            ['nombre' => 'Pueblo Libre', 'precio' => 8.00, 'tiempo_estimado' => '35-50 min'],
            ['nombre' => 'Lince', 'precio' => 8.00, 'tiempo_estimado' => '35-50 min'],
            ['nombre' => 'La Molina', 'precio' => 10.00, 'tiempo_estimado' => '45-60 min'],
            ['nombre' => 'San Miguel', 'precio' => 9.00, 'tiempo_estimado' => '40-55 min'],
            ['nombre' => 'Lima Cercado', 'precio' => 10.00, 'tiempo_estimado' => '45-60 min'],
        ];

        foreach ($distritos as $distrito) {
            DB::table('zonas_envio')->insert([
                ...$distrito,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zonas_envio');
    }
};
