<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pack extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nombre',
        'precio',
        'cantidad_marcianos',
        'cantidad_regalo',
        'activo',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'cantidad_marcianos' => 'integer',
            'cantidad_regalo' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active packs.
     *
     * @param  Builder<Pack>  $query
     * @return Builder<Pack>
     */
    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    /**
     * Get the order details for the pack.
     *
     * @return HasMany<PedidoDetalleSabor, $this>
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(PedidoDetalleSabor::class);
    }
}
