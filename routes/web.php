<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceSettingsController;
use App\Http\Controllers\CustodyController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MonthController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PhoneUploadController;
use App\Http\Controllers\PurchaseGroupController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TreasuryController;
use App\Http\Controllers\TreasuryTransactionController;
use App\Http\Controllers\UploadTokenController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:20,1')->name('login.store');
});

// Phone receipt upload opened from the QR code: no login.
Route::get('/upload/{token}', [PhoneUploadController::class, 'page'])->name('upload.page');
Route::get('/api/upload/{token}', [PhoneUploadController::class, 'show'])->middleware('throttle:60,1')->name('upload.show');
Route::post('/api/upload/{token}', [PhoneUploadController::class, 'store'])->middleware('throttle:20,1')->name('upload.store');

Route::middleware(['auth', 'region'])->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('/', [HomeController::class, 'index'])->name('home');
    Route::put('/region', [RegionController::class, 'update'])->name('region.update');

    Route::middleware('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

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
    Route::get('/expenses', [PurchaseGroupController::class, 'expenses'])->name('expenses.index');
    Route::post('/purchase-groups', [PurchaseGroupController::class, 'store'])->name('purchase-groups.store');
    Route::put('/purchase-groups/{group}', [PurchaseGroupController::class, 'update'])->name('purchase-groups.update');
    Route::delete('/purchase-groups/{group}', [PurchaseGroupController::class, 'destroy'])->name('purchase-groups.destroy');
    Route::post('/purchase-groups/{group}/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    Route::get('/treasuries', [TreasuryController::class, 'index'])->name('treasuries.index');
    Route::post('/treasuries', [TreasuryController::class, 'store'])->name('treasuries.store');
    Route::get('/treasuries/{treasury}', [TreasuryController::class, 'show'])->name('treasuries.show');
    Route::put('/treasuries/{treasury}', [TreasuryController::class, 'update'])->name('treasuries.update');
    Route::delete('/treasuries/{treasury}', [TreasuryController::class, 'destroy'])->name('treasuries.destroy');
    Route::post('/treasuries/{treasury}/transactions', [TreasuryTransactionController::class, 'store'])->name('treasury-transactions.store');
    Route::delete('/treasury-transactions/{transaction}', [TreasuryTransactionController::class, 'destroy'])->name('treasury-transactions.destroy');

    Route::get('/custodies', [CustodyController::class, 'index'])->name('custodies.index');
    Route::post('/custodies', [CustodyController::class, 'store'])->name('custodies.store');
    Route::get('/custodies/{custody}', [CustodyController::class, 'show'])->name('custodies.show');
    Route::put('/custodies/{custody}', [CustodyController::class, 'update'])->name('custodies.update');
    Route::delete('/custodies/{custody}', [CustodyController::class, 'destroy'])->name('custodies.destroy');
    Route::post('/custodies/{custody}/top-up', [CustodyController::class, 'topUp'])->name('custodies.top-up');
    Route::post('/custodies/{custody}/replenish', [CustodyController::class, 'replenish'])->name('custodies.replenish');
    Route::post('/custodies/{custody}/close', [CustodyController::class, 'close'])->name('custodies.close');

    Route::post('/receipts', [ReceiptController::class, 'store'])->name('receipts.store');
    Route::get('/receipts/{receipt}', [ReceiptController::class, 'show'])->name('receipts.show');

    Route::post('/upload-tokens', [UploadTokenController::class, 'store'])->name('upload-tokens.store');
    Route::get('/upload-tokens/{token}', [UploadTokenController::class, 'show'])->name('upload-tokens.show');
    Route::delete('/upload-tokens/{token}', [UploadTokenController::class, 'destroy'])->name('upload-tokens.destroy');

    Route::get('/api/months/{year}', [MonthController::class, 'year'])->whereNumber('year')->name('months.year');

    Route::get('/reports/salaries/{month}', [ReportController::class, 'salaries'])->name('reports.salaries');
    Route::get('/reports/purchases/{group}/{month}', [ReportController::class, 'purchases'])->name('reports.purchases');
});
