<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pack;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminPackController extends Controller
{
    /**
     * Store a newly created pack.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'precio' => ['required', 'numeric', 'min:0'],
            'cantidad_marcianos' => ['required', 'integer', 'min:1'],
            'cantidad_regalo' => ['required', 'integer', 'min:0'],
            'activo' => ['boolean'],
        ]);

        Pack::create([
            ...$validated,
            'activo' => $request->boolean('activo', true),
        ]);

        return back()->with('success', '¡Pack creado exitosamente!');
    }

    /**
     * Update the specified pack.
     */
    public function update(Request $request, Pack $pack): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'precio' => ['required', 'numeric', 'min:0'],
            'cantidad_marcianos' => ['required', 'integer', 'min:1'],
            'cantidad_regalo' => ['required', 'integer', 'min:0'],
            'activo' => ['boolean'],
        ]);

        $pack->update([
            ...$validated,
            'activo' => $request->boolean('activo'),
        ]);

        return back()->with('success', '¡Pack actualizado exitosamente!');
    }

    /**
     * Remove the specified pack.
     */
    public function destroy(Pack $pack): RedirectResponse
    {
        $pack->delete();

        return back()->with('success', '¡Pack eliminado con éxito!');
    }
}
