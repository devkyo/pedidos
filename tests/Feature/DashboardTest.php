<?php

use App\Models\Pedido;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('los pedidos estan paginados a 30 por pagina', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('pedidos.per_page')
        ->where('pedidos.per_page', 30)
    );
});

test('los pedidos se pueden filtrar por codigo de orden y cliente', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Pedido::create([
        'codigo_orden' => 'ORD-BUSCAR1',
        'cliente_nombre' => 'Juan Perez',
        'cliente_telefono' => '999888777',
        'tipo_entrega' => 'delivery',
        'total' => 29.00,
        'fecha_pedido' => now(),
        'estado' => 'pendiente',
    ]);

    Pedido::create([
        'codigo_orden' => 'ORD-OTRO2',
        'cliente_nombre' => 'Luisa Gomez',
        'cliente_telefono' => '911222333',
        'tipo_entrega' => 'pickup',
        'total' => 35.00,
        'fecha_pedido' => now(),
        'estado' => 'confirmado',
    ]);

    // Filtrar por código
    $responseCodigo = $this->get(route('dashboard', ['search' => 'BUSCAR1']));
    $responseCodigo->assertOk();
    $responseCodigo->assertInertia(fn ($page) => $page
        ->where('pedidos.total', 1)
        ->where('pedidos.data.0.codigo_orden', 'ORD-BUSCAR1')
    );

    // Filtrar por cliente
    $responseCliente = $this->get(route('dashboard', ['search' => 'Luisa']));
    $responseCliente->assertOk();
    $responseCliente->assertInertia(fn ($page) => $page
        ->where('pedidos.total', 1)
        ->where('pedidos.data.0.cliente_nombre', 'Luisa Gomez')
    );
});
