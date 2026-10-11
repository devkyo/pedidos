<?php

namespace Database\Seeders;

use App\Models\Pack;
use App\Models\Sabor;
use Illuminate\Database\Seeder;

class TiendaMarcianosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default Packs as specified in business rules
        $packs = [
            [
                'nombre' => 'Pack 7 Marcianos',
                'precio' => 29.00,
                'cantidad_marcianos' => 7,
                'cantidad_regalo' => 1,
                'activo' => true,
            ],
            [
                'nombre' => 'Pack 14 Marcianos',
                'precio' => 49.00,
                'cantidad_marcianos' => 14,
                'cantidad_regalo' => 2,
                'activo' => true,
            ],
            [
                'nombre' => 'Pack 24 Marcianos',
                'precio' => 79.00,
                'cantidad_marcianos' => 24,
                'cantidad_regalo' => 2,
                'activo' => true,
            ],
            [
                'nombre' => 'Pack 45 Marcianos (Fiesta)',
                'precio' => 139.00,
                'cantidad_marcianos' => 45,
                'cantidad_regalo' => 2,
                'activo' => true,
            ],
        ];

        foreach ($packs as $pack) {
            Pack::firstOrCreate(['nombre' => $pack['nombre']], $pack);
        }

        // Artisanal and Premium Flavors
        $sabores = [
            [
                'nombre' => 'Fresa con Leche Condensada',
                'descripcion' => 'Fresas naturales de valle con base de leche condensada artesanal.',
                'imagen' => 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Mango Maracuyá Tropical',
                'descripcion' => 'Pulpas 100% naturales, refrescante toque ácido y dulce.',
                'imagen' => 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Lúcuma de Seda con Manjar',
                'descripcion' => 'Pura lúcuma fresca con corazón de manjar blanco de olla.',
                'imagen' => 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Chicha Morada Especial',
                'descripcion' => 'Maíz morado selecto con piña, manzana, canela y gotas de limón.',
                'imagen' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Chocolate Sublime Intenso',
                'descripcion' => 'Cacao peruano con trozos de maní tostado y leche evaporada.',
                'imagen' => 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Coco Cremoso Tostado',
                'descripcion' => 'Ralladura fina de coco natural y leche de coco aromatizada.',
                'imagen' => 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Oreo Cookies & Cream',
                'descripcion' => 'Generosos trozos de galleta Oreo en crema suave de vainilla.',
                'imagen' => 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
                'es_premium' => false,
                'precio_adicional' => 0.00,
                'stock_activo' => true,
            ],
            // Premium Flavors
            [
                'nombre' => 'Baileys Irish Cream Original ⭐',
                'descripcion' => 'Licor de crema irlandesa Baileys original con toque de café espresso.',
                'imagen' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
                'es_premium' => true,
                'precio_adicional' => 1.50,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Nutella Avellana Crunch ⭐',
                'descripcion' => 'Generosa capa de Nutella pura con crocante de avellanas tostadas.',
                'imagen' => 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
                'es_premium' => true,
                'precio_adicional' => 2.00,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Pisco Sour Criollo ⭐',
                'descripcion' => 'Pisco Quebranta selecto, jarabe de goma y limón sutil recién exprimido.',
                'imagen' => 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
                'es_premium' => true,
                'precio_adicional' => 2.50,
                'stock_activo' => true,
            ],
            [
                'nombre' => 'Pistacho Siciliano Supremo ⭐',
                'descripcion' => 'Crema 100% pistacho importado con tropezones crocantes.',
                'imagen' => 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=400&q=80',
                'es_premium' => true,
                'precio_adicional' => 2.00,
                'stock_activo' => true,
            ],
        ];

        foreach ($sabores as $sabor) {
            Sabor::firstOrCreate(['nombre' => $sabor['nombre']], $sabor);
        }
    }
}
