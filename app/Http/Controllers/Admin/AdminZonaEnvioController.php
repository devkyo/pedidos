<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ZonaEnvio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminZonaEnvioController extends Controller
{
    /**
     * Store a newly created shipping zone.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255', 'unique:zonas_envio,nombre'],
            'precio' => ['required', 'numeric', 'min:0'],
            'tiempo_estimado' => ['nullable', 'string', 'max:100'],
            'activo' => ['boolean'],
        ]);

        ZonaEnvio::create([
            ...$validated,
            'activo' => $request->boolean('activo', true),
        ]);

        return back()->with('success', '¡Zona de envío agregada exitosamente!');
    }

    /**
     * Update the specified shipping zone.
     */
    public function update(Request $request, ZonaEnvio $zona): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255', Rule::unique('zonas_envio', 'nombre')->ignore($zona->id)],
            'precio' => ['required', 'numeric', 'min:0'],
            'tiempo_estimado' => ['nullable', 'string', 'max:100'],
            'activo' => ['boolean'],
        ]);

        $zona->update([
            ...$validated,
            'activo' => $request->boolean('activo'),
        ]);

        return back()->with('success', "¡Zona {$zona->nombre} actualizada con éxito!");
    }

    /**
     * Remove the specified shipping zone.
     */
    public function destroy(ZonaEnvio $zona): RedirectResponse
    {
        $nombre = $zona->nombre;
        $zona->delete();

        return back()->with('success', "¡Zona de envío '{$nombre}' eliminada con éxito!");
    }
}
