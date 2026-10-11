<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    /**
     * Update the store configuration settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'whatsapp_phone' => ['required', 'string', 'min:6', 'max:25'],
            'whatsapp_message' => ['nullable', 'string', 'max:500'],
        ]);

        // Remove non-digit characters to keep phone clean
        $cleanPhone = (string) preg_replace('/[^\d]/', '', $validated['whatsapp_phone']);

        Setting::set('whatsapp_phone', $cleanPhone);

        if (array_key_exists('whatsapp_message', $validated)) {
            Setting::set('whatsapp_message', $validated['whatsapp_message']);
        }

        return back()->with('success', '¡Configuración de WhatsApp guardada exitosamente!');
    }
}
