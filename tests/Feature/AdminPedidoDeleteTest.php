<?php

use App\Models\Pedido;
use App\Models\PedidoDetalleSabor;
use App\Models\Sabor;
use App\Models\User;

test('los invitados no pueden eliminar pedidos', function () {
    $pedido = Pedido::create([
        'codigo_orden' => 'ORD-DEL-001',
        'cliente_nombre' => 'Invitado Test',
        'cliente_telefono' => '987000111',
        'tipo_entrega' => 'delivery',
        'total' => 30.00,
        'fecha_pedido' => now(),
        'estado' => 'pendiente',
    ]);

    $response = $this->delete(route('admin.pedidos.destroy', $pedido));

    $response->assertRedirect(route('login'));
    $this->assertDatabaseHas('pedidos', ['id' => $pedido->id]);
});

test('un administrador autenticado puede eliminar un pedido y sus detalles', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $pedido = Pedido::create([
        'codigo_orden' => 'ORD-DEL-002',
        'cliente_nombre' => 'Juan Pérez',
        'cliente_telefono' => '999888777',
        'tipo_entrega' => 'tienda',
        'total' => 45.00,
        'fecha_pedido' => now(),
        'estado' => 'pendiente',
    ]);

    $sabor = Sabor::first() ?? Sabor::create([
        'nombre' => 'Fresa Test',
        'es_premium' => false,
        'precio_adicional' => 0.00,
        'stock_activo' => true,
    ]);

    PedidoDetalleSabor::create([
        'pedido_id' => $pedido->id,
        'sabor_id' => $sabor->id,
        'cantidad' => 3,
        'es_regalo' => false,
        'costo_extra_unitario' => 0.00,
    ]);

    $response = $this->delete(route('admin.pedidos.destroy', $pedido));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('pedidos', ['id' => $pedido->id]);
    $this->assertDatabaseMissing('pedido_detalles_sabores', ['pedido_id' => $pedido->id]);
});
