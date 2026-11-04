<table width="100%" class="header">
    <tr>
        <td style="text-align: right;">
            @if ($logo)
                <img src="{{ $logo }}" style="width: 45mm;" alt=""><br>
            @endif
            <h1>{{ $title }}</h1>
            <div class="subtitle">{{ $subtitle }}</div>
        </td>
        <td style="text-align: left; width: 45mm;">
            <div class="muted" style="font-size: 9pt;">تاريخ الإصدار</div>
            <div class="num" style="font-size: 11pt; font-weight: bold;">{{ $issuedAt }}</div>
        </td>
    </tr>
</table>
<div class="stripe-teal"></div>
<div class="stripe-gold"></div>
