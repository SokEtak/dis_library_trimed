import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import echo from '@/lib/echo';
import { Link, usePage } from '@inertiajs/react';
import { BellRing, Book, BookOpenCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LiveActivityLog {
    id: number;
    event: string;
    subject_type: 'Book' | 'Loan' | 'Entity';
    subject_label: string;
    causer_name: string;
    changes: string;
    created_at: string | null;
}

interface SharedData {
    auth: {
        user: {
            id: number;
            roles?: string[];
            show_activity_log_alert_popup?: boolean;
        } | null;
    };
    [key: string]: unknown;
}

interface LiveLogPayload {
    activity?: LiveActivityLog;
}

const kmNumberFormatter = new Intl.NumberFormat('km-KH');

const parseTimestamp = (value: string | null): number => {
    if (!value) return 0;

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const eventBadgeClass = (event: string): string => {
    const normalized = event.toLowerCase();

    if (normalized === 'created') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200';
    if (normalized === 'updated') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200';
    if (normalized === 'deleted') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200';
    if (normalized === 'restored') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200';

    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
};

const eventLabel = (event: string): string => {
    const normalized = event.toLowerCase();

    if (normalized === 'created') return 'បង្កើត';
    if (normalized === 'updated') return 'កែប្រែ';
    if (normalized === 'deleted') return 'លុប';
    if (normalized === 'restored') return 'ស្ដារ';

    return event;
};

const subjectTypeLabel = (subjectType: LiveActivityLog['subject_type']): string => {
    if (subjectType === 'Book') return 'សៀវភៅ';
    if (subjectType === 'Loan') return 'កម្ចី';

    return 'ទិន្នន័យ';
};

const normalizeChangesText = (changes: string): string => {
    return changes === 'No field changes' ? 'គ្មានការផ្លាស់ប្តូរ' : changes;
};

const formatRelativeAge = (createdAt: string | null, nowMs: number): string => {
    const createdAtMs = parseTimestamp(createdAt);
    if (!createdAtMs) return 'ឥឡូវនេះ';

    const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));

    if (elapsedSeconds < 60) return `${kmNumberFormatter.format(elapsedSeconds)} វិនាទីមុន`;

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${kmNumberFormatter.format(elapsedMinutes)} នាទីមុន`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${kmNumberFormatter.format(elapsedHours)} ម៉ោងមុន`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${kmNumberFormatter.format(elapsedDays)} ថ្ងៃមុន`;
};

export default function ActivityLogAlerts() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const hasLogPopupEnabled = auth.user?.show_activity_log_alert_popup ?? true;
    const canWatchLogs = (auth.user?.roles?.some((role) => role === 'admin' || role === 'staff') ?? false) && hasLogPopupEnabled;

    const [alerts, setAlerts] = useState<LiveActivityLog[]>([]);
    const [highlightedAlertIds, setHighlightedAlertIds] = useState<number[]>([]);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const autoDismissTimersRef = useRef<Map<number, number>>(new Map());

    const hasVeryRecentAlert = useMemo(
        () =>
            alerts.some((alert) => {
                const createdAtMs = parseTimestamp(alert.created_at);
                if (!createdAtMs) {
                    return false;
                }

                return Math.max(0, nowMs - createdAtMs) < 60_000;
            }),
        [alerts, nowMs],
    );

    useEffect(() => {
        if (alerts.length === 0) {
            return;
        }

        const refreshIntervalMs = hasVeryRecentAlert ? 1_000 : 30_000;
        const intervalId = window.setInterval(() => {
            setNowMs(Date.now());
        }, refreshIntervalMs);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [alerts, hasVeryRecentAlert]);

    const dismissAlert = (activityId: number) => {
        const timerId = autoDismissTimersRef.current.get(activityId);
        if (timerId) {
            window.clearTimeout(timerId);
            autoDismissTimersRef.current.delete(activityId);
        }

        setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== activityId));
        setHighlightedAlertIds((currentIds) => currentIds.filter((id) => id !== activityId));
    };

    const markAlertHighlighted = (activityId: number) => {
        setHighlightedAlertIds((currentIds) => (currentIds.includes(activityId) ? currentIds : [...currentIds, activityId]));

        window.setTimeout(() => {
            setHighlightedAlertIds((currentIds) => currentIds.filter((id) => id !== activityId));
        }, 2200);
    };

    useEffect(() => {
        const timers = autoDismissTimersRef.current;

        return () => {
            timers.forEach((timerId) => window.clearTimeout(timerId));
            timers.clear();
        };
    }, []);

    useEffect(() => {
        if (canWatchLogs) {
            return;
        }

        autoDismissTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
        autoDismissTimersRef.current.clear();
        setAlerts([]);
        setHighlightedAlertIds([]);
    }, [canWatchLogs]);

    useEffect(() => {
        if (!canWatchLogs) {
            return;
        }

        const echoInstance = echo;
        if (!echoInstance) {
            return;
        }

        const channelName = 'activity.logs';
        const eventName = '.activity.logs.updated';
        const channel = echoInstance.private(channelName);

        const handleUpdatedEvent = (event: LiveLogPayload) => {
            if (!event.activity?.id) {
                return;
            }

            const incomingActivity = event.activity;

            setAlerts((currentAlerts) => {
                if (currentAlerts.some((existingAlert) => existingAlert.id === incomingActivity.id)) {
                    return currentAlerts;
                }

                return [incomingActivity, ...currentAlerts].slice(0, 6);
            });

            markAlertHighlighted(incomingActivity.id);

            const existingTimerId = autoDismissTimersRef.current.get(incomingActivity.id);
            if (existingTimerId) {
                window.clearTimeout(existingTimerId);
            }

            const timerId = window.setTimeout(() => {
                dismissAlert(incomingActivity.id);
            }, 12_000);

            autoDismissTimersRef.current.set(incomingActivity.id, timerId);
        };

        channel.listen(eventName, handleUpdatedEvent);

        return () => {
            channel.stopListening(eventName);
            echoInstance.leave(channelName);
        };
    }, [canWatchLogs]);

    if (!canWatchLogs || alerts.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(96vw,30rem)] flex-col gap-3">
            <div className="pointer-events-auto overflow-hidden rounded-2xl border border-cyan-200 bg-white/95 shadow-2xl backdrop-blur dark:border-cyan-800 dark:bg-slate-900/95">
                <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-100/70 via-sky-100/40 to-indigo-100/40 px-4 py-3 dark:border-cyan-900 dark:from-cyan-900/25 dark:via-sky-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                        <BellRing className="h-4 w-4" />
                        កំណត់ហេតុសកម្មភាពបន្តផ្ទាល់
                        <span className="ml-auto rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] normal-case text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200">
                            {kmNumberFormatter.format(alerts.length)} ថ្មី
                        </span>
                    </div>
                </div>
                <div className="max-h-[calc(100vh-9rem)] space-y-2 overflow-y-auto p-3">
                    {alerts.map((alert) => {
                        const isHighlighted = highlightedAlertIds.includes(alert.id);

                        return (
                            <section
                                key={alert.id}
                                className={`rounded-xl border p-3 shadow-sm transition hover:shadow-md ${
                                    isHighlighted
                                        ? 'border-amber-300 bg-amber-50/70 ring-2 ring-amber-200 dark:border-amber-500 dark:bg-amber-950/30 dark:ring-amber-500/40'
                                        : 'border-cyan-100 bg-cyan-50/40 dark:border-cyan-900 dark:bg-cyan-950/20'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={eventBadgeClass(alert.event)}>{eventLabel(alert.event)}</Badge>
                                            <span className="text-xs text-gray-500 dark:text-gray-300">{formatRelativeAge(alert.created_at, nowMs)}</span>
                                        </div>
                                        <p className="mt-2 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {alert.subject_label}
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                            {alert.subject_type === 'Book' ? (
                                                <Book className="h-3.5 w-3.5 text-amber-500" />
                                            ) : (
                                                <BookOpenCheck className="h-3.5 w-3.5 text-indigo-500" />
                                            )}
                                            {subjectTypeLabel(alert.subject_type)} ដោយ {alert.causer_name}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                            {normalizeChangesText(alert.changes)}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-500 hover:bg-white hover:text-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                                        onClick={() => dismissAlert(alert.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </section>
                        );
                    })}
                </div>
                <div className="border-t border-cyan-100 px-3 py-2 dark:border-cyan-900">
                    <Button asChild variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/40">
                        <Link href={route('logs.index')}>បើកទំព័រកំណត់ហេតុសកម្មភាព</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
