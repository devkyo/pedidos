<?php

use App\Models\Pedido;
use App\Models\User;

test('los invitados no pueden exportar pedidos', function () {
    $response = $this->get(route('admin.pedidos.export'));
    $response->assertRedirect(route('login'));
});

test('un administrador puede exportar pedidos formateados en columnas para excel con separador punto y coma', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Pedido::create([
        'codigo_orden' => 'ORD-TEST123',
        'cliente_nombre' => 'María Torres',
        'cliente_telefono' => '987111222',
        'tipo_entrega' => 'delivery',
        'total' => 45.50,
        'fecha_pedido' => now(),
        'estado' => 'confirmado',
    ]);

    $response = $this->get(route('admin.pedidos.export'));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

    // Capture streamed response content
    ob_start();
    $response->sendContent();
    $content = ob_get_clean();

    // Check BOM, Excel sep directive and semicolon separated columns
    expect($content)->toContain("sep=;\r\n");
    expect($content)->toContain('"Codigo Orden";"Fecha Pedido"');
    expect($content)->toContain(';Cliente;');
    expect($content)->toContain('"Telefono Principal";"Telefono Respaldo"');
    expect($content)->toContain('"Total (S/)";Estado;"Desglose de Sabores"');
    expect($content)->toContain('ORD-TEST123;');
    expect($content)->toContain(';"María Torres";');
    expect($content)->toContain(';45.50;CONFIRMADO;');
});
