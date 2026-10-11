<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PedidoResource\Pages;
use App\Models\Pedido;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use pxlrbt\FilamentExcel\Actions\Tables\ExportAction;
use pxlrbt\FilamentExcel\Columns\Column;
use pxlrbt\FilamentExcel\Exports\ExcelExport;

class PedidoResource extends Resource
{
    protected static ?string $model = Pedido::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationGroup = 'Ventas y Despacho';

    protected static ?string $navigationLabel = 'Pedidos de Clientes';

    protected static ?string $modelLabel = 'Pedido';

    protected static ?string $pluralModelLabel = 'Pedidos';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('codigo_orden')
                    ->label('Código de Orden')
                    ->disabled()
                    ->dehydrated(false),

                DateTimePicker::make('fecha_pedido')
                    ->label('Fecha del Pedido')
                    ->disabled()
                    ->dehydrated(false),

                TextInput::make('cliente_dni')
                    ->label('DNI del Cliente')
                    ->length(8)
                    ->required(),

                TextInput::make('cliente_nombre')
                    ->label('Nombre del Cliente')
                    ->required()
                    ->maxLength(255),

                TextInput::make('cliente_telefono')
                    ->label('Teléfono Principal')
                    ->tel()
                    ->required(),

                TextInput::make('telefono_respaldo')
                    ->label('Teléfono Respaldo')
                    ->tel()
                    ->nullable(),

                Select::make('tipo_entrega')
                    ->label('Método de Entrega')
                    ->options([
                        'delivery' => 'Delivery a Domicilio',
                        'recojo' => 'Recojo en Tienda',
                    ])
                    ->required(),

                TextInput::make('total')
                    ->label('Monto Total')
                    ->numeric()
                    ->prefix('S/')
                    ->required(),

                Select::make('estado')
                    ->label('Estado de la Orden')
                    ->options([
                        'pendiente' => 'Pendiente',
                        'confirmado' => 'Confirmado',
                        'entregado' => 'Entregado',
                        'cancelado' => 'Cancelado',
                    ])
                    ->required(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('codigo_orden')
                    ->label('Código')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->weight('bold'),

                TextColumn::make('fecha_pedido')
                    ->label('Fecha y Hora')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),

                TextColumn::make('cliente_dni')
                    ->label('DNI')
                    ->searchable()
                    ->copyable(),

                TextColumn::make('cliente_nombre')
                    ->label('Cliente')
                    ->searchable()
                    ->wrap(),

                TextColumn::make('cliente_telefono')
                    ->label('Teléfono')
                    ->searchable()
                    ->icon('heroicon-m-phone'),

                TextColumn::make('tipo_entrega')
                    ->label('Entrega')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'delivery' => 'info',
                        'recojo' => 'warning',
                        default => 'gray',
                    }),

                TextColumn::make('total')
                    ->label('Total')
                    ->money('PEN')
                    ->sortable()
                    ->weight('black'),

                TextColumn::make('estado')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pendiente' => 'warning',
                        'confirmado' => 'info',
                        'entregado' => 'success',
                        'cancelado' => 'danger',
                        default => 'gray',
                    }),
            ])
            ->defaultSort('fecha_pedido', 'desc')
            ->filters([
                SelectFilter::make('estado')
                    ->label('Filtrar por Estado')
                    ->options([
                        'pendiente' => 'Pendiente',
                        'confirmado' => 'Confirmado',
                        'entregado' => 'Entregado',
                        'cancelado' => 'Cancelado',
                    ]),

                Filter::make('fecha_pedido')
                    ->form([
                        DatePicker::make('desde')
                            ->label('Fecha Desde'),
                        DatePicker::make('hasta')
                            ->label('Fecha Hasta'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['desde'] ?? null,
                                fn (Builder $q, string $date): Builder => $q->whereDate('fecha_pedido', '>=', $date),
                            )
                            ->when(
                                $data['hasta'] ?? null,
                                fn (Builder $q, string $date): Builder => $q->whereDate('fecha_pedido', '<=', $date),
                            );
                    }),
            ])
            ->headerActions([
                ExportAction::make()
                    ->label('Exportar a Excel (.xlsx)')
                    ->exports([
                        ExcelExport::make('pedidos')
                            ->fromTable()
                            ->withFilename(fn (): string => 'reporte-pedidos-marcianos-'.now()->format('Y-m-d-His'))
                            ->withColumns([
                                Column::make('codigo_orden')->heading('Código de Orden'),
                                Column::make('fecha_pedido')->heading('Fecha de Pedido'),
                                Column::make('cliente_dni')->heading('DNI'),
                                Column::make('cliente_nombre')->heading('Nombre del Cliente'),
                                Column::make('cliente_telefono')->heading('Teléfono Celular'),
                                Column::make('telefono_respaldo')->heading('Teléfono de Respaldo'),
                                Column::make('tipo_entrega')->heading('Método de Entrega'),
                                Column::make('total')->heading('Total Pagado (S/)'),
                                Column::make('estado')->heading('Estado Actual'),
                            ]),
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPedidos::route('/'),
            'create' => Pages\CreatePedido::route('/create'),
            'edit' => Pages\EditPedido::route('/{record}/edit'),
        ];
    }
}
