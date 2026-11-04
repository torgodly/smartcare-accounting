<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAttendanceSettingsRequest;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceSettingsController extends Controller
{
    /**
     * Save default work hours and every employee's attendance mode, shift and day rate.
     */
    public function update(UpdateAttendanceSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            Setting::setValue('work_start', $data['work_start']);
            Setting::setValue('work_end', $data['work_end']);

            foreach ($data['employees'] ?? [] as $row) {
                $changes = ['attendance_mode' => $row['attendance_mode']];

                // Disabled inputs keep their stored values.
                if ($row['attendance_mode'] === Employee::MODE_TIME) {
                    $changes['shift_start'] = $row['shift_start'] ?? null;
                    $changes['shift_end'] = $row['shift_end'] ?? null;
                }

                if ($row['attendance_mode'] !== Employee::MODE_NONE) {
                    $changes['absence_day_rate'] = $row['absence_day_rate'] ?? null;
                }

                Employee::query()->whereKey($row['id'])->update($changes);
            }
        });

        Inertia::flash('success', 'تم حفظ الإعدادات');

        return back();
    }
}
