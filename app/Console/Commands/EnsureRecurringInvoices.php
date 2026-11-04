<?php

namespace App\Console\Commands;

use App\Services\Months;
use App\Services\RecurringInvoices;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:recurring {month? : YYYY-MM, defaults to the current month}')]
#[Description('Copy last month\'s recurring invoices into the month')]
class EnsureRecurringInvoices extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(RecurringInvoices $recurring): int
    {
        $month = $this->argument('month') ?? Months::current();

        if (! Months::isValid($month)) {
            $this->error('Month must be YYYY-MM.');

            return self::FAILURE;
        }

        $created = $recurring->ensureFor($month);
        $this->info("Created {$created} recurring invoice(s) for {$month}.");

        return self::SUCCESS;
    }
}
