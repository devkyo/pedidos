<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('los administradores pueden iniciar sesion e ingresar al dashboard sin verificar correo', function (string $email, string $password) {
    $user = User::where('email', $email)->first();
    expect($user)->not->toBeNull();

    $response = $this->post(route('login.store'), [
        'email' => $email,
        'password' => $password,
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);

    $dashboardResponse = $this->actingAs($user)->get(route('dashboard'));
    $dashboardResponse->assertOk();
})->with([
    ['softawk@gmail.com', '#@less@ndro31'],
    ['admin@loreanne.pe', '#adminloreanne2026'],
]);

test('un nuevo usuario se registra y accede al dashboard directamente sin pedir verificacion de correo', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Nuevo Usuario',
        'email' => 'nuevo@cliente.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    $dashboardResponse = $this->get(route('dashboard'));
    $dashboardResponse->assertOk();
});
