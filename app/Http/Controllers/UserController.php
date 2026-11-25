<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\Regions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Every account (admin only).
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->orderByRaw("case when role = 'admin' then 0 else 1 end")
                ->orderBy('name')
                ->get()
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'region' => $user->region,
                    'region_label' => $user->region !== null ? Regions::LABELS[$user->region] ?? null : null,
                    'is_me' => $user->id === $request->user()?->id,
                ])
                ->values(),
        ]);
    }

    /**
     * Create an account for a region, or another admin.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::query()->create($request->validated());

        Inertia::flash('success', 'تمت إضافة الحساب');

        return back();
    }

    /**
     * Update an account; an empty password keeps the old one.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        if ($user->is($request->user()) && $data['role'] !== User::ROLE_ADMIN) {
            Inertia::flash('error', 'لا يمكنك إلغاء صلاحية المدير عن حسابك');

            return back();
        }

        $user->update($data);

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Delete an account (never your own).
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            Inertia::flash('error', 'لا يمكنك حذف حسابك');

            return back();
        }

        $user->delete();

        Inertia::flash('success', 'تم حذف الحساب');

        return back();
    }
}
