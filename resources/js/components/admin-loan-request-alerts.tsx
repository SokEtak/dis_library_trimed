import Toast from '@/components/Toast';
import { Button } from '@/components/ui/button';
import echo from '@/lib/echo';
import { router, usePage } from '@inertiajs/react';
import { BellRing } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LoanRequest {
    id: number;
    book_id: number;
    book_title: string | null;
    requester_id: number;
    requester_name: string | null;
    status: 'pending' | 'approved' | 'rejected';
    canceled_by_requester?: boolean;
    created_at: string | null;
}

interface LoanRequestGroup {
    requester_id: number;
    requester_name: string | null;
    requests: LoanRequest[];
    latest_created_at: string | null;
}

interface SharedData {
    auth: {
        user: {
            id: number;
            roles?: string[];
        } | null;
    };
    adminLoanRequests?: LoanRequest[];
    [key: string]: unknown;
}

const parseTimestamp = (dateValue: string | null): number => {
    if (!dateValue) {
        return 0;
    }

    const parsed = new Date(dateValue).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

export default function AdminLoanRequestAlerts() {
    const page = usePage<SharedData>();
    const { auth, adminLoanRequests = [] } = page.props;
    const isAdmin = auth.user?.roles?.includes('admin') ?? false;

    const [pendingLoanRequests, setPendingLoanRequests] = useState<LoanRequest[]>(adminLoanRequests || []);
    const [decisionProcessingRequestId, setDecisionProcessingRequestId] = useState<number | null>(null);
    const [batchProcessingState, setBatchProcessingState] = useState<{
        requester_id: number;
        action: 'loan' | 'reject';
    } | null>(null);
    const [highlightedRequestIds, setHighlightedRequestIds] = useState<number[]>([]);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
    });
    const locallyProcessedRequestIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        setPendingLoanRequests(adminLoanRequests || []);
    }, [adminLoanRequests]);

    const groupedPendingLoanRequests = useMemo<LoanRequestGroup[]>(() => {
        const grouped = new Map<number, LoanRequestGroup>();

        for (const requestItem of pendingLoanRequests) {
            const requesterId = requestItem.requester_id;
            const existingGroup = grouped.get(requesterId);

            if (existingGroup) {
                existingGroup.requests.push(requestItem);

                if (parseTimestamp(requestItem.created_at) > parseTimestamp(existingGroup.latest_created_at)) {
                    existingGroup.latest_created_at = requestItem.created_at;
                }
            } else {
                grouped.set(requesterId, {
                    requester_id: requesterId,
                    requester_name: requestItem.requester_name,
                    requests: [requestItem],
                    latest_created_at: requestItem.created_at,
                });
            }
        }

        const groups = Array.from(grouped.values());

        groups.forEach((group) => {
            group.requests.sort((a, b) => parseTimestamp(b.created_at) - parseTimestamp(a.created_at));
        });

        groups.sort((a, b) => parseTimestamp(b.latest_created_at) - parseTimestamp(a.latest_created_at));

        return groups;
    }, [pendingLoanRequests]);

    const hasRequestYoungerThanOneMinute = pendingLoanRequests.some((requestItem) => {
        if (!requestItem.created_at) {
            return false;
        }

        const createdAtMs = parseTimestamp(requestItem.created_at);
        return Math.max(0, nowMs - createdAtMs) < 60_000;
    });

    useEffect(() => {
        if (pendingLoanRequests.length === 0) {
            return;
        }

        const refreshIntervalMs = hasRequestYoungerThanOneMinute ? 1_000 : 60_000;
        const intervalId = window.setInterval(() => {
            setNowMs(Date.now());
        }, refreshIntervalMs);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [pendingLoanRequests, hasRequestYoungerThanOneMinute]);

    const formatRelativeAge = (createdAt: string | null) => {
        if (!createdAt) {
            return 'មិនមាន';
        }

        const createdAtMs = parseTimestamp(createdAt);

        if (!createdAtMs) {
            return 'កំហុស';
        }

        const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));

        if (elapsedSeconds < 10) {
            return 'អំបាញ់មិញ';
        }

        if (elapsedSeconds < 60) {
            return `${elapsedSeconds} វិនាទីមុន`;
        }

        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        if (elapsedMinutes < 60) {
            return `${elapsedMinutes} នាទីមុន`;
        }

        const elapsedHours = Math.floor(elapsedMinutes / 60);

        if (elapsedHours < 24) {
            return `${elapsedHours} ម៉ោងមុន`;
        }

        const elapsedDays = Math.floor(elapsedHours / 24);

        return `${elapsedDays} ថ្ងៃមុន`;
    };

    const markRequestHighlighted = (requestId: number) => {
        setHighlightedRequestIds((currentIds) => (currentIds.includes(requestId) ? currentIds : [...currentIds, requestId]));

        window.setTimeout(() => {
            setHighlightedRequestIds((currentIds) => currentIds.filter((id) => id !== requestId));
        }, 2200);
    };

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        const echoInstance = echo;
        if (!echoInstance) {
            return;
        }

        const adminChannelName = 'admin.book-loan-requests';
        const channel = echoInstance.private(adminChannelName);

        const handleCreatedEvent = (event: { loanRequest?: LoanRequest }) => {
            if (!event.loanRequest) {
                return;
            }

            setPendingLoanRequests((currentRequests) => {
                if (currentRequests.some((requestItem) => requestItem.id === event.loanRequest?.id)) {
                    return currentRequests;
                }

                return [event.loanRequest as LoanRequest, ...currentRequests];
            });

            markRequestHighlighted(event.loanRequest.id);
        };

        const handleUpdatedEvent = (event: { loanRequest?: LoanRequest }) => {
            if (!event.loanRequest?.id) {
                return;
            }

            const requestId = event.loanRequest.id;
            const locallyProcessedRequestIds = locallyProcessedRequestIdsRef.current;
            const wasLocallyProcessed = locallyProcessedRequestIds.has(requestId);

            if (wasLocallyProcessed) {
                locallyProcessedRequestIds.delete(requestId);
            } else if (event.loanRequest.status === 'approved') {
                setToast({
                    show: true,
                    message: `${event.loanRequest.requester_name || 'User'} request approved.`,
                    type: 'success',
                });
            } else if (event.loanRequest.status === 'rejected') {
                setToast({
                    show: true,
                    message: event.loanRequest.canceled_by_requester
                        ? `${event.loanRequest.requester_name || 'User'} បានបោះបង់សំណើរ`
                        : `${event.loanRequest.requester_name || 'User'} request rejected.`,
                    type: event.loanRequest.canceled_by_requester ? 'info' : 'error',
                });
            }

            setPendingLoanRequests((currentRequests) => currentRequests.filter((requestItem) => requestItem.id !== requestId));
        };

        channel.listen('.book-loan-request.created', handleCreatedEvent);
        channel.listen('.book-loan-request.updated', handleUpdatedEvent);

        return () => {
            channel.stopListening('.book-loan-request.created');
            channel.stopListening('.book-loan-request.updated');
            echoInstance.leave(adminChannelName);
        };
    }, [isAdmin]);

    const handleRejectRequest = async (loanRequest: LoanRequest) => {
        if (decisionProcessingRequestId !== null || batchProcessingState !== null) {
            return;
        }

        locallyProcessedRequestIdsRef.current.add(loanRequest.id);
        setDecisionProcessingRequestId(loanRequest.id);

        try {
            const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute('content') ?? '';

            const response = await fetch(route('bookloans.requests.decide', loanRequest.id), {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
                body: JSON.stringify({ decision: 'rejected' }),
            });

            const data = (await response.json()) as { message?: string };

            if (!response.ok) {
                throw new Error(data.message || 'Unable to reject this request.');
            }

            setToast({
                show: true,
                message: data.message || 'Request rejected.',
                type: 'error',
            });

            setPendingLoanRequests((currentRequests) => currentRequests.filter((requestItem) => requestItem.id !== loanRequest.id));

            router.reload({
                only: ['adminLoanRequests', 'bookloans', 'loanRequests'],
            });
        } catch (error) {
            locallyProcessedRequestIdsRef.current.delete(loanRequest.id);

            setToast({
                show: true,
                message: error instanceof Error ? error.message : 'Unable to reject this request.',
                type: 'error',
            });
        } finally {
            setDecisionProcessingRequestId(null);
        }
    };

    const handleCreateBatchLoan = async (group: LoanRequestGroup) => {
        if (batchProcessingState !== null || decisionProcessingRequestId !== null) {
            return;
        }

        const requestIds = group.requests.map((requestItem) => requestItem.id);
        const requestIdSet = new Set(requestIds);

        requestIds.forEach((requestId) => locallyProcessedRequestIdsRef.current.add(requestId));
        setBatchProcessingState({
            requester_id: group.requester_id,
            action: 'loan',
        });

        try {
            const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute('content') ?? '';

            const response = await fetch(route('bookloans.requests.batch-loan'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
                body: JSON.stringify({ request_ids: requestIds }),
            });

            const data = (await response.json()) as { message?: string };

            if (!response.ok) {
                throw new Error(data.message || 'Unable to create the batch loan.');
            }

            setToast({
                show: true,
                message: data.message || 'Batch loan created.',
                type: 'success',
            });

            setPendingLoanRequests((currentRequests) =>
                currentRequests.filter((requestItem) => !requestIdSet.has(requestItem.id)),
            );

            router.reload({
                only: ['adminLoanRequests', 'bookloans', 'loanRequests'],
            });
        } catch (error) {
            requestIds.forEach((requestId) => locallyProcessedRequestIdsRef.current.delete(requestId));

            setToast({
                show: true,
                message: error instanceof Error ? error.message : 'Unable to create the batch loan.',
                type: 'error',
            });
        } finally {
            setBatchProcessingState(null);
        }
    };

    const handleBatchRejectRequests = async (group: LoanRequestGroup) => {
        if (batchProcessingState !== null || decisionProcessingRequestId !== null) {
            return;
        }

        const requestIds = group.requests.map((requestItem) => requestItem.id);
        const requestIdSet = new Set(requestIds);

        requestIds.forEach((requestId) => locallyProcessedRequestIdsRef.current.add(requestId));
        setBatchProcessingState({
            requester_id: group.requester_id,
            action: 'reject',
        });

        try {
            const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute('content') ?? '';

            const response = await fetch(route('bookloans.requests.batch-reject'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
                body: JSON.stringify({ request_ids: requestIds }),
            });

            const data = (await response.json()) as { message?: string };

            if (!response.ok) {
                throw new Error(data.message || 'Unable to batch reject requests.');
            }

            setToast({
                show: true,
                message: data.message || 'Batch rejection completed.',
                type: 'info',
            });

            setPendingLoanRequests((currentRequests) =>
                currentRequests.filter((requestItem) => !requestIdSet.has(requestItem.id)),
            );

            router.reload({
                only: ['adminLoanRequests', 'bookloans', 'loanRequests'],
            });
        } catch (error) {
            requestIds.forEach((requestId) => locallyProcessedRequestIdsRef.current.delete(requestId));

            setToast({
                show: true,
                message: error instanceof Error ? error.message : 'Unable to batch reject requests.',
                type: 'error',
            });
        } finally {
            setBatchProcessingState(null);
        }
    };

    if (!isAdmin) {
        return null;
    }

    const isAnyActionProcessing = decisionProcessingRequestId !== null || batchProcessingState !== null;

    return (
        <>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((current) => ({ ...current, show: false }))}
            />
            {groupedPendingLoanRequests.length > 0 && (
                <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(96vw,34rem)] flex-col gap-3">
                    <div className="pointer-events-auto overflow-hidden rounded-2xl border border-indigo-200 bg-white/95 shadow-2xl backdrop-blur dark:border-indigo-700 dark:bg-gray-900/95">
                        <div className="flex items-center gap-2 border-b border-indigo-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:border-indigo-800 dark:text-indigo-300">
                            <BellRing className="h-4 w-4" />
                            សំណើសុំខ្ចីសៀវភៅ
                            <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] normal-case text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-200">
                                {pendingLoanRequests.length} សំណើ
                            </span>
                        </div>
                        <div className="max-h-[calc(100vh-8rem)] space-y-3 overflow-y-auto p-3">
                            {groupedPendingLoanRequests.map((group) => {
                                const groupIsHighlighted = group.requests.some((requestItem) =>
                                    highlightedRequestIds.includes(requestItem.id),
                                );
                                const isProcessingThisGroup = batchProcessingState?.requester_id === group.requester_id;
                                const isBatchLoanProcessing = isProcessingThisGroup && batchProcessingState?.action === 'loan';
                                const isBatchRejectProcessing = isProcessingThisGroup && batchProcessingState?.action === 'reject';

                                return (
                                    <section
                                        key={group.requester_id}
                                        className={`rounded-xl border p-3 transition ${
                                            groupIsHighlighted
                                                ? 'border-amber-300 bg-amber-50/70 ring-2 ring-amber-200 dark:border-amber-500 dark:bg-amber-950/30 dark:ring-amber-500/40'
                                                : 'border-indigo-100 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/20'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-indigo-700 dark:text-indigo-200">
                                                    {group.requester_name || 'A user'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                                    {group.requests.length} សៀវភៅបានស្នើ
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-gray-500 dark:text-gray-300">
                                                {formatRelativeAge(group.latest_created_at)}
                                            </span>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                            {group.requests.map((requestItem) => {
                                                const isRejectProcessing = decisionProcessingRequestId === requestItem.id;

                                                return (
                                                    <div
                                                        key={requestItem.id}
                                                        className="flex items-center justify-between gap-2 rounded-lg border border-white/80 bg-white/85 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-800/80"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm text-gray-800 dark:text-gray-100">
                                                                {requestItem.book_title || 'Untitled book'}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-300">
                                                                {formatRelativeAge(requestItem.created_at)}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-8 shrink-0 border-rose-200 bg-white px-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:bg-gray-700 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                                            onClick={() => handleRejectRequest(requestItem)}
                                                            disabled={isAnyActionProcessing}
                                                        >
                                                            {isRejectProcessing ? 'កំពុងបដិសេធ...' : 'បដិសេធ'}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-3 flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:bg-gray-700 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                                onClick={() => handleBatchRejectRequests(group)}
                                                disabled={isAnyActionProcessing}
                                            >
                                                {isBatchRejectProcessing
                                                    ? 'កំពុងបដិសេធទាំងអស់...'
                                                    : `បដិសេធទាំងអស់ (${group.requests.length})`}
                                            </Button>
                                            <Button
                                                type="button"
                                                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                                                onClick={() => handleCreateBatchLoan(group)}
                                                disabled={isAnyActionProcessing}
                                            >
                                                {isBatchLoanProcessing
                                                    ? 'កំពុងបង្កើតការខ្ចី...'
                                                    : `បង្កើតការខ្ចី (${group.requests.length})`}
                                            </Button>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
