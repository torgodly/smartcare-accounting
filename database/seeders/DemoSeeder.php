<?php

namespace Database\Seeders;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PayrollRecord;
use App\Models\PurchaseGroup;
use App\Models\Setting;
use App\Services\Months;
use App\Services\RecurringInvoices;
use App\Services\SerialNumber;
use Illuminate\Database\Seeder;

/**
 * Demo data for local development only (spec 10.1). Every name ends with "(مثال)".
 */
class DemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(SerialNumber $serials, RecurringInvoices $recurring): void
    {
        if (app()->isProduction()) {
            return;
        }

        $current = Months::current();
        $previous = Months::add($current, -1);

        Setting::setValue('work_start', '08:00');
        Setting::setValue('work_end', '16:00');

        $ahmed = Employee::query()->create(['name' => 'أحمد سالم (مثال)', 'job_title' => 'مندوب مبيعات', 'base_salary' => 1800, 'start_month' => $previous, 'attendance_mode' => Employee::MODE_TIME]);
        $mariam = Employee::query()->create(['name' => 'مريم علي (مثال)', 'job_title' => 'محاسبة', 'base_salary' => 2200, 'start_month' => $previous, 'attendance_mode' => Employee::MODE_TIME]);
        $khaled = Employee::query()->create(['name' => 'خالد عمر (مثال)', 'job_title' => 'سائق', 'base_salary' => 1400, 'start_month' => $previous, 'attendance_mode' => Employee::MODE_NOTIME]);

        PayrollRecord::query()->create(['employee_id' => $ahmed->id, 'month' => $previous, 'base_salary' => 1800, 'bonus' => 200, 'paid_amount' => 2000]);
        PayrollRecord::query()->create(['employee_id' => $mariam->id, 'month' => $previous, 'base_salary' => 2200, 'paid_amount' => 2200]);
        PayrollRecord::query()->create(['employee_id' => $khaled->id, 'month' => $previous, 'base_salary' => 1400, 'manual_deduction' => 100, 'paid_amount' => 800]);

        $days = [
            [$ahmed, [['present', '08:00', null], ['present', '08:10', null], ['excuse', null, 'موعد طبي']]],
            [$mariam, [['present', '08:00', null], ['leave', null, 'إجازة سنوية'], ['present', '08:00', null]]],
            [$khaled, [['absent', null, null], ['present', null, null], ['absent', null, null]]],
        ];

        foreach ($days as [$employee, $entries]) {
            foreach ($entries as $index => [$status, $checkIn, $note]) {
                $timed = $status === 'present' && $employee->attendance_mode === Employee::MODE_TIME;

                AttendanceRecord::query()->create([
                    'employee_id' => $employee->id,
                    'date' => sprintf('%s-%02d', $current, $index + 1),
                    'status' => $status,
                    'check_in' => $timed ? $checkIn : null,
                    'check_out' => $timed ? '16:00' : null,
                    'note' => $note,
                ]);
            }
        }

        $internal = PurchaseGroup::query()->create(['name' => 'مشتريات داخلية (مثال)', 'code' => 'IN']);
        $companies = PurchaseGroup::query()->create(['name' => 'شركات (مثال)', 'code' => 'CO']);

        $serials->createInvoice($internal, $previous, ['title' => 'اشتراك إنترنت المكتب (مثال)', 'price' => 350, 'type' => Invoice::TYPE_RECURRING, 'reason' => 'الاشتراك الشهري']);
        $recurring->ensureFor($current);

        $serials->createInvoice($internal, $current, ['title' => 'أحبار طابعة (مثال)', 'price' => 185, 'type' => Invoice::TYPE_ONCE]);
        $serials->createInvoice($internal, $current, ['title' => 'مياه وقهوة للمكتب (مثال)', 'price' => 96.50, 'type' => Invoice::TYPE_ONCE]);
        $serials->createInvoice($companies, $current, ['title' => 'خدمة صيانة الحواسيب (مثال)', 'price' => 1200, 'type' => Invoice::TYPE_ONCE]);
    }
}
