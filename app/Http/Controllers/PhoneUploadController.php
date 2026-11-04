<?php

namespace App\Http\Controllers;

use App\Http\Requests\PhoneUploadRequest;
use App\Models\UploadToken;
use App\Services\ReceiptStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PhoneUploadController extends Controller
{
    /**
     * The phone page opened from the QR code (no login).
     */
    public function page(string $token): Response
    {
        return Inertia::render('Upload', ['token' => $token]);
    }

    /**
     * Token state for the phone page.
     */
    public function show(string $token): JsonResponse
    {
        $uploadToken = UploadToken::query()->where('token', $token)->first();

        if ($uploadToken === null) {
            return response()->json(['state' => 'invalid', 'expires_in' => 0]);
        }

        return response()->json([
            'state' => $uploadToken->state(),
            'expires_in' => max(0, (int) now()->diffInSeconds($uploadToken->expires_at, false)),
        ]);
    }

    /**
     * Receive the photo from the phone. Works once, before expiry.
     */
    public function store(PhoneUploadRequest $request, string $token, ReceiptStorage $storage): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $token, $storage): array {
            $uploadToken = UploadToken::query()->where('token', $token)->lockForUpdate()->first();

            if ($uploadToken === null) {
                return ['state' => 'invalid'];
            }

            if ($uploadToken->state() !== 'ok') {
                return ['state' => $uploadToken->state()];
            }

            $receipt = $storage->store($request->file('file'), 'phone');
            $uploadToken->update(['used_at' => now(), 'receipt_id' => $receipt->id]);

            return ['state' => 'done'];
        });

        return response()->json($result, $result['state'] === 'done' ? 201 : 410);
    }
}
