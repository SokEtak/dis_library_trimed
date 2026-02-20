import Skeleton from '@/components/Skeleton';
import Toast from '@/components/Toast';
import TopBar from '@/components/TopBar';
import echo from '@/lib/echo';
import { translations } from '@/utils/translations/library/translations';
import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Clipboard, Download, Eye, Facebook, Info, List, Verified } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { pdfjs } from 'react-pdf';

// Set up worker for react-pdf with a hardcoded stable version
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

interface Book {
    id?: number;
    title: string;
    description: string;
    page_count?: number;
    publisher: string;
    language: string;
    published_at: string;
    cover: string;
    pdf_url?: string;
    flip_link?: string;
    view: number;
    is_available: boolean;
    author: string;
    code?: string;
    isbn?: string;
    type?: 'ebook' | 'physical' | string;
    downloadable?: boolean;
    user_id?: number;
    category_id?: number;
    subcategory_id?: number;
    shelf_id?: number;
    subject_id?: number;
    grade_id?: number;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    bookcase_id?: number;
    campus_id?: number;
    program?: string;
    user?: {
        name: string;
        avatar?: string;
        follower: number;
        verified: boolean;
        isVerified?: boolean;
    };
    category?: { name: string };
    subcategory?: { name: string };
    shelf?: { code: string };
    subject?: { name: string };
    grade?: { name: string };
    bookcase?: { code: string };
    campus?: { name: string };
}

interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    isVerified?: boolean;
}

interface LoanRequest {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    approver_id?: number | null;
    canceled_by_requester?: boolean;
    decided_at?: string | null;
}

interface ShowProps {
    book: Book | null;
    lang?: 'en' | 'kh';
    authUser?: AuthUser | null;
    relatedBooks?: Book[];
    canRequestLoan?: boolean;
    loanRequest?: LoanRequest | null;
}

// --- Utility ---
const formatNumber = (number: number): string => {
    if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
    return number.toString();
};

const DetailItem = ({ label, value, index }: { label: string; value: string | number | undefined | null; index: number }) => {
    if (!value || value === 0) return null;
    const isEven = index % 2 === 0;
    return (
        <div
            className={[
                'flex items-center justify-between rounded-lg px-3 py-2 transition-colors sm:px-4 sm:py-3',
                isEven ? 'bg-white/70 dark:bg-gray-900/40' : 'bg-gray-50/80 dark:bg-gray-800/40',
                'border border-white/50 backdrop-blur-sm dark:border-white/10',
            ].join(' ')}
        >
            <strong className="text-xs font-semibold text-gray-600 sm:text-sm dark:text-gray-400">{label}</strong>
            <span className="max-w-[55%] truncate text-right text-sm font-bold text-gray-900 sm:text-base dark:text-gray-100">{value}</span>
        </div>
    );
};

