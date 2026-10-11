<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PackResource\Pages;
use App\Models\Pack;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PackResource extends Resource
{
    protected static ?string $model = Pack::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationGroup = 'Catálogo de Productos';

    protected static ?string $navigationLabel = 'Packs de Marcianos';

    protected static ?string $modelLabel = 'Pack';

    protected static ?string $pluralModelLabel = 'Packs';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('nombre')
                    ->label('Nombre del Pack')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Ej. Pack 7 Marcianos'),

                TextInput::make('precio')
                    ->label('Precio Base')
                    ->numeric()
                    ->prefix('S/')
                    ->required()
                    ->minValue(0),

                TextInput::make('cantidad_marcianos')
                    ->label('Cantidad de Marcianos')
                    ->numeric()
                    ->required()
                    ->minValue(1)
                    ->helperText('Número de marcianos que el cliente debe elegir.'),

                TextInput::make('cantidad_regalo')
                    ->label('Marcianos de Regalo (Gratis)')
                    ->numeric()
                    ->default(0)
                    ->minValue(0)
                    ->helperText('Marcianos adicionales sin costo que incluye la promoción.'),

                Toggle::make('activo')
                    ->label('¿Pack Activo?')
                    ->default(true)
                    ->helperText('Si está desmarcado, no aparecerá en la tienda web.'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nombre')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                TextColumn::make('precio')
                    ->label('Precio')
                    ->money('PEN')
                    ->sortable(),

                TextColumn::make('cantidad_marcianos')
                    ->label('Marcianos')
                    ->alignCenter()
                    ->sortable(),

                TextColumn::make('cantidad_regalo')
                    ->label('Regalos')
                    ->badge()
                    ->color('success')
                    ->alignCenter()
                    ->sortable(),

                IconColumn::make('activo')
                    ->label('Activo')
                    ->boolean()
                    ->alignCenter(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('activo')
                    ->label('Estado Activo'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
            'index' => Pages\ListPacks::route('/'),
            'create' => Pages\CreatePack::route('/create'),
            'edit' => Pages\EditPack::route('/{record}/edit'),
        ];
    }
}
