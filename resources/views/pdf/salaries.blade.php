@php($money = fn ($value) => \App\Services\Money::format($value))
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    @include('pdf._styles')
</head>
<body>
    @include('pdf._header', ['title' => 'كشف الرواتب', 'subtitle' => $monthLabel])

    <table width="100%" class="totals">
        <tr>
            <td><div style="font-size: 9pt; color: #62707a;">إجمالي المستحق (د.ل)</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $money($totals['total']) }}</div></td>
            <td><div style="font-size: 9pt; color: #62707a;">المدفوع (د.ل)</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $money($totals['paid']) }}</div></td>
            <td><div style="font-size: 9pt; color: #62707a;">يُرحّل للشهر القادم (د.ل)</div><div style="font-size: 16pt; font-weight: bold; color: #2d3134;">{{ $money($totals['remaining']) }}</div></td>
        </tr>
    </table>

    <table class="data" repeat_header="1">
        <thead>
            <tr>
                <th>الموظف</th>
                <th>الأساسي</th>
                <th>مكافأة</th>
                <th>خصم</th>
                <th>أيام الغياب</th>
                <th>مرحّل</th>
                <th>المستحق</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                @php($p = $row['payroll'])
                <tr>
                    <td><b>{{ $row['employee']->name }}</b>@if ($row['employee']->job_title)<br><span class="muted" style="font-size: 8.5pt;">{{ $row['employee']->job_title }}</span>@endif</td>
                    <td class="num">{{ $money($p['base']) }}</td>
                    <td class="num">{{ $p['bonus'] > 0 ? $money($p['bonus']) : '—' }}</td>
                    <td class="num">{{ $p['deduction'] > 0 ? $money($p['deduction']) : '—' }}</td>
                    <td class="num">{{ $p['absent_days'] ?: '—' }}</td>
                    <td class="num">{{ $p['carry'] != 0 ? $money($p['carry']) : '—' }}</td>
                    <td class="num"><b>{{ $money($p['total']) }}</b></td>
                    <td class="num">{{ $money($p['paid']) }}</td>
                    <td class="num">{{ $money($p['remaining']) }}</td>
                    <td>
                        @if ($p['status'] === 'paid')
                            <span class="ok">مدفوع</span>
                        @elseif ($p['status'] === 'partial')
                            <span class="warn">جزئي</span>
                        @else
                            <span class="bad">غير مدفوع</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr><td colspan="10" class="muted" style="text-align: center;">لا يوجد موظفون في هذا الشهر</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td>الإجمالي</td>
                <td class="num">{{ $money($totals['base']) }}</td>
                <td class="num">{{ $money($totals['bonus']) }}</td>
                <td class="num">{{ $money($totals['deduction']) }}</td>
                <td></td>
                <td class="num">{{ $money($totals['carry']) }}</td>
                <td class="num">{{ $money($totals['total']) }}</td>
                <td class="num">{{ $money($totals['paid']) }}</td>
                <td class="num">{{ $money($totals['remaining']) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>

    <table class="signatures">
        <tr>
            <td>توقيع المحاسب: ____________________</td>
            <td style="text-align: left;">اعتماد المدير: ____________________</td>
        </tr>
    </table>
</body>
</html>
