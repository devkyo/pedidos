<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sabor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminSaborController extends Controller
{
    /**
     * Store a newly created flavor.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'imagen_file' => ['nullable', 'image', 'max:2048'],
            'imagen_url_input' => ['nullable', 'string', 'max:1000'],
            'es_premium' => ['boolean'],
            'precio_adicional' => ['nullable', 'numeric', 'min:0'],
            'stock_activo' => ['boolean'],
        ]);

        $imagenPath = $request->input('imagen_url_input');

        if ($request->hasFile('imagen_file')) {
            $imagenPath = $request->file('imagen_file')->store('sabores', 'public');
        }

        Sabor::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'imagen' => $imagenPath,
            'es_premium' => $request->boolean('es_premium'),
            'precio_adicional' => $request->boolean('es_premium') ? ($validated['precio_adicional'] ?? 0.00) : 0.00,
            'stock_activo' => $request->boolean('stock_activo', true),
        ]);

        return back()->with('success', '¡Sabor creado exitosamente!');
    }

    /**
     * Update the specified flavor.
     */
    public function update(Request $request, Sabor $sabor): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'imagen_file' => ['nullable', 'image', 'max:2048'],
            'imagen_url_input' => ['nullable', 'string', 'max:1000'],
            'es_premium' => ['boolean'],
            'precio_adicional' => ['nullable', 'numeric', 'min:0'],
            'stock_activo' => ['boolean'],
        ]);

        $imagenPath = $sabor->imagen;

        if ($request->filled('imagen_url_input')) {
            $imagenPath = $request->input('imagen_url_input');
        }

        if ($request->hasFile('imagen_file')) {
            // Delete old file if stored locally in public disk
            if ($sabor->imagen && ! str_starts_with($sabor->imagen, 'http')) {
                Storage::disk('public')->delete($sabor->imagen);
            }
            $imagenPath = $request->file('imagen_file')->store('sabores', 'public');
        }

        $sabor->update([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'imagen' => $imagenPath,
            'es_premium' => $request->boolean('es_premium'),
            'precio_adicional' => $request->boolean('es_premium') ? ($validated['precio_adicional'] ?? 0.00) : 0.00,
            'stock_activo' => $request->boolean('stock_activo'),
        ]);

        return back()->with('success', '¡Sabor actualizado exitosamente!');
    }

    /**
     * Remove the specified flavor.
     */
    public function destroy(Sabor $sabor): RedirectResponse
    {
        if ($sabor->imagen && ! str_starts_with($sabor->imagen, 'http')) {
            Storage::disk('public')->delete($sabor->imagen);
        }

        $sabor->delete();

        return back()->with('success', '¡Sabor eliminado con éxito!');
    }
}
