<?php

use App\Models\User;
use App\Models\ZonaEnvio;

test('los invitados no pueden gestionar zonas de envio', function () {
    $response = $this->post(route('admin.zonas-envio.store'), [
        'nombre' => 'San Isidro Norte',
        'precio' => 7.50,
    ]);

    $response->assertRedirect(route('login'));
});

test('un administrador autenticado puede crear una nueva zona de envio', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post(route('admin.zonas-envio.store'), [
        'nombre' => 'Ate Vitarte',
        'precio' => 12.00,
        'tiempo_estimado' => '45-60 min',
        'activo' => true,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('zonas_envio', [
        'nombre' => 'Ate Vitarte',
        'precio' => 12.00,
        'activo' => true,
    ]);
});

test('un administrador puede actualizar una zona de envio existente', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $zona = ZonaEnvio::create([
        'nombre' => 'Chorrillos',
        'precio' => 8.00,
        'tiempo_estimado' => '30-45 min',
        'activo' => true,
    ]);

    $response = $this->put(route('admin.zonas-envio.update', $zona), [
        'nombre' => 'Chorrillos Playa',
        'precio' => 9.50,
        'tiempo_estimado' => '35-50 min',
        'activo' => false,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $zona->refresh();
    expect($zona->nombre)->toBe('Chorrillos Playa');
    expect((float) $zona->precio)->toBe(9.50);
    expect($zona->activo)->toBeFalse();
});

test('un administrador puede eliminar una zona de envio', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $zona = ZonaEnvio::create([
        'nombre' => 'Zona Temporal',
        'precio' => 10.00,
        'activo' => true,
    ]);

    $response = $this->delete(route('admin.zonas-envio.destroy', $zona));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('zonas_envio', [
        'id' => $zona->id,
    ]);
});

test('la tienda y el dashboard cargan las zonas de envio en inertia', function () {
    $homeResponse = $this->get(route('home'));
    $homeResponse->assertOk();
    $homeResponse->assertInertia(fn ($page) => $page
        ->component('ArmaTuPack')
        ->has('zonasEnvio')
    );

    $user = User::factory()->create();
    $dashboardResponse = $this->actingAs($user)->get(route('dashboard'));
    $dashboardResponse->assertOk();
    $dashboardResponse->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('zonasEnvio')
    );
});
