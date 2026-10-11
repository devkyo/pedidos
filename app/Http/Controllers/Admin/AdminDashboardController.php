<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pack;
use App\Models\Pedido;
use App\Models\Sabor;
use App\Models\Setting;
use App\Models\ZonaEnvio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the comprehensive administrative dashboard.
     */
    public function index(Request $request): Response
    {
        $fechaDesde = $request->input('desde');
        $fechaHasta = $request->input('hasta');
        $estadoFiltro = $request->input('estado');
        $search = $request->input('search');

        $pedidosQuery = Pedido::with(['detalles.sabor', 'detalles.pack'])
            ->entreFechas($fechaDesde, $fechaHasta)
            ->when($estadoFiltro, fn ($q, $estado) => $q->where('estado', $estado))
            ->when($search, function ($q, $term) {
                $term = trim($term);
                $q->where(function ($sub) use ($term) {
                    $sub->where('codigo_orden', 'like', "%{$term}%")
                        ->orWhere('cliente_nombre', 'like', "%{$term}%")
                        ->orWhere('cliente_telefono', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('fecha_pedido');

        $pedidos = $pedidosQuery->paginate(30)->withQueryString();

        $packs = Pack::orderBy('cantidad_marcianos')->get();

        $sabores = Sabor::orderByDesc('es_premium')->orderBy('nombre')->get();

        $zonasEnvio = ZonaEnvio::orderBy('nombre')->get();

        $stats = [
            'total_ventas' => (float) Pedido::where('estado', '!=', 'cancelado')->sum('total'),
            'pedidos_totales' => Pedido::count(),
            'pedidos_pendientes' => Pedido::where('estado', 'pendiente')->count(),
            'pedidos_entregados' => Pedido::where('estado', 'entregado')->count(),
            'packs_activos' => Pack::where('activo', true)->count(),
            'sabores_activos' => Sabor::where('stock_activo', true)->count(),
            'zonas_activas' => ZonaEnvio::where('activo', true)->count(),
        ];

        return Inertia::render('dashboard', [
            'packs' => $packs,
            'sabores' => $sabores,
            'zonasEnvio' => $zonasEnvio,
            'pedidos' => $pedidos,
            'stats' => $stats,
            'filters' => [
                'desde' => $fechaDesde,
                'hasta' => $fechaHasta,
                'estado' => $estadoFiltro,
                'search' => $search,
            ],
            'whatsappPhone' => (string) Setting::get('whatsapp_phone', config('services.whatsapp.phone', env('WHATSAPP_PHONE', '51987654321'))),
            'whatsappMessage' => (string) Setting::get('whatsapp_message', ''),
        ]);
    }
}
