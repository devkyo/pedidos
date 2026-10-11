<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Sabor extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'sabores';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
        'es_premium',
        'precio_adicional',
        'stock_activo',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'imagen_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'es_premium' => 'boolean',
            'precio_adicional' => 'decimal:2',
            'stock_activo' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include in-stock flavors.
     *
     * @param  Builder<Sabor>  $query
     * @return Builder<Sabor>
     */
    public function scopeDisponibles(Builder $query): Builder
    {
        return $query->where('stock_activo', true);
    }

    /**
     * Scope a query to only include premium flavors.
     *
     * @param  Builder<Sabor>  $query
     * @return Builder<Sabor>
     */
    public function scopePremium(Builder $query): Builder
    {
        return $query->where('es_premium', true);
    }

    /**
     * Get the full URL to the flavor image.
     *
     * @return Attribute<string|null, never>
     */
    protected function imagenUrl(): Attribute
    {
        return Attribute::make(
            get: function (): ?string {
                if (! $this->imagen) {
                    return null;
                }

                if (str_starts_with($this->imagen, 'http://') || str_starts_with($this->imagen, 'https://')) {
                    return $this->imagen;
                }

                return Storage::disk('public')->url($this->imagen);
            }
        );
    }

    /**
     * Get the order details for the flavor.
     *
     * @return HasMany<PedidoDetalleSabor, $this>
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(PedidoDetalleSabor::class, 'sabor_id');
    }
}
