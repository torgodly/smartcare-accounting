<?php

namespace App\Http\Controllers;

use App\Models\UploadToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadTokenController extends Controller
{
    /**
     * Create a QR token valid for ten minutes.
     */
    public function store(Request $request): JsonResponse
    {
        $token = UploadToken::query()->create([
            'token' => Str::random(48),
            'user_id' => $request->user()->id,
            'expires_at' => now()->addMinutes(UploadToken::LIFETIME_MINUTES),
        ]);

        return response()->json([
            'token' => $token->token,
            'url' => route('upload.page', $token->token),
            'expires_at' => $token->expires_at->toIso8601String(),
            'expires_in' => (int) now()->diffInSeconds($token->expires_at),
        ], 201);
    }

    /**
     * Desktop polling: has the phone sent the photo yet?
     */
    public function show(Request $request, string $token): JsonResponse
    {
        $uploadToken = $this->find($request, $token);

        if ($uploadToken === null) {
            return response()->json(['state' => 'invalid', 'receipt' => null]);
        }

        $receipt = $uploadToken->receipt;

        return response()->json([
            'state' => $receipt !== null ? 'received' : $uploadToken->state(),
            'receipt' => $receipt !== null ? ['id' => $receipt->id, 'url' => $receipt->url()] : null,
        ]);
    }

    /**
     * Cancel the token when the QR dialog closes.
     */
    public function destroy(Request $request, string $token): JsonResponse
    {
        $this->find($request, $token)?->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * Tokens are only visible to the accountant who opened them.
     */
    private function find(Request $request, string $token): ?UploadToken
    {
        return UploadToken::query()
            ->where('token', $token)
            ->where('user_id', $request->user()->id)
            ->first();
    }
}
