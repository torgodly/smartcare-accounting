<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

#[Signature('app:user {email : The accountant\'s email} {--name= : Display name} {--password= : Password (asked when missing)}')]
#[Description('Create an accountant account, or reset the password when the email exists')]
class CreateUser extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));

        if (Validator::make(['email' => $email], ['email' => ['required', 'email']])->fails()) {
            $this->error('Invalid email address.');

            return self::FAILURE;
        }

        $password = (string) ($this->option('password') ?? $this->secret('Password'));

        if (strlen($password) < 8) {
            $this->error('The password must be at least 8 characters.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();

        if ($user !== null) {
            $user->password = $password;
            if ($this->option('name')) {
                $user->name = (string) $this->option('name');
            }
            $user->save();

            $this->info("Password reset for {$email}.");

            return self::SUCCESS;
        }

        User::query()->create([
            'name' => (string) ($this->option('name') ?: 'المحاسب'),
            'email' => $email,
            'password' => $password,
        ]);

        $this->info("Account created for {$email}.");

        return self::SUCCESS;
    }
}
