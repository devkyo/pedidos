<?php

namespace App\Filament\Resources\SaborResource\Pages;

use App\Filament\Resources\SaborResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSabores extends ListRecords
{
    protected static string $resource = SaborResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
