<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(): Response
    {
        return Inertia::render('Login');
    }

    /**
     * Log the accountant in (always remembered).
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $key = Str::lower((string) $request->input('email')).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'email' => 'محاولات كثيرة، حاول بعد '.RateLimiter::availableIn($key).' ثانية',
            ]);
        }

        if (! Auth::attempt($request->only('email', 'password'), true)) {
            RateLimiter::hit($key, 60);

            throw ValidationException::withMessages([
                'email' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            ]);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();

        return redirect()->intended(route('home'));
    }

    /**
     * Log out.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
