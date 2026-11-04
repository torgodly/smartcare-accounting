@php($money = fn ($value) => \App\Services\Money::format($value))
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    @include('pdf._styles')
    <style>
        .receipt { border: 0.3mm solid #d9e2e8; border-radius: 2mm; margin-bottom: 6mm; }
        .receipt .caption td { padding: 2.5mm 3mm; border-bottom: 0.3mm solid #d9e2e8; background: #f5f7f9; }
        .receipt .image { text-align: center; padding: 3mm; height: 112mm; vertical-align: middle; }
    </style>
</head>
<body>
    @include('pdf._header', ['title' => $group->name, 'subtitle' => 'تقرير المشتريات الشهري · '.$monthLabel])

    <table width="100%" class="totals">
        <tr>
            <td><div style="font-size: 9pt; color: #62707a;">إجمالي المشتريات (د.ل)</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $money($summary['total']) }}</div></td>
            <td><div style="font-size: 9pt; color: #62707a;">عدد الفواتير</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $summary['count'] }}</div></td>
            <td><div style="font-size: 9pt; color: #62707a;">متكررة</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $summary['recurring'] }}</div></td>
            <td><div style="font-size: 9pt; color: #62707a;">إيصالات مرفقة</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $summary['with_receipts'] }}</div></td>
        </tr>
    </table>

    <table class="data" repeat_header="1">
        <thead>
            <tr>
                <th style="width: 8mm;">#</th>
                <th>رقم الفاتورة</th>
                <th>العنوان</th>
                <th>السبب</th>
                <th>النوع</th>
                <th>الإيصال</th>
                <th>السعر (د.ل)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($invoices as $invoice)
                <tr>
                    <td class="num">{{ $loop->iteration }}</td>
                    <td class="serial" dir="ltr">{{ $invoice->serial }}</td>
                    <td><b>{{ $invoice->title }}</b></td>
                    <td class="muted">{{ $invoice->reason ?: '—' }}</td>
                    <td>{{ $invoice->type === 'recurring' ? 'متكرر' : 'مرة واحدة' }}</td>
                    <td>@if ($invoice->receipt_id)<span class="ok">مرفق</span>@else<span class="warn">لا يوجد</span>@endif</td>
                    <td class="num"><b>{{ $money($invoice->price) }}</b></td>
                </tr>
            @empty
                <tr><td colspan="7" class="muted" style="text-align: center;">لا توجد فواتير في هذا الشهر</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="6">الإجمالي</td>
                <td class="num">{{ $money($summary['total']) }} د.ل</td>
            </tr>
        </tfoot>
    </table>

    <table class="signatures">
        <tr>
            <td>توقيع المحاسب: ____________________</td>
            <td style="text-align: left;">اعتماد المدير: ____________________</td>
        </tr>
    </table>

    @if ($receipts->isNotEmpty())
        <pagebreak />
        <h1 style="font-size: 16pt;">الإيصالات المرفقة</h1>
        @foreach ($receipts as $receipt)
            @if ($loop->index > 0 && $loop->index % 2 === 0)
                <pagebreak />
            @endif
            <table width="100%" class="receipt" style="page-break-inside: avoid;">
                <tr class="caption">
                    <td style="text-align: right;"><b>{{ $receipt['invoice']->title }}</b> <span class="serial">{{ $receipt['invoice']->serial }}</span></td>
                    <td style="text-align: left;" class="num"><b>{{ $money($receipt['invoice']->price) }}</b> د.ل</td>
                </tr>
                <tr>
                    <td colspan="2" class="image">
                        <img src="{{ $receipt['path'] }}" style="width: {{ $receipt['width'] }}mm; height: {{ $receipt['height'] }}mm;" alt="">
                    </td>
                </tr>
            </table>
        @endforeach
    @endif
</body>
</html>
