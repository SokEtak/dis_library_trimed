"use client";

import DataTable from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import echo from "@/lib/echo";
import { router } from "@inertiajs/react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Book, BookOpenCheck, Radio, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ActivityLogRow {
    id: number;
    log_name: string;
    event: string;
    description: string;
    subject_type: "Book" | "Loan";
    subject_id: number | null;
    subject_label: string;
    causer_name: string;
    causer_email?: string | null;
    changes: string;
    campus_name: string | null;
    created_at: string | null;
}

interface FlashProps {
    message?: string;
    error?: string;
    type?: "success" | "error";
}

interface LogsIndexProps {
    logs: ActivityLogRow[];
    flash?: FlashProps;
}

interface ActivityLogBroadcastPayload {
    activityId?: number;
    source?: string;
    updatedAt?: string;
}

const resolveFlash = (flash?: FlashProps) => {
    if (flash?.type && flash.message) return { message: flash.message, type: flash.type };
    if (flash?.error) return { message: flash.error, type: "error" as const };
    if (flash?.message) return { message: flash.message, type: "success" as const };

    return undefined;
};

const eventBadgeClass = (event: string) => {
    const normalized = event.toLowerCase();

    if (normalized === "created") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
    if (normalized === "updated") return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";
    if (normalized === "deleted") return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200";
    if (normalized === "restored") return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200";

    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
};

const subjectBadgeClass = (subjectType: ActivityLogRow["subject_type"]) =>
    subjectType === "Book"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200";

const sortHeader = (label: string) => ({ column }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => (
    <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-indigo-600 dark:text-indigo-300"
    >
        {label}
        {{
            asc: <ArrowUp className="ml-2 h-4 w-4" />,
            desc: <ArrowDown className="ml-2 h-4 w-4" />,
        }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
    </Button>
);

const formatRelativeTime = (value: string | null): string => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);

    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const getColumns = (): ColumnDef<ActivityLogRow>[] => [
    {
        accessorKey: "id",
        header: sortHeader("ID"),
        cell: ({ row }) => <span className="px-3 text-sm font-semibold text-indigo-600 dark:text-indigo-300">#{row.original.id}</span>,
    },
    {
        accessorKey: "log_name",
        header: sortHeader("Log"),
        cell: ({ row }) => (
            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {row.original.log_name || "default"}
            </Badge>
        ),
    },
    {
        accessorKey: "event",
        header: sortHeader("Event"),
        cell: ({ row }) => (
            <Badge className={eventBadgeClass(row.original.event)}>
                {row.original.event}
            </Badge>
        ),
    },
    {
        id: "subject",
        accessorFn: (row) => `${row.subject_type} ${row.subject_label}`,
        header: sortHeader("Subject"),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Badge className={subjectBadgeClass(row.original.subject_type)}>
                    {row.original.subject_type}
                </Badge>
                <span className="text-sm">{row.original.subject_label}</span>
                {row.original.subject_type === "Book" ? (
                    <Book className="h-4 w-4 text-amber-500" />
                ) : (
                    <BookOpenCheck className="h-4 w-4 text-indigo-500" />
                )}
            </div>
        ),
    },
    {
        id: "causer",
        accessorFn: (row) => `${row.causer_name} ${row.causer_email ?? ""}`,
        header: sortHeader("Causer"),
        cell: ({ row }) => (
            <div className="px-1">
                <p className="text-sm font-medium">{row.original.causer_name}</p>
                <p className="text-xs text-muted-foreground">{row.original.causer_email ?? "System action"}</p>
            </div>
        ),
    },
    {
        accessorKey: "changes",
        header: sortHeader("Changed Fields"),
        cell: ({ row }) => (
            <span className="inline-flex max-w-[18rem] truncate rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                {row.original.changes}
            </span>
        ),
    },
    {
        accessorKey: "campus_name",
        header: sortHeader("Campus"),
        cell: ({ row }) => (
            <span className="text-sm">
                {row.original.campus_name ?? "N/A"}
            </span>
        ),
    },
    {
        accessorKey: "created_at",
        header: sortHeader("Logged At"),
        cell: ({ row }) => (
            <div className="space-y-0.5">
                <p className="text-sm">{row.original.created_at ? new Date(row.original.created_at).toLocaleString() : "N/A"}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(row.original.created_at)}</p>
            </div>
        ),
    },
];

