<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class Hostname implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (! is_string($value) || $value === '') {
            return false;
        }

        // Use PHP's FILTER_VALIDATE_DOMAIN when available.
        if (defined('FILTER_VALIDATE_DOMAIN')) {
            return filter_var($value, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) !== false;
        }

        // Fallback: validate with a conservative regex for hostnames (RFC 1035-ish)
        // Allows labels separated by dots, labels 1-63 chars, overall length <=253.
        $regex = '/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/i';

        return (bool) preg_match($regex, $value);
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The :attribute must be a valid hostname.';
    }
}
