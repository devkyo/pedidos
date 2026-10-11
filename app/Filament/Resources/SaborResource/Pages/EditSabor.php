<?php

namespace App\Filament\Resources\SaborResource\Pages;

use App\Filament\Resources\SaborResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSabor extends EditRecord
{
    protected static string $resource = SaborResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
