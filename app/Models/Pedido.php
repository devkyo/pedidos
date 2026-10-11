<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pedido extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'codigo_orden',
        'cliente_dni',
        'cliente_nombre',
        'cliente_telefono',
        'telefono_respaldo',
        'tipo_entrega',
        'direccion_entrega',
        'zona_envio',
        'costo_envio',
        'notas',
        'total',
        'fecha_pedido',
        'estado',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'fecha_pedido' => 'datetime',
        ];
    }

    /**
     * Scope a query to only include pending orders.
     *
     * @param  Builder<Pedido>  $query
     * @return Builder<Pedido>
     */
    public function scopePendientes(Builder $query): Builder
    {
        return $query->where('estado', 'pendiente');
    }

    /**
     * Scope a query to orders within a date range.
     *
     * @param  Builder<Pedido>  $query
     * @return Builder<Pedido>
     */
    public function scopeEntreFechas(Builder $query, CarbonInterface|string|null $desde = null, CarbonInterface|string|null $hasta = null): Builder
    {
        if ($desde) {
            $query->whereDate('fecha_pedido', '>=', $desde);
        }

        if ($hasta) {
            $query->whereDate('fecha_pedido', '<=', $hasta);
        }

        return $query;
    }

    /**
     * Get the details associated with the order.
     *
     * @return HasMany<PedidoDetalleSabor, $this>
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(PedidoDetalleSabor::class, 'pedido_id');
    }

    /**
     * Generate a unique order code formatted as ORD-YYYYMM-XXXX.
     */
    public static function generarCodigoOrden(): string
    {
        $prefijo = 'ORD-'.now()->format('Ym').'-';

        do {
            $codigo = $prefijo.strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
        } while (static::where('codigo_orden', $codigo)->exists());

        return $codigo;
    }

    /**
     * Check if a given DNI corresponds to a first-time purchaser.
     */
    public static function esPrimeraCompra(string $dni): bool
    {
        $limpio = trim($dni);
        if ($limpio === '') {
            return true;
        }

        return ! static::where('cliente_dni', $limpio)
            ->where('estado', '!=', 'cancelado')
            ->exists();
    }
}
