<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PedidoDetalleSabor extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'pedido_detalles_sabores';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'pedido_id',
        'sabor_id',
        'pack_id',
        'cantidad',
        'es_regalo',
        'costo_extra_unitario',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cantidad' => 'integer',
            'es_regalo' => 'boolean',
            'costo_extra_unitario' => 'decimal:2',
        ];
    }

    /**
     * Get the order that owns this detail.
     *
     * @return BelongsTo<Pedido, $this>
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    /**
     * Get the flavor of this detail item.
     *
     * @return BelongsTo<Sabor, $this>
     */
    public function sabor(): BelongsTo
    {
        return $this->belongsTo(Sabor::class, 'sabor_id');
    }

    /**
     * Get the pack of this detail item.
     *
     * @return BelongsTo<Pack, $this>
     */
    public function pack(): BelongsTo
    {
        return $this->belongsTo(Pack::class, 'pack_id');
    }
}
