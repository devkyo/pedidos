<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminPackController;
use App\Http\Controllers\Admin\AdminPedidoController;
use App\Http\Controllers\Admin\AdminSaborController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminZonaEnvioController;
use App\Http\Controllers\PedidoController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PedidoController::class, 'index'])->name('home');
Route::get('/pedidos/verificar-dni/{dni}', [PedidoController::class, 'verificarDni'])->name('pedidos.verificar-dni');
Route::post('/pedidos', [PedidoController::class, 'store'])->name('pedidos.store');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // CRUD Packs
    Route::post('admin/packs', [AdminPackController::class, 'store'])->name('admin.packs.store');
    Route::put('admin/packs/{pack}', [AdminPackController::class, 'update'])->name('admin.packs.update');
    Route::delete('admin/packs/{pack}', [AdminPackController::class, 'destroy'])->name('admin.packs.destroy');

    // CRUD Sabores
    Route::post('admin/sabores', [AdminSaborController::class, 'store'])->name('admin.sabores.store');
    Route::post('admin/sabores/{sabor}', [AdminSaborController::class, 'update'])->name('admin.sabores.update');
    Route::delete('admin/sabores/{sabor}', [AdminSaborController::class, 'destroy'])->name('admin.sabores.destroy');

    // CRUD Zonas de Envío
    Route::post('admin/zonas-envio', [AdminZonaEnvioController::class, 'store'])->name('admin.zonas-envio.store');
    Route::put('admin/zonas-envio/{zona}', [AdminZonaEnvioController::class, 'update'])->name('admin.zonas-envio.update');
    Route::delete('admin/zonas-envio/{zona}', [AdminZonaEnvioController::class, 'destroy'])->name('admin.zonas-envio.destroy');

    // Pedidos Management & Export
    Route::patch('admin/pedidos/{pedido}/estado', [AdminPedidoController::class, 'updateEstado'])->name('admin.pedidos.estado');
    Route::delete('admin/pedidos/{pedido}', [AdminPedidoController::class, 'destroy'])->name('admin.pedidos.destroy');
    Route::get('admin/pedidos/export', [AdminPedidoController::class, 'export'])->name('admin.pedidos.export');

    // Store Configuration
    Route::put('admin/configuracion', [AdminSettingController::class, 'update'])->name('admin.settings.update');
});

require __DIR__.'/settings.php';
