<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    /**
     * Show the notification preference settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/notifications', [
            'preferences' => [
                'show_activity_log_alert_popup' => $request->user()->show_activity_log_alert_popup ?? true,
                'show_loan_request_alert_popup' => $request->user()->show_loan_request_alert_popup ?? true,
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update notification popup preferences for the authenticated user.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'show_activity_log_alert_popup' => ['required', 'boolean'],
            'show_loan_request_alert_popup' => ['required', 'boolean'],
        ]);

        $request->user()->forceFill($validated)->save();

        return back()->with('status', 'notification-preferences-updated');
    }
}
