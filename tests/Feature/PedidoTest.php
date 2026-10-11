<?php

use App\Models\Pack;
use App\Models\Pedido;
use App\Models\Sabor;
use Inertia\Testing\AssertableInertia as Assert;

test('la pagina principal carga los packs y sabores activos en inertia', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('ArmaTuPack')
        ->has('packs')
        ->has('sabores')
        ->has('whatsappPhone')
    );
});

test('crea un pedido exitosamente y calcula recargos de sabores premium regulares y de regalo', function () {
    $pack = Pack::where('cantidad_marcianos', 7)->first() ?? Pack::create([
        'nombre' => 'Pack 7',
        'precio' => 29.00,
        'cantidad_marcianos' => 7,
        'cantidad_regalo' => 1,
        'activo' => true,
    ]);

    $saborClasico = Sabor::where('es_premium', false)->first() ?? Sabor::create([
        'nombre' => 'Fresa Clásica',
        'es_premium' => false,
        'precio_adicional' => 0.00,
        'stock_activo' => true,
    ]);

    $saborPremium = Sabor::where('es_premium', true)->first() ?? Sabor::create([
        'nombre' => 'Baileys Premium',
        'es_premium' => true,
        'precio_adicional' => 1.50,
        'stock_activo' => true,
    ]);

    // 5 clasicos + 2 premium en el pack (total 7 marcianos)
    // 1 premium de regalo (debe cobrar el recargo de 1.50 aunque el marciano sea gratis)
    // Total esperado: 29.00 (pack) + (2 * 1.50) (pack premium) + (1 * 1.50) (regalo premium) = 33.50
    $payload = [
        'cliente_dni' => '12345678',
        'cliente_nombre' => 'Carlos Mendoza',
        'cliente_telefono' => '987654321',
        'telefono_respaldo' => '912345678',
        'tipo_entrega' => 'delivery',
        'pack_id' => $pack->id,
        'sabores_pack' => [
            ['sabor_id' => $saborClasico->id, 'cantidad' => 5],
            ['sabor_id' => $saborPremium->id, 'cantidad' => 2],
        ],
        'sabores_regalo' => [
            ['sabor_id' => $saborPremium->id, 'cantidad' => 1],
        ],
    ];

    $response = $this->postJson(route('pedidos.store'), $payload);

    $response->assertCreated();
    $response->assertJson([
        'status' => 'success',
        'total' => '33.50',
    ]);

    $this->assertDatabaseHas('pedidos', [
        'cliente_dni' => '12345678',
        'cliente_nombre' => 'Carlos Mendoza',
        'cliente_telefono' => '987654321',
        'total' => 33.50,
        'estado' => 'pendiente',
    ]);

    $pedido = Pedido::where('cliente_nombre', 'Carlos Mendoza')->first();
    expect($pedido->detalles)->toHaveCount(3);
});

test('rechaza pedido si la cantidad de marcianos no coincide con la capacidad del pack', function () {
    $pack = Pack::firstOrCreate(
        ['nombre' => 'Pack 7'],
        ['precio' => 29.00, 'cantidad_marcianos' => 7, 'cantidad_regalo' => 1, 'activo' => true]
    );

    $sabor = Sabor::firstOrCreate(
        ['nombre' => 'Fresa Clásica'],
        ['es_premium' => false, 'precio_adicional' => 0.00, 'stock_activo' => true]
    );

    $payload = [
        'cliente_dni' => '87654321',
        'cliente_nombre' => 'Ana Gómez',
        'cliente_telefono' => '999888777',
        'tipo_entrega' => 'recojo',
        'pack_id' => $pack->id,
        'sabores_pack' => [
            ['sabor_id' => $sabor->id, 'cantidad' => 4], // 4 en vez de 7
        ],
    ];

    $response = $this->postJson(route('pedidos.store'), $payload);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['sabores_pack']);
});

test('endpoint de verificar-dni detecta si es primera compra o cliente recurrente', function () {
    // DNI sin pedidos previos
    $response = $this->getJson(route('pedidos.verificar-dni', ['dni' => '77889900']));
    $response->assertOk();
    $response->assertJson([
        'valido' => true,
        'es_primera_compra' => true,
        'tiene_historial' => false,
    ]);

    // Crear un pedido previo con ese DNI
    Pedido::create([
        'codigo_orden' => Pedido::generarCodigoOrden(),
        'cliente_dni' => '77889900',
        'cliente_nombre' => 'Cliente Existente',
        'cliente_telefono' => '911223344',
        'tipo_entrega' => 'delivery',
        'total' => 30.00,
        'fecha_pedido' => now(),
        'estado' => 'confirmado',
    ]);

    // Consultar de nuevo: ahora debe detectar historial
    $response2 = $this->getJson(route('pedidos.verificar-dni', ['dni' => '77889900']));
    $response2->assertOk();
    $response2->assertJson([
        'valido' => true,
        'es_primera_compra' => false,
        'tiene_historial' => true,
    ]);

    // DNI inválido (menos de 8 dígitos)
    $responseInvalido = $this->getJson(route('pedidos.verificar-dni', ['dni' => '123']));
    $responseInvalido->assertUnprocessable();
});

test('anula marciano de cortesia si el dni ya cuenta con historial de pedidos', function () {
    $pack = Pack::firstOrCreate(
        ['nombre' => 'Pack 7'],
        ['precio' => 29.00, 'cantidad_marcianos' => 7, 'cantidad_regalo' => 1, 'activo' => true]
    );

    $sabor = Sabor::firstOrCreate(
        ['nombre' => 'Fresa Clásica'],
        ['es_premium' => false, 'precio_adicional' => 0.00, 'stock_activo' => true]
    );

    $dniFrecuente = '44556677';

    // Pedido anterior registrado
    Pedido::create([
        'codigo_orden' => Pedido::generarCodigoOrden(),
        'cliente_dni' => $dniFrecuente,
        'cliente_nombre' => 'Pedro Antiguo',
        'cliente_telefono' => '955443322',
        'tipo_entrega' => 'delivery',
        'total' => 29.00,
        'fecha_pedido' => now(),
        'estado' => 'entregado',
    ]);

    // Intenta hacer un nuevo pedido enviando sabores de regalo
    $payload = [
        'cliente_dni' => $dniFrecuente,
        'cliente_nombre' => 'Pedro Antiguo',
        'cliente_telefono' => '955443322',
        'tipo_entrega' => 'delivery',
        'pack_id' => $pack->id,
        'sabores_pack' => [
            ['sabor_id' => $sabor->id, 'cantidad' => 7],
        ],
        'sabores_regalo' => [
            ['sabor_id' => $sabor->id, 'cantidad' => 1],
        ],
    ];

    $response = $this->postJson(route('pedidos.store'), $payload);
    $response->assertCreated();

    // El pedido debe haberse creado, pero SIN los detalles de regalo (solo los 7 del pack)
    $nuevoPedido = Pedido::where('cliente_dni', $dniFrecuente)->latest('id')->first();
    expect($nuevoPedido->detalles)->toHaveCount(1);
    expect($nuevoPedido->detalles->first()->es_regalo)->toBeFalse();
    expect($nuevoPedido->detalles->first()->cantidad)->toBe(7);
});
