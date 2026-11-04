<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\PayrollCalculator;
use Illuminate\Http\JsonResponse;

class MonthController extends Controller
{
    /**
     * Twelve tiles for the month picker.
     */
    public function year(int $year, PayrollCalculator $calculator): JsonResponse
    {
        abort_unless($year >= 2000 && $year <= 2100, 404);

        return response()->json([
            'year' => $year,
            'months' => $calculator->yearSummary(Employee::query()->get(), $year),
        ]);
    }
}