export default function Show({ book, lang = 'en', authUser, relatedBooks = [], canRequestLoan = false, loanRequest = null }: ShowProps) {
    const [language, setLanguage] = useState<'en' | 'kh'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language');
            if (saved === 'en' || saved === 'kh') return saved as 'en' | 'kh';
        }
        return lang as 'en' | 'kh';
    });

    const [activeTab, setActiveTab] = useState<'description' | 'details'>('details');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ show: false, message: '' });
    const [loading, setLoading] = useState(false);
    const [loanRequestStatus, setLoanRequestStatus] = useState<LoanRequest['status'] | null>(loanRequest?.status ?? null);
    const [loanRequestId, setLoanRequestId] = useState<number | null>(loanRequest?.id ?? null);
    const [loanRequestCanceledByRequester, setLoanRequestCanceledByRequester] = useState<boolean>(Boolean(loanRequest?.canceled_by_requester));
    const [requestingLoan, setRequestingLoan] = useState(false);
    const lastNotifiedLoanSignatureRef = useRef<string>(`${loanRequest?.status ?? 'none'}:${loanRequest?.canceled_by_requester ? '1' : '0'}`);
    const lastLocallyUpdatedLoanRequestIdRef = useRef<number | null>(null);
    const currentBookIdRef = useRef<number | undefined>(book?.id);

    // Ref for share button/menu
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);

    // Close popovers on route change (mobile UX polish)
    useEffect(() => {
        const unlisten = router.on('finish', () => setShowShareMenu(false));
        return () => (unlisten as (() => void) | undefined)?.();
    }, []);

    // Click-away to dismiss share menu (desktop/tablet)
    useEffect(() => {
        if (!showShareMenu) return;
        function handleClick(e: MouseEvent) {
            const menu = shareMenuRef.current;
            const button = shareButtonRef.current;
            if (menu && !menu.contains(e.target as Node) && button && !button.contains(e.target as Node)) {
                setShowShareMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showShareMenu]);

    useEffect(() => {
        setLoanRequestStatus(loanRequest?.status ?? null);
        setLoanRequestId(loanRequest?.id ?? null);
        setLoanRequestCanceledByRequester(Boolean(loanRequest?.canceled_by_requester));
    }, [book?.id, loanRequest?.id, loanRequest?.status, loanRequest?.canceled_by_requester]);

    useEffect(() => {
        if (currentBookIdRef.current !== book?.id) {
            currentBookIdRef.current = book?.id;
            lastNotifiedLoanSignatureRef.current = `${loanRequest?.status ?? 'none'}:${loanRequest?.canceled_by_requester ? '1' : '0'}`;
        }
    }, [book?.id, loanRequest?.status, loanRequest?.canceled_by_requester]);

    useEffect(() => {
        const currentSignature = `${loanRequestStatus ?? 'none'}:${loanRequestCanceledByRequester ? '1' : '0'}`;

        if (currentSignature === lastNotifiedLoanSignatureRef.current) {
            return;
        }

        if (loanRequestStatus === 'approved') {
            setToast({
                show: true,
                message: 'Request approved.',
                type: 'success',
            });
        } else if (loanRequestStatus === 'rejected') {
            setToast({
                show: true,
                message: loanRequestCanceledByRequester ? 'សំណើរត្រូវបានបោះបង់' : 'សំណើរត្រូវបានបដិសេធ',
                type: loanRequestCanceledByRequester ? 'info' : 'error',
            });
        }

        lastNotifiedLoanSignatureRef.current = currentSignature;
    }, [loanRequestStatus, loanRequestCanceledByRequester, book?.title]);

    useEffect(() => {
        const echoInstance = echo;
        if (!authUser?.id || !echoInstance) return;

        const channelName = `book-loan-requests.user.${authUser.id}`;
        const channel = echoInstance.private(channelName);

        const handleStatusUpdate = (event: {
            loanRequest?: {
                id?: number;
                book_id?: number;
                status?: LoanRequest['status'];
                canceled_by_requester?: boolean;
            };
        }) => {
            if (!book?.id || event.loanRequest?.book_id !== book.id || !event.loanRequest.status) {
                return;
            }

            if (typeof event.loanRequest.id === 'number' && lastLocallyUpdatedLoanRequestIdRef.current === event.loanRequest.id) {
                lastLocallyUpdatedLoanRequestIdRef.current = null;
                return;
            }

            if (typeof event.loanRequest.id === 'number') {
                setLoanRequestId(event.loanRequest.id);
            }
            setLoanRequestStatus(event.loanRequest.status);
            setLoanRequestCanceledByRequester(Boolean(event.loanRequest.canceled_by_requester));
        };

        channel.listen('.book-loan-request.updated', handleStatusUpdate);

        return () => {
            channel.stopListening('.book-loan-request.updated');
            echoInstance.leave(channelName);
        };
    }, [authUser?.id, book?.id, book?.title]);

    useEffect(() => {
        if (!book?.id) {
            return;
        }

        const intervalId = window.setInterval(() => {
            if (requestingLoan) {
                return;
            }

            router.reload({
                only: ['book', 'loanRequest'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 1500);

        return () => window.clearInterval(intervalId);
    }, [book?.id, requestingLoan]);

    const handleLanguageChange = () => {
        setLanguage(language === 'en' ? 'kh' : 'en');
    };

    const handleShare = (platform: string) => {
        const shareUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(`${book?.title} - ${translations[language].read}/${translations[language].views}.`);
        let url = '';

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                break;
            case 'telegram':
                url = `https://telegram.me/share/url?url=${shareUrl}&text=${shareText}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${shareText}%20${shareUrl}`;
                break;
            case 'copy_link':
            default:
                navigator.clipboard.writeText(window.location.href);
                setToast({
                    show: true,
                    message: translations[language].language === 'en' ? 'URL copied to clipboard!' : 'បានចម្លង URL ទៅកាន់ Clipboard!',
                    type: 'success',
                });
                setShowShareMenu(false);
                return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleLoanRequest = async () => {
        if (!book?.id || requestingLoan) {
            return;
        }

        setRequestingLoan(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const response = await fetch(route('library.loan-requests.store', book.id), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
            });

            const data = (await response.json()) as { message?: string; loanRequest?: LoanRequest | null };

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit loan request.');
            }

            setLoanRequestStatus(data.loanRequest?.status ?? 'pending');
            setLoanRequestId(data.loanRequest?.id ?? null);
            setLoanRequestCanceledByRequester(Boolean(data.loanRequest?.canceled_by_requester));
            setToast({
                show: true,
                message: data.message || 'Loan request submitted.',
                type: 'success',
            });
        } catch (error) {
            setToast({
                show: true,
                message: error instanceof Error ? error.message : 'Failed to submit loan request.',
                type: 'error',
            });
        } finally {
            setRequestingLoan(false);
        }
    };

    const handleCancelLoanRequest = async () => {
        if (!loanRequestId || requestingLoan) {
            return;
        }

        lastLocallyUpdatedLoanRequestIdRef.current = loanRequestId;
        setRequestingLoan(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const response = await fetch(route('library.loan-requests.cancel', loanRequestId), {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
            });

            const data = (await response.json()) as { message?: string; loanRequest?: LoanRequest | null };

            if (!response.ok) {
                throw new Error(data.message || 'Failed to cancel loan request.');
            }

            setLoanRequestStatus(data.loanRequest?.status ?? 'rejected');
            setLoanRequestId(data.loanRequest?.id ?? loanRequestId);
            setLoanRequestCanceledByRequester(Boolean(data.loanRequest?.canceled_by_requester ?? true));
            setToast({
                show: true,
                message: data.message || 'Request canceled',
                type: 'info',
            });
        } catch (error) {
            lastLocallyUpdatedLoanRequestIdRef.current = null;
            setToast({
                show: true,
                message: error instanceof Error ? error.message : 'Failed to cancel loan request.',
                type: 'error',
            });
        } finally {
            setRequestingLoan(false);
        }
    };

    const handleDownload = async () => {
        if (!book?.pdf_url || !book.downloadable) {
            setToast({
                show: true,
                message: translations[language].no_pdf_available,
                type: 'error',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(book.pdf_url, {
                method: 'GET',
                credentials: 'include', // safe for auth cookies (Laravel / Sanctum)
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${book.title || 'book'}.pdf`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(blobUrl);

            setToast({
                show: true,
                message: translations[language].download_started ?? 'Download started',
                type: 'info',
            });
        } catch (error) {
            console.error(error);
            setToast({
                show: true,
                message:
                    translations[language].language === 'en'
                        ? 'Failed to download file.'
                        : 'ការទាញយកបរាជ័យ។',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };


    if (!book) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-3 dark:bg-gray-900">
                <div className="w-full max-w-md space-y-3 text-center">
                    <Skeleton className="mx-auto h-8 w-64" />
                    <p className="text-lg font-semibold tracking-tight text-red-600 sm:text-xl dark:text-red-400">
                        {translations[language].book_not_found}
                    </p>
                </div>
            </div>
        );
    }

    const canShowLoanRequestButton = canRequestLoan && book.type === 'physical';
    const isPendingLoanRequest = loanRequestStatus === 'pending';
    const loanRequestLabel =
        isPendingLoanRequest
            ? 'បោះបង់សំណើរ'
            : loanRequestStatus === 'approved'
              ? 'សំណើរត្រូវបានអនុម័ត'
              : 'ដាក់សំណើរ';
    const shouldDisableLoanRequestButton =
        requestingLoan || (isPendingLoanRequest ? false : loanRequestStatus === 'approved' || !book.is_available);

    const renderContributorSection = () => {
        if (!book.user) return null;
        return (
            <div className="group flex items-center gap-3 rounded-full p-2 transition-colors hover:bg-gray-100/70 sm:p-3 dark:hover:bg-gray-800/70">
                <img
                    src={book.user.avatar ? book.user.avatar : 'https://via.placeholder.com/40'}
                    alt={book.user.name}
                    className="h-9 w-9 rounded-full border-2 border-amber-500 object-fit shadow-sm sm:h-10 sm:w-10"
                />
                <div className="min-w-0">
                    <p className="flex items-center truncate text-base font-semibold text-gray-900 sm:text-lg dark:text-gray-100">
                        <span className="truncate">{book.user.name}</span>
                        {(book.user.isVerified || book.user.verified) && (
                            <Verified className="ml-2 h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
                        )}
                    </p>
                    <p className="text-[11px] text-gray-500 sm:text-xs dark:text-gray-400"></p>
                </div>
            </div>
        );
    };

    const renderDetailsContent = () => {
        let index = 0;

        return (
            <div className="space-y-6 sm:space-y-8">
                {/* CORE INFORMATION */}
                <section className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60">
                    <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{translations[language].general_information}</h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailItem label={translations[language].by} value={book.author || translations[language].unknown} index={index++} />
                        <DetailItem
                            label={translations[language].publisher}
                            value={book.publisher || translations[language].unknown}
                            index={index++}
                        />
                        <DetailItem
                            label={translations[language].published_year}
                            value={book.published_at || translations[language].unknown}
                            index={index++}
                        />
                        <DetailItem label={translations[language].language} value={book.language || translations[language].unknown} index={index++} />
                        <DetailItem
                            label={translations[language].type}
                            value={book.type === 'ebook' ? translations[language].bookType.ebook : translations[language].bookType.physical}
                            index={index++}
                        />
                    </div>
                </section>

                {/* CLASSIFICATION */}
                <section className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60">
                    {/* <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{translations[language].classification || "ការចាត់ថ្នាក់"}</h4> */}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailItem label={translations[language].category} value={book.category?.name} index={index++} />
                        <DetailItem label={translations[language].subcategory} value={book.subcategory?.name} index={index++} /> 
                        <DetailItem label={translations[language].subject} value={book.subject?.name} index={index++} />
                        <DetailItem label={translations[language].grade} value={book.grade?.name} index={index++} />
                    </div>
                </section>

                {/* CONTEXT-AWARE DETAILS */}
                {book.type === 'ebook' && (
                    <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
                        <h4 className="mb-4 text-sm font-semibold text-blue-700 dark:text-blue-300">{translations[language].ebook_details}</h4>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <DetailItem label={translations[language].page_count} value={book.page_count} index={index++} />
                            <DetailItem label={translations[language].isbn} value={book.isbn} index={index++} />
                            <DetailItem label={translations[language].code} value={book.code} index={index++} />
                        </div>
                    </section>
                )}

                {book.type === 'physical' && (
                    <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20">
                        <h4 className="mb-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {translations[language].physical_details}
                        </h4>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* <DetailItem label={translations[language].campus} value={book.campus?.name} index={index++} /> */}
                            <DetailItem label={translations[language].program} value={book.program} index={index++} />
                            <DetailItem label={translations[language].bookcase} value={book.bookcase?.code} index={index++} />
                            <DetailItem label={translations[language].shelf} value={book.shelf?.code} index={index++} />
                            <DetailItem label={translations[language].isbn} value={book.isbn} index={index++} />
                            <DetailItem label={translations[language].code} value={book.code} index={index++} />
                        </div>
                    </section>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title={book.title} />
            <div className="relative min-h-screen bg-[#F6F9FC] text-[#0f1115] transition-colors duration-300 dark:bg-[#0b0d12] dark:text-[#EDEDEC]">
                {/* Toast */}
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast((current) => ({ ...current, show: false }))}
                />

                {/* Ambient background - keep but lighten on mobile for perf */}
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                    <div
                        className="absolute inset-0 opacity-20 mix-blend-soft-light sm:opacity-30 dark:opacity-15"
                        style={{
                            backgroundImage:
                                'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%271%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.02%27/%3E%3C/svg%3E")',
                        }}
                    />
                    <div
                        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-[0.18] sm:opacity-[0.22]"
                        style={{
                            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                            backgroundSize: '22px 22px',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div
                        className="absolute inset-0 hidden [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-[0.14] dark:block"
                        style={{
                            backgroundImage: 'linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)',
                            backgroundSize: '22px 22px',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div className="absolute inset-0 -z-10">
                        <div className="mx-auto h-[22rem] w-[22rem] -translate-y-6 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(59,130,246,0.16)_0deg,rgba(16,185,129,0.14)_120deg,rgba(168,85,247,0.12)_240deg,rgba(59,130,246,0.16)_360deg)] blur-2xl sm:h-[32rem] sm:w-[32rem] sm:translate-y-[-12%] sm:blur-3xl dark:blur-[70px] sm:dark:blur-[90px]" />
                    </div>
                </div>

                <TopBar authUser={authUser} language={language} onLanguageChange={handleLanguageChange} />

                {/* Main container: narrower paddings on small */}
                <main className="flex justify-center px-3 py-6 sm:px-6 sm:py-10">
                    <div className="w-full max-w-7xl space-y-6 sm:space-y-10">
                        {/* Title + Utility */}
                        <header className="space-y-3 sm:space-y-4">
                            <h1 className="text-2xl leading-tight font-extrabold tracking-tight break-words text-gray-900 drop-shadow-[0_2px_20px_rgba(59,130,246,.18)] sm:text-4xl sm:leading-tight dark:text-gray-100">
                                {book.title}
                            </h1>

                            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/70 bg-white/70 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_20px_46px_-20px_rgba(2,6,23,.15)] backdrop-blur sm:flex-row sm:items-center sm:p-3 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_46px_-24px_rgba(0,0,0,.6)]">
                                {/* Contributor */}
                                {renderContributorSection()}

                                {/* Right side */}
                                <div className="mt-1 flex items-center justify-center gap-2 pr-1.5 sm:mt-0 sm:gap-3 sm:pr-3">
                                    <div
                                        className="flex items-center space-x-1.5 rounded-full border border-white/50 bg-white/70 px-2.5 py-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"
                                        tabIndex={0}
                                        aria-label={translations[language].views}
                                    >
                                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(book.view)}</p>
                                    </div>

                                    {/* Share (button + menus) */}
                                    <div className="relative isolate z-[1200]" ref={shareMenuRef}>
                                        {' '}
                                        {/* <button
                                            ref={shareButtonRef}
                                            onClick={() => setShowShareMenu(!showShareMenu)}
                                            className={`inline-flex items-center rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-amber-400 ${shareHovered ? 'scale-105 ring-4 ring-blue-400' : ''}`}
                                        >
                                            <Share2 className="mr-2 h-4 w-4" />
                                            {translations[language].share}
                                        </button> */}
                                        {/* Desktop/Tablet popover */}
                                        {showShareMenu && (
                                            <>
                                                <div
                                                    className="absolute top-0 z-[1300] mt-2 hidden w-64 animate-[menuIn_.16s_ease-out] rounded-xl border border-gray-200 bg-white/95 p-2 shadow-2xl backdrop-blur-md sm:block dark:border-gray-700 dark:bg-gray-900/95"
                                                    role="menu"
                                                >
                                                    <div className="absolute -top-2 right-6 h-3 w-3 rotate-45 border-t border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
                                                    {[
                                                        {
                                                            platform: 'facebook',
                                                            icon: Facebook,
                                                            label: translations[language].share_facebook,
                                                            color: 'text-blue-600',
                                                        },
                                                        {
                                                            platform: 'telegram',
                                                            icon: FaTelegram,
                                                            label: translations[language].share_telegram,
                                                            color: 'text-sky-500',
                                                        },
                                                        {
                                                            platform: 'twitter',
                                                            icon: FaXTwitter,
                                                            label: translations[language].share_twitter,
                                                            color: 'text-gray-900 dark:text-gray-100',
                                                        },
                                                        {
                                                            platform: 'whatsapp',
                                                            icon: FaWhatsapp,
                                                            label: translations[language].share_whatsapp,
                                                            color: 'text-emerald-600',
                                                        },
                                                        {
                                                            platform: 'copy_link',
                                                            icon: Clipboard,
                                                            label: translations[language].copy_link || 'Copy Link',
                                                            color: 'text-gray-600 dark:text-gray-300',
                                                        },
                                                    ].map(({ platform, icon: Icon, label, color }) => (
                                                        <button
                                                            key={platform}
                                                            onClick={() => handleShare(platform)}
                                                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100/80 dark:text-gray-200 dark:hover:bg-gray-800/70"
                                                            aria-label={label}
                                                            role="menuitem"
                                                        >
                                                            <Icon className={`mr-3 h-5 w-5 ${color}`} />
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Mobile bottom sheet */}
                                                <div
                                                    className="fixed inset-x-0 bottom-0 z-[1400] rounded-t-2xl border-t border-gray-200 bg-white p-3 shadow-2xl sm:hidden dark:border-gray-700 dark:bg-gray-900"
                                                    role="menu"
                                                >
                                                    <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300/70 dark:bg-gray-600/70" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            {
                                                                platform: 'facebook',
                                                                icon: Facebook,
                                                                label: translations[language].share_facebook,
                                                                color: 'text-blue-600',
                                                            },
                                                            {
                                                                platform: 'telegram',
                                                                icon: FaTelegram,
                                                                label: translations[language].share_telegram,
                                                                color: 'text-sky-500',
                                                            },
                                                            {
                                                                platform: 'twitter',
                                                                icon: FaXTwitter,
                                                                label: translations[language].share_twitter,
                                                                color: 'text-gray-900 dark:text-gray-100',
                                                            },
                                                            {
                                                                platform: 'whatsapp',
                                                                icon: FaWhatsapp,
                                                                label: translations[language].share_whatsapp,
                                                                color: 'text-emerald-600',
                                                            },
                                                            {
                                                                platform: 'copy_link',
                                                                icon: Clipboard,
                                                                label: translations[language].copy_link || 'Copy Link',
                                                                color: 'text-gray-600 dark:text-gray-300',
                                                            },
                                                        ].map(({ platform, icon: Icon, label, color }) => (
                                                            <button
                                                                key={platform}
                                                                onClick={() => {
                                                                    handleShare(platform);
                                                                    setShowShareMenu(false);
                                                                }}
                                                                className="flex items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100/80 dark:text-gray-200 dark:hover:bg-gray-800/70"
                                                                aria-label={label}
                                                                role="menuitem"
                                                            >
                                                                <Icon className={`mr-3 h-5 w-5 ${color}`} />
                                                                <span className="truncate">{label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Click-away (mobile) */}
                                                <button
                                                    aria-label="Close share menu"
                                                    className="fixed inset-0 z-[1300] bg-black/20 sm:hidden"
                                                    onClick={() => setShowShareMenu(false)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Main */}
                        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
                            {/* LEFT: Tabbed Details */}
                            <div className="order-last rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_20px_46px_-20px_rgba(2,6,23,.15)] backdrop-blur sm:p-8 lg:order-first lg:col-span-2 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_46px_-24px_rgba(0,0,0,.6)]">
                                {/* Tabs */}
                                <div
                                    role="tablist"
                                    className="relative mb-4 inline-flex rounded-full border border-gray-200 bg-white/70 p-1 shadow-sm backdrop-blur sm:mb-6 dark:border-gray-700 dark:bg-gray-800/70"
                                >
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'details'}
                                        onClick={() => setActiveTab('details')}
                                        className={[
                                            'flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 sm:py-2',
                                            activeTab === 'details'
                                                ? 'bg-amber-500 text-white shadow'
                                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
                                        ].join(' ')}
                                    >
                                        <List className="mr-2 h-4 w-4" />
                                        {translations[language].book_details}
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'description'}
                                        onClick={() => setActiveTab('description')}
                                        className={[
                                            'flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 sm:py-2',
                                            activeTab === 'description'
                                                ? 'bg-amber-500 text-white shadow'
                                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
                                        ].join(' ')}
                                    >
                                        <Info className="mr-2 h-4 w-4" />
                                        {translations[language].description}
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[220px] sm:min-h-[300px]">
                                    {activeTab === 'description' && (
                                        <p className="text-sm leading-relaxed break-words whitespace-pre-line text-gray-700 sm:text-base dark:text-gray-300">
                                            {book.description}
                                        </p>
                                    )}
                                    {activeTab === 'details' && renderDetailsContent()}
                                </div>
                            </div>

                            {/* RIGHT: Cover + Actions */}
                            <div className="order-first space-y-4 self-start sm:space-y-6 lg:sticky lg:top-10 lg:order-last">
                                {/* Book Cover */}
                                <div className="flex flex-col items-center p-0">
                                    <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_18px_46px_-24px_rgba(2,6,23,.25)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_46px_-24px_rgba(0,0,0,.6)]">
                                        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-600/10 via-emerald-500/10 to-indigo-600/10" />
                                        {/* Aspect ratio box to prevent layout shift */}
                                        <div className="relative w-full overflow-hidden rounded-xl">
                                            <div className="aspect-[3/4] w-full">
                                                {loading ? (
                                                    <Skeleton className="h-full w-full rounded-xl" />
                                                ) : (
                                                    <img
                                                        src={book.cover}
                                                        alt={book.title}
                                                        className="h-full w-full rounded-xl object-cover shadow-lg transition-transform duration-300 hover:scale-[1.015]"
                                                        loading="lazy"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {/* Availability ribbon */}
                                        {/* <div
                                            className={[
                                                'absolute top-3 left-3 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs',
                                                book.is_available ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white',
                                            ].join(' ')}
                                        >
                                            {book.is_available
                                                ? (translations[language].available ?? 'Available')
                                                : (translations[language].not_available ?? 'Unavailable')}
                                        </div> */}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mx-auto flex w-full max-w-xs flex-col gap-3 sm:gap-4 lg:max-w-none">
                                    {book.flip_link && (
                                        <button
                                            type="button"
                                            onClick={() => window.open(book.flip_link, '_blank', 'noopener,noreferrer')}
                                            className="w-full transform rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-center text-base font-bold text-white shadow-lg shadow-amber-600/40 transition-all hover:scale-[1.01] hover:shadow-amber-500/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-6 sm:py-3 sm:text-lg"
                                            aria-label={translations[language].view_flipbook}
                                        >
                                            <span className="inline-flex items-center justify-center">
                                                <BookOpen className="mr-2 h-5 w-5 sm:mr-3" />
                                                {translations[language].view_flipbook}
                                            </span>
                                        </button>
                                    )}
                                    {book.pdf_url && book.downloadable && (
                                        <button
                                            onClick={handleDownload}
                                            className="relative w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-base font-bold text-white shadow-lg shadow-blue-600/40 transition-all hover:scale-[1.01] hover:shadow-indigo-600/40 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 sm:px-6 sm:py-3 sm:text-lg"
                                            aria-label={translations[language].download_pdf}
                                            disabled={loading}
                                        >
                                            {loading && (
                                                <span className="absolute top-1/2 left-3 -translate-y-1/2">
                                                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                                    </svg>
                                                </span>
                                            )}
                                            <span className="inline-flex items-center justify-center">
                                                <Download className="mr-2 h-5 w-5 sm:mr-3" />
                                                {translations[language].download_pdf}
                                            </span>
                                        </button>
                                    )}
                                    {canShowLoanRequestButton && (
                                        <button
                                            type="button"
                                            onClick={isPendingLoanRequest ? handleCancelLoanRequest : handleLoanRequest}
                                            className={`w-full transform rounded-xl px-4 py-2.5 text-base font-bold text-white transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3 sm:text-lg ${
                                                isPendingLoanRequest
                                                    ? 'bg-gradient-to-r from-rose-600 to-red-600 shadow-lg shadow-rose-600/40 hover:scale-[1.01] hover:shadow-red-600/40 focus-visible:ring-rose-500'
                                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/40 hover:scale-[1.01] hover:shadow-emerald-500/50 focus-visible:ring-emerald-500'
                                            }`}
                                            disabled={shouldDisableLoanRequestButton}
                                            aria-label={loanRequestLabel}
                                        >
                                            {requestingLoan ? (isPendingLoanRequest ? 'កំពុងបោះបង់សំណើរ...' : 'កំពុងដាក់សំណើរ...') : loanRequestLabel}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Related Books */}
                        {relatedBooks.length > 0 && (
                            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_20px_46px_-20px_rgba(2,6,23,.15)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_46px_-24px_rgba(0,0,0,.6)]">
                                <h2 className="mb-4 border-b border-gray-200 pb-2.5 text-xl font-bold text-gray-900 sm:mb-6 sm:pb-3 sm:text-2xl dark:border-gray-700 dark:text-gray-100">
                                    {translations[language].related_books}
                                </h2>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
                                    {relatedBooks.slice(0, 20).map((relatedBook) => (
                                        <Link
                                            key={relatedBook.id}
                                            href={`/library/${relatedBook.id}`}
                                            className="group relative flex flex-col items-center rounded-xl border border-white/60 bg-white/60 p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-3 dark:border-white/10 dark:bg-white/[0.05]"
                                            aria-label={`View ${relatedBook.title}`}
                                        >
                                            <div className="w-full max-w-[160px]">
                                                <div className="aspect-[3/4] w-full overflow-hidden rounded-md">
                                                    <img
                                                        src={relatedBook.cover}
                                                        alt={relatedBook.title}
                                                        className="h-full w-full transform object-fit shadow-md transition duration-300 group-hover:scale-[1.03]"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2.5 w-full text-center sm:mt-3">
                                                <p className="line-clamp-2 text-xs leading-6 font-semibold text-gray-900 sm:text-sm dark:text-gray-100">
                                                    {relatedBook.title}
                                                </p>
                                                <p className="mt-1 line-clamp-1 text-[11px] font-medium text-gray-500 sm:text-xs dark:text-gray-400">
                                                    {relatedBook.user?.name || relatedBook.author || translations[language].unknown}
                                                </p>
                                                {/* <img src={relatedBook.user?.avatar} alt={`${relatedBook.user?.name || relatedBook.author}'s avatar`} className="h-4 w-4 rounded-full object-cover" loading="lazy" /> */}
                                            </div>
                                            <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-transparent transition group-focus:ring-blue-300/60 dark:group-focus:ring-blue-900/40" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Motion keyframes */}
            <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(-6px) scale(.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
        </>
    );
}
