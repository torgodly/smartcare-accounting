<?php

namespace App\Http\Controllers;

use App\Models\PurchaseGroup;
use App\Services\Months;
use App\Services\PdfReports;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    /**
     * Salary sheet PDF.
     */
    public function salaries(string $month, PdfReports $reports): Response
    {
        abort_unless(Months::isValid($month), 404);

        return $this->download($reports->salaries($month), "SmartCare-Salaries-{$month}.pdf");
    }

    /**
     * Group monthly purchases PDF.
     */
    public function purchases(PurchaseGroup $group, string $month, PdfReports $reports): Response
    {
        abort_unless(Months::isValid($month), 404);

        return $this->download($reports->purchases($group, $month), "SmartCare-Purchases-{$group->code}-{$month}.pdf");
    }

    private function download(string $pdf, string $filename): Response
    {
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
