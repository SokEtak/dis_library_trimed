<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookLoan;
use App\Models\Campus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Activity::query()
            ->with(['causer:id,name,email', 'subject'])
            ->whereIn('subject_type', [Book::class, BookLoan::class]);

        if ($user && $user->hasRole('staff') && ! $user->hasRole('admin') && $user->campus_id) {
            $bookIds = Book::query()
                ->where('campus_id', $user->campus_id)
                ->pluck('id');

            $loanIds = BookLoan::query()
                ->where('campus_id', $user->campus_id)
                ->pluck('id');

            $query->where(function ($campusQuery) use ($bookIds, $loanIds): void {
                $campusQuery
                    ->where(function ($bookLogQuery) use ($bookIds): void {
                        $bookLogQuery->where('subject_type', Book::class);

                        if ($bookIds->isEmpty()) {
                            $bookLogQuery->whereRaw('1 = 0');

                            return;
                        }

                        $bookLogQuery->whereIn('subject_id', $bookIds);
                    })
                    ->orWhere(function ($loanLogQuery) use ($loanIds): void {
                        $loanLogQuery->where('subject_type', BookLoan::class);

                        if ($loanIds->isEmpty()) {
                            $loanLogQuery->whereRaw('1 = 0');

                            return;
                        }

                        $loanLogQuery->whereIn('subject_id', $loanIds);
                    });
            });
        }

        $campusMap = Campus::query()->pluck('name', 'id');

        $logs = $query
            ->latest('created_at')
            ->limit(1000)
            ->get()
            ->map(function (Activity $activity) use ($campusMap): array {
                $properties = $activity->properties?->toArray() ?? [];
                $attributes = data_get($properties, 'attributes', []);
                $old = data_get($properties, 'old', []);

                $attributes = is_array($attributes) ? $attributes : [];
                $old = is_array($old) ? $old : [];

                $changedColumns = collect(array_keys(array_merge($old, $attributes)))
                    ->filter(function (string $key) use ($attributes, $old): bool {
                        $newValueExists = array_key_exists($key, $attributes);
                        $oldValueExists = array_key_exists($key, $old);

                        if (! $newValueExists || ! $oldValueExists) {
                            return true;
                        }

                        return $attributes[$key] !== $old[$key];
                    })
                    ->values()
                    ->take(6)
                    ->all();

                $campusId = $attributes['campus_id'] ?? $old['campus_id'] ?? data_get($activity, 'subject.campus_id');
                $campusName = $campusId ? ($campusMap[$campusId] ?? "Campus #{$campusId}") : null;
                $event = $activity->event ?: $activity->description;

                return [
                    'id' => $activity->id,
                    'log_name' => $activity->log_name ?: config('activitylog.default_log_name', 'default'),
                    'event' => (string) $event,
                    'description' => $activity->description,
                    'subject_type' => $activity->subject_type === Book::class ? 'Book' : 'Loan',
                    'subject_id' => $activity->subject_id ? (int) $activity->subject_id : null,
                    'subject_label' => $this->resolveSubjectLabel($activity, $attributes, $old),
                    'causer_name' => $activity->causer?->name ?? 'System',
                    'causer_email' => $activity->causer?->email,
                    'changes' => $changedColumns !== [] ? implode(', ', $changedColumns) : 'No field changes',
                    'campus_name' => $campusName,
                    'created_at' => optional($activity->created_at)->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Logs/Index', [
            'logs' => $logs,
            'flash' => [
                'message' => session('flash.message') ?? session('message'),
                'error' => session('flash.error'),
            ],
        ]);
    }

    private function resolveSubjectLabel(Activity $activity, array $attributes, array $old): string
    {
        if ($activity->subject_type === Book::class) {
            $title = $attributes['title'] ?? $old['title'] ?? data_get($activity, 'subject.title');

            if (is_string($title) && $title !== '') {
                return $title;
            }

            $id = $activity->subject_id ?? 'N/A';

            return "Book #{$id}";
        }

        $status = $attributes['status'] ?? $old['status'] ?? data_get($activity, 'subject.status');
        $id = $activity->subject_id ?? 'N/A';

        if (is_string($status) && $status !== '') {
            return "Loan #{$id} ({$status})";
        }

        return "Loan #{$id}";
    }
}
