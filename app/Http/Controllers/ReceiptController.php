<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReceiptRequest;
use App\Models\Receipt;
use App\Services\ReceiptStorage;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReceiptController extends Controller
{
    /**
     * Upload a receipt image from the computer.
     */
    public function store(StoreReceiptRequest $request, ReceiptStorage $storage): JsonResponse
    {
        $receipt = $storage->store($request->file('file'), 'computer');

        return response()->json(['id' => $receipt->id, 'url' => $receipt->url()], 201);
    }

    /**
     * Stream a private receipt image.
     */
    public function show(Receipt $receipt, ReceiptStorage $storage): BinaryFileResponse
    {
        $path = $storage->absolutePath($receipt);

        abort_if($path === null, 404);

        $response = response()->file($path, ['Content-Type' => $receipt->mime]);
        $response->setPrivate();
        $response->setMaxAge(31536000);

        return $response;
    }
}
