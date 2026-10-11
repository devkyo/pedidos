<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePedidoRequest;
use App\Models\Pack;
use App\Models\Pedido;
use App\Models\PedidoDetalleSabor;
use App\Models\Sabor;
use App\Models\Setting;
use App\Models\ZonaEnvio;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PedidoController extends Controller
{
    /**
     * Display the interactive pack building storefront.
     */
    public function index(): Response
    {
        $packs = Pack::activos()
            ->orderBy('cantidad_marcianos')
            ->get();

        $sabores = Sabor::disponibles()
            ->orderByDesc('es_premium')
            ->orderBy('nombre')
            ->get();

        $zonasEnvio = ZonaEnvio::activos()
            ->orderBy('nombre')
            ->get();

        return Inertia::render('ArmaTuPack', [
            'packs' => $packs,
            'sabores' => $sabores,
            'zonasEnvio' => $zonasEnvio,
            'whatsappPhone' => (string) Setting::get('whatsapp_phone', config('services.whatsapp.phone', env('WHATSAPP_PHONE', '51987654321'))),
        ]);
    }

    /**
     * Check if a customer with the given DNI has previous order history.
     */
    public function verificarDni(string $dni): JsonResponse
    {
        $dniLimpio = trim($dni);
        if (! preg_match('/^[0-9]{8}$/', $dniLimpio)) {
            return response()->json([
                'valido' => false,
                'es_primera_compra' => true,
                'mensaje' => 'El DNI debe contener exactamente 8 dígitos numéricos.',
            ], 422);
        }

        $esPrimeraCompra = Pedido::esPrimeraCompra($dniLimpio);

        return response()->json([
            'valido' => true,
            'es_primera_compra' => $esPrimeraCompra,
            'tiene_historial' => ! $esPrimeraCompra,
            'mensaje' => $esPrimeraCompra
                ? '¡Bienvenido! Es tu primera compra: tienes tu marciano de cortesía disponible.'
                : 'Identificamos pedidos anteriores con este DNI. El marciano de cortesía aplica exclusivamente para tu primera compra.',
        ]);
    }

    /**
     * Store a newly created order and its flavor breakdown in database.
     *
     * @throws ValidationException
     */
    public function store(StorePedidoRequest $request): JsonResponse
    {
        $data = $request->validated();

        $pedido = DB::transaction(function () use ($data): Pedido {
            /** @var Pack $pack */
            $pack = Pack::findOrFail($data['pack_id']);

            $cantTotalPack = collect($data['sabores_pack'])->sum('cantidad');
            if ($cantTotalPack !== $pack->cantidad_marcianos) {
                throw ValidationException::withMessages([
                    'sabores_pack' => "Debes seleccionar exactamente {$pack->cantidad_marcianos} marcianos para este pack (actual: {$cantTotalPack}).",
                ]);
            }

            $esPrimeraCompra = Pedido::esPrimeraCompra($data['cliente_dni']);
            $saboresRegalo = $esPrimeraCompra ? ($data['sabores_regalo'] ?? []) : [];
            $cantTotalRegalos = collect($saboresRegalo)->sum('cantidad');
            if ($cantTotalRegalos > $pack->cantidad_regalo) {
                throw ValidationException::withMessages([
                    'sabores_regalo' => "No puedes superar la cantidad de {$pack->cantidad_regalo} marcianos de regalo otorgados por el pack.",
                ]);
            }

            // Fetch referenced flavors to verify prices and premium status from DB
            $saborIds = collect($data['sabores_pack'])
                ->pluck('sabor_id')
                ->merge(collect($saboresRegalo)->pluck('sabor_id'))
                ->unique();

            $saboresMap = Sabor::whereIn('id', $saborIds)->get()->keyBy('id');

            $recargoPremiumPack = 0.00;
            foreach ($data['sabores_pack'] as $item) {
                /** @var Sabor|null $sabor */
                $sabor = $saboresMap->get($item['sabor_id']);
                if ($sabor && $sabor->es_premium) {
                    $recargoPremiumPack += ((float) $sabor->precio_adicional) * (int) $item['cantidad'];
                }
            }

            $recargoPremiumRegalo = 0.00;
            foreach ($saboresRegalo as $item) {
                /** @var Sabor|null $sabor */
                $sabor = $saboresMap->get($item['sabor_id']);
                if ($sabor && $sabor->es_premium) {
                    $recargoPremiumRegalo += ((float) $sabor->precio_adicional) * (int) $item['cantidad'];
                }
            }

            $total = round((float) $pack->precio + $recargoPremiumPack + $recargoPremiumRegalo, 2);

            $pedido = Pedido::create([
                'codigo_orden' => Pedido::generarCodigoOrden(),
                'cliente_dni' => $data['cliente_dni'],
                'cliente_nombre' => $data['cliente_nombre'],
                'cliente_telefono' => $data['cliente_telefono'],
                'telefono_respaldo' => $data['telefono_respaldo'] ?? null,
                'tipo_entrega' => $data['tipo_entrega'],
                'direccion_entrega' => $data['direccion_entrega'] ?? null,
                'zona_envio' => $data['zona_envio'] ?? null,
                'costo_envio' => $data['costo_envio'] ?? null,
                'notas' => $data['notas'] ?? null,
                'total' => $total,
                'fecha_pedido' => now(),
                'estado' => 'pendiente',
            ]);

            $detalles = [];

            foreach ($data['sabores_pack'] as $item) {
                /** @var Sabor|null $sabor */
                $sabor = $saboresMap->get($item['sabor_id']);
                $costoExtra = ($sabor && $sabor->es_premium) ? (float) $sabor->precio_adicional : 0.00;

                $detalles[] = [
                    'pedido_id' => $pedido->id,
                    'sabor_id' => $item['sabor_id'],
                    'pack_id' => $pack->id,
                    'cantidad' => $item['cantidad'],
                    'es_regalo' => false,
                    'costo_extra_unitario' => $costoExtra,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach ($saboresRegalo as $item) {
                /** @var Sabor|null $sabor */
                $sabor = $saboresMap->get($item['sabor_id']);
                $costoExtra = ($sabor && $sabor->es_premium) ? (float) $sabor->precio_adicional : 0.00;

                $detalles[] = [
                    'pedido_id' => $pedido->id,
                    'sabor_id' => $item['sabor_id'],
                    'pack_id' => $pack->id,
                    'cantidad' => $item['cantidad'],
                    'es_regalo' => true,
                    'costo_extra_unitario' => $costoExtra,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (! empty($detalles)) {
                PedidoDetalleSabor::insert($detalles);
            }

            return $pedido;
        });

        return response()->json([
            'status' => 'success',
            'codigo_orden' => $pedido->codigo_orden,
            'total' => number_format((float) $pedido->total, 2, '.', ''),
            'message' => 'Orden generada y registrada con éxito',
        ], 201);
    }
}
