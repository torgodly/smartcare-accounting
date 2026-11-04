<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Models\Employee;
use App\Services\PayrollCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Create an employee.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        Employee::query()->create($request->validated());

        Inertia::flash('success', 'تمت إضافة الموظف');

        return back();
    }

    /**
     * Update an employee.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $employee->update($request->validated());

        Inertia::flash('success', 'تم الحفظ');

        return back();
    }

    /**
     * Delete an employee with all their payroll and attendance rows.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        Inertia::flash('success', 'تم حذف الموظف');

        return back();
    }

    /**
     * Month-by-month history for the history dialog.
     */
    public function history(Request $request, Employee $employee, PayrollCalculator $calculator): JsonResponse
    {
        return response()->json([
            'rows' => $calculator->history($employee, $this->selectedMonth($request, 'until')),
        ]);
    }
}
