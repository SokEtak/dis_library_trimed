import Toast from '@/components/Toast';
import { Button } from '@/components/ui/button';
import echo from '@/lib/echo';
import { router, usePage } from '@inertiajs/react';
import { el } from 'date-fns/locale';
import { BellRing } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

interface SharedData {
    auth: {
        user: {
            id: number;
            roles?: string[];
        } | null;
    };
    adminLoanRequests?: LoanRequest[];
}

export default function AdminLoanRequestAlerts() {
    const page = usePage<SharedData>();
    const { auth, adminLoanRequests = [] } = page.props;
    const isAdmin = auth.user?.roles?.includes('admin') ?? false;

    const [pendingLoanRequests, setPendingLoanRequests] = useState<LoanRequest[]>(adminLoanRequests || []);
    const [decisionProcessingRequestId, setDecisionProcessingRequestId] = useState<number | null>(null);
    const [highlightedRequestIds, setHighlightedRequestIds] = useState<number[]>([]);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
    });
    const lastLocallyDecidedRequestIdRef = useRef<number | null>(null);

    useEffect(() => {
        setPendingLoanRequests(adminLoanRequests || []);
    }, [adminLoanRequests]);

    const hasRequestYoungerThanOneMinute = pendingLoanRequests.some((requestItem) => {
        if (!requestItem.created_at) {
            return false;
        }

        const createdAtMs = new Date(requestItem.created_at).getTime();

        if (Number.isNaN(createdAtMs)) {
            return false;
        }

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

        const createdAtMs = new Date(createdAt).getTime();

        if (Number.isNaN(createdAtMs)) {
            return 'កំហុស';
        }

        const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));

        if (elapsedSeconds < 10) {
            return 'អំបាញ់មិញ';
        }

        if (elapsedSeconds < 60) {
            return `${elapsedSeconds}  វិនាទីមុន`;
        }

        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        if (elapsedMinutes < 60) {
            return `${elapsedMinutes}  នាទីមុន`;
        }

        const elapsedHours = Math.floor(elapsedMinutes / 60);

        if (elapsedHours < 24) {
            return `${elapsedHours}  ម៉ោងមុន`;
        }

        const elapsedDays = Math.floor(elapsedHours / 24);

        return `${elapsedDays} ថ្ងៃមុន`;
    };

    const markRequestHighlighted = (requestId: number) => {
        setHighlightedRequestIds((currentIds) => (currentIds.includes(requestId) ? currentIds : [...currentIds, requestId]));

        window.setTimeout(() => {
            setHighlightedRequestIds((currentIds) => currentIds.filter((id) => id !== requestId));
        }, 2400);
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

            if (lastLocallyDecidedRequestIdRef.current === event.loanRequest.id) {
                lastLocallyDecidedRequestIdRef.current = null;
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
                        ? `${event.loanRequest.requester_name || 'User'} canceled the request.`
                        : `${event.loanRequest.requester_name || 'User'} request rejected.`,
                    type: event.loanRequest.canceled_by_requester ? 'info' : 'error',
                });
            }

            setPendingLoanRequests((currentRequests) =>
                currentRequests.filter((requestItem) => requestItem.id !== event.loanRequest?.id),
            );
        };

        channel.listen('.book-loan-request.created', handleCreatedEvent);
        channel.listen('.book-loan-request.updated', handleUpdatedEvent);

        return () => {
            channel.stopListening('.book-loan-request.created');
            channel.stopListening('.book-loan-request.updated');
            echoInstance.leave(adminChannelName);
        };
    }, [isAdmin]);

    const handleLoanRequestDecision = async (loanRequest: LoanRequest, decision: 'approved' | 'rejected') => {
        if (decisionProcessingRequestId !== null) {
            return;
        }

        lastLocallyDecidedRequestIdRef.current = loanRequest.id;
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
                body: JSON.stringify({ decision }),
            });

            const data = (await response.json()) as { message?: string };

            if (!response.ok) {
                throw new Error(data.message || 'Unable to update the request.');
            }

            setToast({
                show: true,
                message: data.message || (decision === 'approved' ? 'Request approved.' : 'Request rejected.'),
                type: decision === 'approved' ? 'success' : 'error',
            });

            setPendingLoanRequests((currentRequests) => currentRequests.filter((requestItem) => requestItem.id !== loanRequest.id));

            router.reload({
                only: ['adminLoanRequests', 'bookloans', 'loanRequests'],
                preserveScroll: true,
                preserveState: true,
            });
        } catch (error) {
            lastLocallyDecidedRequestIdRef.current = null;

            setToast({
                show: true,
                message: error instanceof Error ? error.message : 'Unable to update the request.',
                type: 'error',
            });
        } finally {
            setDecisionProcessingRequestId(null);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((current) => ({ ...current, show: false }))}
            />
            {pendingLoanRequests.length > 0 && (
                <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
                    {pendingLoanRequests.map((requestItem) => {
                        const isProcessing = decisionProcessingRequestId === requestItem.id;
                        const isHighlighted = highlightedRequestIds.includes(requestItem.id);

                        return (
                            <div
                                key={requestItem.id}
                                className={`pointer-events-auto rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 dark:bg-gray-900/95 ${
                                    isHighlighted
                                        ? 'border-amber-300 ring-2 ring-amber-300/70 dark:border-amber-500 dark:ring-amber-500/70'
                                        : 'border-indigo-200 dark:border-indigo-700'
                                }`}
                                style={{
                                    animation: isHighlighted
                                        ? 'loan-request-card-in 320ms cubic-bezier(0.22, 1, 0.36, 1), loan-request-card-highlight 1.2s ease-in-out 2'
                                        : 'loan-request-card-in 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                            >
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                                    <BellRing className={`h-4 w-4 ${isHighlighted ? 'animate-pulse text-amber-500 dark:text-amber-400' : ''}`} />
                                    សំណើសុំខ្ចីសៀវភៅ
                                    <span className="ml-auto normal-case font-medium tracking-normal text-[11px] text-gray-500 dark:text-gray-300">
                                        {formatRelativeAge(requestItem.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                                        {requestItem.requester_name || 'A user'}
                                    </span>{' '}
                                    បានដាក់សំណើដើម្បីខ្ចីសៀវភៅ{' '}
                                    <span className="font-semibold text-amber-600 dark:text-amber-300">
                                        {requestItem.book_title || 'this book'}
                                    </span>
                                </p>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-white text-indigo-600 hover:bg-indigo-50 dark:bg-gray-700 dark:text-indigo-300 dark:hover:bg-indigo-800"
                                        onClick={() => handleLoanRequestDecision(requestItem, 'rejected')}
                                        disabled={decisionProcessingRequestId !== null}
                                    >
                                        {isProcessing ? 'កំពុងបដិសេធ...' : 'បដិសេធ'}
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                                        onClick={() => handleLoanRequestDecision(requestItem, 'approved')}
                                        disabled={decisionProcessingRequestId !== null}
                                    >
                                        {isProcessing ? 'កំពុងដំណើរការ...' : 'អនុម័ត'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{`
                @keyframes loan-request-card-in {
                    0% {
                        opacity: 0;
                        transform: translate3d(24px, -10px, 0) scale(0.96);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }
                @keyframes loan-request-card-highlight {
                    0%, 100% {
                        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
                    }
                    50% {
                        box-shadow: 0 14px 30px rgba(245, 158, 11, 0.36);
                    }
                }
            `}</style>
        </>
    );
}
