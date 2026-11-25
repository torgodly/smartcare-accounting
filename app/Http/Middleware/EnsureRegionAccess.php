<?php

namespace App\Http\Middleware;

use App\Models\Custody;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\PurchaseGroup;
use App\Models\Treasury;
use App\Models\TreasuryTransaction;
use App\Services\Regions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A regional account may only open records of its own region (admins pass through).
 */
class EnsureRegionAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Regions::lockedFor($request) === null) {
            return $next($request);
        }

        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            $region = match (true) {
                $parameter instanceof Employee,
                $parameter instanceof PurchaseGroup,
                $parameter instanceof Treasury,
                $parameter instanceof Custody => $parameter->region,
                $parameter instanceof Invoice => $parameter->group?->region,
                $parameter instanceof TreasuryTransaction => $parameter->treasury?->region,
                default => false,
            };

            if ($region !== false && ! Regions::allows($request, $region)) {
                abort(403, 'هذا السجل يتبع منطقة أخرى');
            }
        }

        return $next($request);
    }
}
