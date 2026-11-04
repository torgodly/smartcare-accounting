<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceSettingsController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MonthController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PhoneUploadController;
use App\Http\Controllers\PurchaseGroupController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UploadTokenController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:20,1')->name('login.store');
});

// Phone receipt upload opened from the QR code: no login.
Route::get('/upload/{token}', [PhoneUploadController::class, 'page'])->name('upload.page');
Route::get('/api/upload/{token}', [PhoneUploadController::class, 'show'])->middleware('throttle:60,1')->name('upload.show');
Route::post('/api/upload/{token}', [PhoneUploadController::class, 'store'])->middleware('throttle:20,1')->name('upload.store');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('/', [HomeController::class, 'index'])->name('home');

    Route::get('/salaries', [PayrollController::class, 'index'])->name('salaries.index');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::get('/employees/{employee}/history', [EmployeeController::class, 'history'])->name('employees.history');
    Route::put('/payroll/{employee}/{month}', [PayrollController::class, 'update'])->name('payroll.update');
    Route::post('/payroll/{employee}/{month}/pay-full', [PayrollController::class, 'payFull'])->name('payroll.pay-full');

    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/attendance/mark-all', [AttendanceController::class, 'markAll'])->name('attendance.mark-all');
    Route::put('/attendance/settings', [AttendanceSettingsController::class, 'update'])->name('attendance.settings');
    Route::put('/attendance/{employee}/{date}', [AttendanceController::class, 'update'])->name('attendance.update');

    Route::get('/purchases', [PurchaseGroupController::class, 'index'])->name('purchase-groups.index');
    Route::get('/purchases/{group}', [PurchaseGroupController::class, 'show'])->name('purchase-groups.show');
    Route::post('/purchase-groups', [PurchaseGroupController::class, 'store'])->name('purchase-groups.store');
    Route::put('/purchase-groups/{group}', [PurchaseGroupController::class, 'update'])->name('purchase-groups.update');
    Route::delete('/purchase-groups/{group}', [PurchaseGroupController::class, 'destroy'])->name('purchase-groups.destroy');
    Route::post('/purchase-groups/{group}/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    Route::post('/receipts', [ReceiptController::class, 'store'])->name('receipts.store');
    Route::get('/receipts/{receipt}', [ReceiptController::class, 'show'])->name('receipts.show');

    Route::post('/upload-tokens', [UploadTokenController::class, 'store'])->name('upload-tokens.store');
    Route::get('/upload-tokens/{token}', [UploadTokenController::class, 'show'])->name('upload-tokens.show');
    Route::delete('/upload-tokens/{token}', [UploadTokenController::class, 'destroy'])->name('upload-tokens.destroy');

    Route::get('/api/months/{year}', [MonthController::class, 'year'])->whereNumber('year')->name('months.year');

    Route::get('/reports/salaries/{month}', [ReportController::class, 'salaries'])->name('reports.salaries');
    Route::get('/reports/purchases/{group}/{month}', [ReportController::class, 'purchases'])->name('reports.purchases');
});
