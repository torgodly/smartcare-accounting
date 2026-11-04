<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use Illuminate\Support\Facades\File;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;
use Throwable;

/**
 * Server-side PDFs with mPDF (spec 9): real, shaped Arabic text.
 */
class PdfReports
{
    /** Receipt image box inside the A4 content area, in millimetres. */
    private const RECEIPT_BOX_WIDTH = 176;

    private const RECEIPT_BOX_HEIGHT = 110;

    public function __construct(
        private PayrollCalculator $calculator,
        private ReceiptStorage $receipts,
    ) {}

    /**
     * The monthly salary sheet.
     */
    public function salaries(string $month): string
    {
        $employees = Employee::query()->ordered()->get();
        $payroll = $this->calculator->forEmployees($employees, $month);

        $rows = $employees
            ->filter(fn (Employee $employee): bool => $payroll[$employee->id]['started'])
            ->map(fn (Employee $employee): array => ['employee' => $employee, 'payroll' => $payroll[$employee->id]])
            ->values();

        $html = view('pdf.salaries', [
            'month' => $month,
            'monthLabel' => Months::label($month),
            'rows' => $rows,
            'totals' => PayrollCalculator::totals($payroll),
            ...$this->common(),
        ])->render();

        return $this->render($html, 'كشف الرواتب · '.Months::label($month));
    }

    /**
     * A purchase group's monthly report with its receipts attached.
     */
    public function purchases(PurchaseGroup $group, string $month): string
    {
        $invoices = $group->invoices()->where('month', $month)->with('receipt')->orderBy('sequence')->get();

        $receipts = $invoices
            ->filter(fn (Invoice $invoice): bool => $invoice->receipt !== null)
            ->map(function (Invoice $invoice): ?array {
                $path = $this->receipts->absolutePath($invoice->receipt);
                $size = $path !== null ? @getimagesize($path) : false;

                if ($path === null || $size === false) {
                    return null;
                }

                [$width, $height] = $this->fit($size[0], $size[1]);

                return ['invoice' => $invoice, 'path' => $path, 'width' => $width, 'height' => $height];
            })
            ->filter()
            ->values();

        $html = view('pdf.purchases', [
            'group' => $group,
            'month' => $month,
            'monthLabel' => Months::label($month),
            'invoices' => $invoices,
            'summary' => [
                'total' => Money::fromCents($invoices->sum(fn (Invoice $invoice): int => Money::toCents($invoice->price))),
                'count' => $invoices->count(),
                'recurring' => $invoices->where('type', Invoice::TYPE_RECURRING)->count(),
                'with_receipts' => $invoices->whereNotNull('receipt_id')->count(),
            ],
            'receipts' => $receipts,
            ...$this->common(),
        ])->render();

        return $this->render($html, 'تقرير المشتريات · '.$group->name.' · '.Months::label($month));
    }

    /**
     * @return array{logo: string|null, issuedAt: string}
     */
    private function common(): array
    {
        $logo = public_path('img/logo-full.png');

        return [
            'logo' => File::exists($logo) ? $logo : null,
            'issuedAt' => now()->format('d/m/Y'),
        ];
    }

    /**
     * Scale an image to fit the receipt box (object-fit: contain), in mm.
     *
     * @return array{0: float, 1: float}
     */
    private function fit(int $width, int $height): array
    {
        $scale = min(self::RECEIPT_BOX_WIDTH / max($width, 1), self::RECEIPT_BOX_HEIGHT / max($height, 1));

        return [round($width * $scale, 1), round($height * $scale, 1)];
    }

    private function render(string $html, string $footerLabel): string
    {
        $mpdf = $this->make();
        $mpdf->SetTitle($footerLabel);
        $mpdf->SetHTMLFooter(view('pdf.footer', ['label' => $footerLabel])->render());
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }

    private function make(): Mpdf
    {
        $tempDir = storage_path('app/mpdf');
        File::ensureDirectoryExists($tempDir);

        $config = [
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_top' => 14,
            'margin_bottom' => 18,
            'margin_left' => 14,
            'margin_right' => 14,
            'margin_footer' => 8,
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'directionality' => 'rtl',
            'tempDir' => $tempDir,
        ];

        try {
            $fontDirs = (new ConfigVariables)->getDefaults()['fontDir'];
            $fontData = (new FontVariables)->getDefaults()['fontdata'];

            return new Mpdf([
                ...$config,
                'fontDir' => [...$fontDirs, resource_path('fonts')],
                'fontdata' => $fontData + [
                    'ibmplexarabic' => [
                        'R' => 'IBMPlexSansArabic-Regular.ttf',
                        'B' => 'IBMPlexSansArabic-Bold.ttf',
                        'useOTL' => 0xFF,
                        'useKashida' => 75,
                    ],
                ],
                'default_font' => 'ibmplexarabic',
                // Keep our font for Arabic instead of mPDF's automatic choice.
                'autoLangToFont' => false,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return new Mpdf([...$config, 'default_font' => 'dejavusans']);
        }
    }
}
