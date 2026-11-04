<?php

namespace App\Http\Controllers;

use App\Services\Months;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * The month selected in the URL (?month=YYYY-MM), defaulting to the current month.
     */
    protected function selectedMonth(Request $request, string $key = 'month'): string
    {
        return Months::orCurrent($request->query($key));
    }
}