export default function LogsIndex({ logs, flash }: LogsIndexProps) {
    const rows = useMemo(() => logs ?? [], [logs]);
    const flashState = resolveFlash(flash);
    const columns = useMemo(() => getColumns(), []);
    const breadcrumbs = [{ title: "Activity Logs", href: route("logs.index") }];

    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(rows[0]?.created_at ?? null);
    const reloadTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!rows.length) return;

        setLastSyncedAt(rows[0].created_at);
    }, [rows]);

    useEffect(() => {
        const echoInstance = echo;
        if (!echoInstance) {
            return;
        }

        const channelName = "activity.logs";
        const eventName = ".activity.logs.updated";
        const channel = echoInstance.private(channelName);
        setIsLiveConnected(true);

        const handleLiveUpdate = () => {
            if (reloadTimerRef.current !== null) {
                return;
            }

            setIsSyncing(true);
            reloadTimerRef.current = window.setTimeout(() => {
                reloadTimerRef.current = null;

                router.reload({
                    only: ["logs", "flash"],
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => {
                        setIsSyncing(false);
                        setLastSyncedAt(new Date().toISOString());
                    },
                });
            }, 250);
        };

        channel.listen(eventName, handleLiveUpdate as (payload: ActivityLogBroadcastPayload) => void);

        return () => {
            if (reloadTimerRef.current !== null) {
                window.clearTimeout(reloadTimerRef.current);
                reloadTimerRef.current = null;
            }

            channel.stopListening(eventName);
            echoInstance.leave(channelName);
            setIsLiveConnected(false);
            setIsSyncing(false);
        };
    }, []);

    const globalFilterFn = (row: Row<ActivityLogRow>, _columnId: string, filter: string) => {
        const search = String(filter).toLowerCase().trim();
        if (!search) return true;

        const item = row.original;

        return [
            String(item.id),
            item.log_name,
            item.event,
            item.description,
            item.subject_type,
            item.subject_label,
            item.causer_name,
            item.causer_email ?? "",
            item.changes,
            item.campus_name ?? "",
            item.created_at ?? "",
        ].some((value) => value.toLowerCase().includes(search));
    };

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, row) => {
                if (row.subject_type === "Book") {
                    acc.books += 1;
                } else {
                    acc.loans += 1;
                }

                const event = row.event.toLowerCase();
                if (event === "created") acc.created += 1;
                if (event === "updated") acc.updated += 1;
                if (event === "deleted") acc.deleted += 1;

                return acc;
            },
            { books: 0, loans: 0, created: 0, updated: 0, deleted: 0 },
        );
    }, [rows]);

    const topContent = (
        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-5 shadow-lg dark:border-indigo-900/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-500/10" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/10" />

            <div className="relative flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Realtime Audit Trail</p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Activity Logs</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Track Book and Loan changes with automatic live refresh.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            className={
                                isLiveConnected
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-200"
                                    : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            }
                        >
                            <Radio className={`mr-1.5 h-3.5 w-3.5 ${isLiveConnected ? "animate-pulse" : ""}`} />
                            {isLiveConnected ? "Live Connected" : "Live Unavailable"}
                        </Badge>
                        {isSyncing && (
                            <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">
                                <RefreshCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Syncing
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Logs</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{rows.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Book Logs</p>
                        <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">{totals.books}</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Loan Logs</p>
                        <p className="mt-1 text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{totals.loans}</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">{totals.created}</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Updated</p>
                        <p className="mt-1 text-2xl font-semibold text-sky-600 dark:text-sky-300">{totals.updated}</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Deleted</p>
                        <p className="mt-1 text-2xl font-semibold text-rose-600 dark:text-rose-300">{totals.deleted}</p>
                    </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "N/A"}
                </p>
            </div>
        </section>
    );

    return (
        <DataTable
            data={rows}
            columns={columns}
            breadcrumbs={breadcrumbs}
            title="Activity Logs"
            resourceName="logs"
            routes={{
                index: route("logs.index"),
                create: route("logs.index"),
                show: (id) => `${route("logs.index")}?view=${id}`,
                edit: (id) => `${route("logs.index")}?edit=${id}`,
            }}
            flash={flashState}
            globalFilterFn={globalFilterFn}
            showCreateButton={false}
            topContent={topContent}
            modalFields={(item) => (
                <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="text-indigo-600 dark:text-indigo-300">Description:</strong> {item.description}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="text-indigo-600 dark:text-indigo-300">Subject:</strong> {item.subject_type} - {item.subject_label}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="text-indigo-600 dark:text-indigo-300">Causer:</strong> {item.causer_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="text-indigo-600 dark:text-indigo-300">Changed Fields:</strong> {item.changes}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="text-indigo-600 dark:text-indigo-300">Campus:</strong> {item.campus_name ?? "N/A"}
                    </p>
                </div>
            )}
        />
    );
}
