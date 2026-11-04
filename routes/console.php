<?php

use App\Models\UploadToken;
use App\Services\ReceiptStorage;
use Illuminate\Support\Facades\Schedule;

Schedule::command('app:recurring')->dailyAt('00:10');

Schedule::call(function (): void {
    UploadToken::query()->where('created_at', '<', now()->subDay())->delete();
    app(ReceiptStorage::class)->pruneOrphans();
})->daily()->name('prune-upload-tokens');
