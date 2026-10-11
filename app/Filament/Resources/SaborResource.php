<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SaborResource\Pages;
use App\Models\Sabor;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Form;
use Filament\Forms\Get;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SaborResource extends Resource
{
    protected static ?string $model = Sabor::class;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationGroup = 'Catálogo de Productos';

    protected static ?string $navigationLabel = 'Sabores de Marcianos';

    protected static ?string $modelLabel = 'Sabor';

    protected static ?string $pluralModelLabel = 'Sabores';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('nombre')
                    ->label('Nombre del Sabor')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Ej. Lúcuma de Seda con Manjar'),

                Textarea::make('descripcion')
                    ->label('Descripción Corta')
                    ->rows(3)
                    ->placeholder('Ingredientes naturales, tipo de fruta o pulpa...'),

                FileUpload::make('imagen')
                    ->label('Fotografía Referencial')
                    ->image()
                    ->disk('public')
                    ->directory('sabores')
                    ->visibility('public')
                    ->imageCropAspectRatio('1:1')
                    ->imageResizeTargetWidth('400')
                    ->imageResizeTargetHeight('400')
                    ->helperText('Formato JPG, PNG o WebP. Se almacenará en storage público.'),

                Toggle::make('es_premium')
                    ->label('¿Es Sabor Premium?')
                    ->live()
                    ->helperText('Los sabores premium tienen un recargo adicional sobre el pack.'),

                TextInput::make('precio_adicional')
                    ->label('Precio Adicional / Recargo')
                    ->numeric()
                    ->prefix('S/')
                    ->default(0.00)
                    ->visible(fn (Get $get): bool => (bool) $get('es_premium'))
                    ->required(fn (Get $get): bool => (bool) $get('es_premium'))
                    ->helperText('Monto extra en Soles por cada unidad de este sabor seleccionado.'),

                Toggle::make('stock_activo')
                    ->label('¿En Stock para Pedidos?')
                    ->default(true)
                    ->helperText('Desmarca esta opción si el sabor se agotó momentáneamente.'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('imagen')
                    ->label('Foto')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl('https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=100&q=80'),

                TextColumn::make('nombre')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                IconColumn::make('es_premium')
                    ->label('Premium')
                    ->boolean()
                    ->alignCenter(),

                TextColumn::make('precio_adicional')
                    ->label('Recargo Extra')
                    ->money('PEN')
                    ->sortable(),

                IconColumn::make('stock_activo')
                    ->label('En Stock')
                    ->boolean()
                    ->alignCenter(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('es_premium')
                    ->label('Solo Premium'),
                Tables\Filters\TernaryFilter::make('stock_activo')
                    ->label('Con Stock Disponible'),
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
            'index' => Pages\ListSabores::route('/'),
            'create' => Pages\CreateSabor::route('/create'),
            'edit' => Pages\EditSabor::route('/{record}/edit'),
        ];
    }
}
