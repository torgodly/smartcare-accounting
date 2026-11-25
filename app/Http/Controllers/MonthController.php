<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\PayrollCalculator;
use App\Services\Regions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthController extends Controller
{
    /**
     * Twelve tiles for the month picker.
     */
    public function year(Request $request, int $year, PayrollCalculator $calculator): JsonResponse
    {
        abort_unless($year >= 2000 && $year <= 2100, 404);

        return response()->json([
            'year' => $year,
            'months' => $calculator->yearSummary(Employee::query()->inRegion(Regions::current($request))->get(), $year),
        ]);
    }
}
