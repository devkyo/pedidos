<?php

use App\Models\Setting;
use App\Models\User;

test('los invitados no pueden actualizar la configuracion de la tienda', function () {
    $response = $this->put(route('admin.settings.update'), [
        'whatsapp_phone' => '51987654321',
    ]);

    $response->assertRedirect(route('login'));
});

test('un administrador autenticado puede actualizar el numero de whatsapp de la tienda', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->put(route('admin.settings.update'), [
        'whatsapp_phone' => '+51 912 345 678',
        'whatsapp_message' => '¡Hola! Quiero confirmar mi pedido.',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(Setting::get('whatsapp_phone'))->toBe('51912345678');
    expect(Setting::get('whatsapp_message'))->toBe('¡Hola! Quiero confirmar mi pedido.');
});

test('la tienda y el dashboard reflejan el nuevo numero de whatsapp configurado', function () {
    Setting::set('whatsapp_phone', '51999888777');

    // Comprobar la tienda del cliente
    $homeResponse = $this->get(route('home'));
    $homeResponse->assertOk();
    $homeResponse->assertInertia(fn ($page) => $page
        ->component('ArmaTuPack')
        ->where('whatsappPhone', '51999888777')
    );

    // Comprobar el dashboard del admin
    $user = User::factory()->create();
    $dashboardResponse = $this->actingAs($user)->get(route('dashboard'));
    $dashboardResponse->assertOk();
    $dashboardResponse->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('whatsappPhone', '51999888777')
    );
});
