<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePedidoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'cliente_dni' => ['required', 'string', 'digits:8'],
            'cliente_nombre' => ['required', 'string', 'max:255'],
            'cliente_telefono' => ['required', 'string', 'max:25'],
            'telefono_respaldo' => ['nullable', 'string', 'max:25'],
            'tipo_entrega' => ['required', 'in:delivery,recojo,pickup'],
            'direccion_entrega' => ['nullable', 'string', 'max:255'],
            'zona_envio' => ['nullable', 'string', 'max:255'],
            'costo_envio' => ['nullable', 'numeric', 'min:0'],
            'notas' => ['nullable', 'string', 'max:1000'],
            'pack_id' => ['required', 'integer', 'exists:packs,id'],
            'sabores_pack' => ['required', 'array', 'min:1'],
            'sabores_pack.*.sabor_id' => ['required', 'integer', 'exists:sabores,id'],
            'sabores_pack.*.cantidad' => ['required', 'integer', 'min:1'],
            'sabores_regalo' => ['nullable', 'array'],
            'sabores_regalo.*.sabor_id' => ['required', 'integer', 'exists:sabores,id'],
            'sabores_regalo.*.cantidad' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'cliente_dni' => 'número de DNI',
            'cliente_nombre' => 'nombre completo',
            'cliente_telefono' => 'teléfono celular',
            'telefono_respaldo' => 'teléfono de respaldo',
            'tipo_entrega' => 'método de entrega',
            'pack_id' => 'pack seleccionado',
            'sabores_pack' => 'sabores del pack',
            'sabores_regalo' => 'sabores de regalo',
        ];
    }
}
