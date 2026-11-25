<?php

namespace App\Models\Concerns;

use App\Services\Regions;
use Illuminate\Database\Eloquent\Builder;

/**
 * Records that belong to the east or west region.
 */
trait HasRegion
{
    /**
     * Limit to a region; "all" leaves the query alone.
     *
     * @param  Builder<static>  $query
     */
    public function scopeInRegion(Builder $query, string $region): void
    {
        if ($region !== Regions::ALL) {
            $query->where($this->qualifyColumn('region'), $region);
        }
    }
}
