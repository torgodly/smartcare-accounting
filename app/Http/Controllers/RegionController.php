<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateRegionRequest;
use App\Services\Regions;
use Illuminate\Http\RedirectResponse;

class RegionController extends Controller
{
    /**
     * Switch the region filter (east, west or all) for this session.
     */
    public function update(UpdateRegionRequest $request): RedirectResponse
    {
        $request->session()->put(Regions::SESSION_KEY, $request->validated('region'));

        return back();
    }
}
