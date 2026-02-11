<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAccountActivated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->user() && ! auth()->user()->isActive) {
            auth()->logout();

            // Redirect with a flash warning instead of status
            return redirect()
                ->route('login')
                ->with('flash.warning', 'Your account has been deactivated...');

        }

        return $next($request);
    }
}
