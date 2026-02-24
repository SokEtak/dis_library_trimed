<?php

namespace App\Http\Middleware;

use App\Models\BookLoanRequest;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [ // Use 'auth' to match your frontend
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'avatar' => $request->user()->avatar,
                    'show_activity_log_alert_popup' => $request->user()->show_activity_log_alert_popup ?? true,
                    'show_loan_request_alert_popup' => $request->user()->show_loan_request_alert_popup ?? true,
                    'roles' => $request->user()->getRoleNames()->toArray(), // Spatie roles
                    'permissions' => $request->user()->getAllPermissions()->pluck('name')->toArray(), // Spatie permissions
                ] : null,
            ],
            // ✅ Flash messages
            'flash' => [
                'message' => fn () => $request->session()->get('flash.message'),
                'error' => fn () => $request->session()->get('flash.error'),
                'warning' => fn () => $request->session()->get('flash.warning'),
            ],

            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'adminLoanRequests' => function () use ($request) {
                $user = $request->user();

                if (! $user || ! $user->hasRole('admin')) {
                    return [];
                }

                return BookLoanRequest::query()
                    ->with(['book:id,title', 'requester:id,name'])
                    ->pending()
                    ->when($user->campus_id, function ($requestQuery, $campusId) {
                        $requestQuery->where('campus_id', $campusId);
                    })
                    ->latest('created_at')
                    ->get()
                    ->map(function ($loanRequest) {
                        return [
                            'id' => $loanRequest->id,
                            'book_id' => $loanRequest->book_id,
                            'book_title' => $loanRequest->book?->title,
                            'requester_id' => $loanRequest->requester_id,
                            'requester_name' => $loanRequest->requester?->name,
                            'status' => $loanRequest->status,
                            'canceled_by_requester' => $loanRequest->status === 'rejected' && ! $loanRequest->approver_id,
                            'created_at' => optional($loanRequest->created_at)->toIso8601String(),
                        ];
                    })
                    ->values()
                    ->all();
            },
        ];
    }
}
