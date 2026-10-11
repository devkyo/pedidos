<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminPedidoController extends Controller
{
    /**
     * Update the status of an order.
     */
    public function updateEstado(Request $request, Pedido $pedido): RedirectResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'in:pendiente,confirmado,entregado,cancelado'],
        ]);

        $pedido->update([
            'estado' => $validated['estado'],
        ]);

        return back()->with('success', "Estado de orden {$pedido->codigo_orden} actualizado a {$validated['estado']}.");
    }

    /**
     * Remove the specified order from storage.
     */
    public function destroy(Pedido $pedido): RedirectResponse
    {
        $codigo = $pedido->codigo_orden;
        $pedido->delete();

        return back()->with('success', "Pedido {$codigo} eliminado exitosamente.");
    }

    /**
     * Export orders to CSV / Excel compatible with date filtering.
     */
    public function export(Request $request): StreamedResponse
    {
        $fechaDesde = $request->input('desde');
        $fechaHasta = $request->input('hasta');
        $estadoFiltro = $request->input('estado');
        $search = $request->input('search');

        $pedidos = Pedido::with(['detalles.sabor', 'detalles.pack'])
            ->entreFechas($fechaDesde, $fechaHasta)
            ->when($estadoFiltro, fn ($q, $estado) => $q->where('estado', $estado))
            ->when($search, function ($q, $term) {
                $term = trim($term);
                $q->where(function ($sub) use ($term) {
                    $sub->where('codigo_orden', 'like', "%{$term}%")
                        ->orWhere('cliente_dni', 'like', "%{$term}%")
                        ->orWhere('cliente_nombre', 'like', "%{$term}%")
                        ->orWhere('cliente_telefono', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('fecha_pedido')
            ->get();

        $filename = 'pedidos-marcianos-'.now()->format('Y-m-d-His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($pedidos) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Microsoft Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Instruct Microsoft Excel to delimit by semicolon (;) so all fields open in separate columns
            fwrite($handle, "sep=;\r\n");

            fputcsv($handle, [
                'Codigo Orden',
                'Fecha Pedido',
                'DNI',
                'Cliente',
                'Telefono Principal',
                'Telefono Respaldo',
                'Tipo Entrega',
                'Total (S/)',
                'Estado',
                'Desglose de Sabores',
            ], ';');

            foreach ($pedidos as $pedido) {
                $saboresDesglose = $pedido->detalles->map(function ($det) {
                    $tipo = $det->es_regalo ? 'Regalo' : 'Pack';
                    $extra = $det->costo_extra_unitario > 0 ? " (+S/{$det->costo_extra_unitario})" : '';

                    return "{$det->cantidad}x {$det->sabor?->nombre} [{$tipo}{$extra}]";
                })->join(' | ');

                fputcsv($handle, [
                    $pedido->codigo_orden,
                    $pedido->fecha_pedido?->format('d/m/Y H:i'),
                    $pedido->cliente_dni ?? '',
                    $pedido->cliente_nombre,
                    $pedido->cliente_telefono,
                    $pedido->telefono_respaldo ?? '',
                    $pedido->tipo_entrega,
                    number_format((float) $pedido->total, 2, '.', ''),
                    strtoupper($pedido->estado),
                    $saboresDesglose,
                ], ';');
            }

            fclose($handle);
        }, 200, $headers);
    }
}
