<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Services\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * Admins have no region.
     */
    protected function prepareForValidation(): void
    {
        if ($this->input('role') === User::ROLE_ADMIN) {
            $this->merge(['region' => null]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8', 'max:190'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_USER])],
            'region' => ['nullable', 'required_if:role,'.User::ROLE_USER, Rule::in(Regions::keys())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'اكتب الاسم',
            'email.required' => 'اكتب البريد الإلكتروني',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.unique' => 'هذا البريد مستخدم لحساب آخر',
            'password.required' => 'اكتب كلمة المرور',
            'password.min' => 'كلمة المرور 8 أحرف على الأقل',
            'region.required_if' => 'اختر المنطقة (الشرق أو الغرب)',
        ];
    }
}
