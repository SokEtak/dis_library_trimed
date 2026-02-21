'use client';

import AppearanceTabs from '@/components/appearance-tabs';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import echo from '@/lib/echo';
import { translations } from '@/utils/translations/library/translations';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDownUp,
    ArrowUpAZ,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    Crown,
    Download,
    Eye,
    Globe,
    LogIn,
    LogOut,
    Menu,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Book {
    language: any;
    program?: string | null;
    code: any;
    publisher: any;
    isbn: any;
    page_count: any;
    pdf_url: any;
    id: number;
    title: string;
    author: string;
    description: string;
    cover?: string | null;
    type: string;
    flip_link?: string | null;
    is_available: boolean;
    downloadable: number;
    view?: number;
    posted_by_user_id?: number;
    poster_profile_url?: string;
    published_at?: string | number;
    created_at?: string;
    user?: { id: number; name: string; isVerified: boolean; avatar: string } | null;
    category?: { id: number; name: string };
    subcategory?: { id: number; name: string } | null;
    bookcase?: { id: number; code: string } | null;
    shelf?: { id: number; code: string } | null;
    grade?: { id: number; name: string } | null;
    subject?: { id: number; name: string } | null;
    campus?: { id: number; name: string } | null;
}

interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    roles?: string[];
}

interface LoanRequest {
    id: number;
    book_id: number;
    status: 'pending' | 'approved' | 'rejected';
    approver_id?: number | null;
    canceled_by_requester?: boolean;
    decided_at?: string | null;
}

interface SearchSuggestion {
    id: number;
    title: string;
    author: string;
}

interface PageProps {
    flash: { message?: string };
    books: {
        data: Book[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    auth: { user: AuthUser | null };
    scope?: 'local' | 'global';
    bookType?: 'ebook' | 'physical';
    lang?: 'en' | 'kh';
    canRequestLoan?: boolean;
    loanRequests?: Record<number, LoanRequest>;
    [key: string]: any;
}

const formatDate = (dateInput: string | number | undefined): string => {
    if (!dateInput) return translations.kh.unknownContributor;
    if (typeof dateInput === 'number') {
        return dateInput.toString();
    }
    try {
        return new Date(dateInput).toLocaleDateString('km-KH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ';
    }
};

export default function Index() {
    const { books, flash, auth, scope, bookType = 'physical', lang = 'kh', canRequestLoan = false, loanRequests = {} } = usePage<PageProps>().props;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSubCategory, setFilterSubCategory] = useState('All');
    const [filterBookcase, setFilterBookcase] = useState('All');
    const [filterShelf, setFilterShelf] = useState('All');
    const [filterGrade, setFilterGrade] = useState('All');
    const [filterSubject, setFilterSubject] = useState('All');
    const [filterCampus, setFilterCampus] = useState('All');
    const [filterLanguage, setFilterLanguage] = useState('All');
    const [sortProgram, setSortProgram] = useState('All');
    const [sortBy, setSortBy] = useState('None');
    const [currentPage, setCurrentPage] = useState(books.current_page);
    const [isSearchSuggestionOpen, setIsSearchSuggestionOpen] = useState(false);
    const [loanRequestsByBookId, setLoanRequestsByBookId] = useState<Record<number, LoanRequest>>(loanRequests || {});
    const [requestingBookId, setRequestingBookId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ show: false, message: '' });
    const lastLocallyUpdatedLoanRequestIdRef = useRef<number | null>(null);
    const searchWrapperRef = useRef<HTMLDivElement | null>(null);

    const [language, setLanguage] = useState<'en' | 'kh'>(() => {
        const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
        return (savedLanguage === 'en' || savedLanguage === 'kh' ? savedLanguage : lang) as 'en' | 'kh';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = translations[language];

    const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return [];
        }

        const seenTitles = new Set<string>();

        return books.data
            .filter((book) => {
                const normalizedTitle = String(book.title || '').toLowerCase();

                if (!normalizedTitle.includes(normalizedSearch)) {
                    return false;
                }

                if (seenTitles.has(normalizedTitle)) {
                    return false;
                }

                seenTitles.add(normalizedTitle);
                return true;
            })
            .slice(0, 6)
            .map((book) => ({
                id: book.id,
                title: book.title,
                author: book.author || t.unknownContributor,
            }));
    }, [search, books.data, t.unknownContributor]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!searchWrapperRef.current?.contains(event.target as Node)) {
                setIsSearchSuggestionOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        setLoanRequestsByBookId(loanRequests || {});
    }, [loanRequests, books.current_page, bookType]);

    useEffect(() => {
        const authUserId = auth.user?.id;
        const echoInstance = echo;

        if (!authUserId || !echoInstance) {
            return;
        }

        const channelName = `book-loan-requests.user.${authUserId}`;
        const channel = echoInstance.private(channelName);

        const handleStatusUpdate = (event: {
            loanRequest?: {
                id?: number;
                book_id?: number;
                status?: LoanRequest['status'];
                approver_id?: number | null;
                canceled_by_requester?: boolean;
                decided_at?: string | null;
                requester_name?: string | null;
            };
        }) => {
            const payload = event.loanRequest;

            if (!payload?.book_id || !payload.status) {
                return;
            }

            if (typeof payload.id === 'number' && lastLocallyUpdatedLoanRequestIdRef.current === payload.id) {
                lastLocallyUpdatedLoanRequestIdRef.current = null;
                return;
            }

            const bookId = payload.book_id;

            setLoanRequestsByBookId((currentRequests) => ({
                ...currentRequests,
                [bookId]: {
                    id: payload.id ?? currentRequests[bookId]?.id ?? 0,
                    book_id: bookId,
                    status: payload.status,
                    approver_id: payload.approver_id ?? null,
                    canceled_by_requester: Boolean(payload.canceled_by_requester),
                    decided_at: payload.decided_at ?? null,
                },
            }));

            if (payload.status === 'approved') {
                setToast({
                    show: true,
                    message: language === 'en' ? 'Request approved.' : 'សំណើរត្រូវបានអនុម័ត',
                    type: 'success',
                });
            } else if (payload.status === 'rejected') {
                const wasCanceledByRequester = Boolean(payload.canceled_by_requester);
                setToast({
                    show: true,
                    message: wasCanceledByRequester
                        ? language === 'en'
                            ? 'Request canceled.'
                            : 'សំណើរត្រូវបានបោះបង់'
                        : language === 'en'
                          ? 'Request rejected.'
                          : 'សំណើរត្រូវបានបដិសេធ',
                    type: wasCanceledByRequester ? 'info' : 'error',
                });
            }
        };

        channel.listen('.book-loan-request.updated', handleStatusUpdate);

        return () => {
            channel.stopListening('.book-loan-request.updated');
            echoInstance.leave(channelName);
        };
    }, [auth.user?.id, language]);

    const handleLoanRequest = async (bookId: number) => {
        if (requestingBookId !== null) {
            return;
        }

        setRequestingBookId(bookId);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const response = await fetch(route('library.loan-requests.store', bookId), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
            });

            const data = (await response.json()) as {
                message?: string;
                loanRequest?: Partial<LoanRequest> | null;
                already_pending?: boolean;
            };

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit loan request.');
            }

            setLoanRequestsByBookId((currentRequests) => ({
                ...currentRequests,
                [bookId]: {
                    id: data.loanRequest?.id ?? currentRequests[bookId]?.id ?? 0,
                    book_id: data.loanRequest?.book_id ?? bookId,
                    status: (data.loanRequest?.status as LoanRequest['status']) ?? 'pending',
                    approver_id: data.loanRequest?.approver_id ?? null,
                    canceled_by_requester: Boolean(data.loanRequest?.canceled_by_requester),
                    decided_at: data.loanRequest?.decided_at ?? null,
                },
            }));

            setToast({
                show: true,
                message: data.message || (language === 'en' ? 'Loan request submitted.' : 'សំណើរត្រូវបានផ្ញើ'),
                type: data.already_pending ? 'info' : 'success',
            });
        } catch (error) {
            setToast({
                show: true,
                message: error instanceof Error ? error.message : language === 'en' ? 'Failed to submit loan request.' : 'មិនអាចផ្ញើសំណើរបានទេ',
                type: 'error',
            });
        } finally {
            setRequestingBookId(null);
        }
    };

    const handleCancelLoanRequest = async (bookId: number) => {
        const existingLoanRequest = loanRequestsByBookId[bookId];

        if (!existingLoanRequest?.id || requestingBookId !== null) {
            return;
        }

        lastLocallyUpdatedLoanRequestIdRef.current = existingLoanRequest.id;
        setRequestingBookId(bookId);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const response = await fetch(route('library.loan-requests.cancel', existingLoanRequest.id), {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    ...(echo?.socketId() ? { 'X-Socket-Id': echo.socketId() as string } : {}),
                },
            });

            const data = (await response.json()) as { message?: string; loanRequest?: Partial<LoanRequest> | null };

            if (!response.ok) {
                throw new Error(data.message || 'Failed to cancel loan request.');
            }

            setLoanRequestsByBookId((currentRequests) => ({
                ...currentRequests,
                [bookId]: {
                    id: data.loanRequest?.id ?? existingLoanRequest.id,
                    book_id: data.loanRequest?.book_id ?? bookId,
                    status: (data.loanRequest?.status as LoanRequest['status']) ?? 'rejected',
                    approver_id: data.loanRequest?.approver_id ?? null,
                    canceled_by_requester: Boolean(data.loanRequest?.canceled_by_requester ?? true),
                    decided_at: data.loanRequest?.decided_at ?? null,
                },
            }));

            setToast({
                show: true,
                message: data.message || (language === 'en' ? 'Request canceled.' : 'សំណើរត្រូវបានបោះបង់'),
                type: 'info',
            });
        } catch (error) {
            lastLocallyUpdatedLoanRequestIdRef.current = null;

            setToast({
                show: true,
                message: error instanceof Error ? error.message : language === 'en' ? 'Failed to cancel loan request.' : 'មិនអាចបោះបង់សំណើរបានទេ',
                type: 'error',
            });
        } finally {
            setRequestingBookId(null);
        }
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'kh' ? 'en' : 'kh'));
    };

    const resetFilters = () => {
        setSearch('');
        setFilterCategory('All');
        setFilterSubCategory('All');
        setFilterBookcase('All');
        setFilterShelf('All');
        setFilterGrade('All');
        setFilterSubject('All');
        setFilterCampus('All');
        setFilterLanguage('All');
        setSortProgram('All');
        setSortBy('None');
        setCurrentPage(1);
    };

    // Count active filters for badge display
    const activeFilterCount = [
        filterCategory !== 'All',
        filterSubCategory !== 'All',
        filterBookcase !== 'All',
        filterShelf !== 'All',
        filterGrade !== 'All',
        filterSubject !== 'All',
        filterCampus !== 'All',
        filterLanguage !== 'All',
        sortProgram !== 'All',
        sortBy !== 'None',
        search !== '',
    ].filter(Boolean).length;

    // Get active filters for display as chips
    const getActiveFilters = () => {
        const active = [];
        if (search) active.push({ type: 'search', label: search, icon: '🔍' });
        if (filterCategory !== 'All') active.push({ type: 'category', label: filterCategory, icon: '📚' });
        if (filterSubCategory !== 'All') active.push({ type: 'subcategory', label: filterSubCategory, icon: '📖' });
        if (filterBookcase !== 'All') active.push({ type: 'bookcase', label: filterBookcase, icon: '🗄️' });
        if (filterShelf !== 'All') active.push({ type: 'shelf', label: filterShelf, icon: '🛎️' });
        if (filterGrade !== 'All') active.push({ type: 'grade', label: filterGrade, icon: '🎓' });
        if (filterSubject !== 'All') active.push({ type: 'subject', label: filterSubject, icon: '✏️' });
        if (filterCampus !== 'All') active.push({ type: 'campus', label: filterCampus, icon: '🏫' });
        if (filterLanguage !== 'All') active.push({ type: 'language', label: filterLanguage, icon: '🗣️' });
        if (sortProgram !== 'All') active.push({ type: 'program', label: sortProgram, icon: '📋' });
        if (sortBy !== 'None') active.push({ type: 'sort', label: sortBy, icon: '↔️' });
        return active;
    };

    const activeFilters = getActiveFilters();

    const currentLibrary = bookType === 'ebook' ? 'ebook' : scope === 'global' ? 'global' : 'local';

    const handleLibraryChange = (value: string) => {
        const query = {
            search,
            category: filterCategory,
            subcategory: filterSubCategory,
            bookcase: filterBookcase,
            shelf: filterShelf,
            grade: filterGrade,
            subject: filterSubject,
            campus: filterCampus,
            language: filterLanguage,
            program: sortProgram,
            sort_by: sortBy,
            page: 1,
        };
        if (value === 'ebook') {
            router.get(route('global e-library'), query);
        } else if (value === 'local') {
            router.get(route('local library'), query);
        } else if (value === 'global') {
            router.get(route('global library'), query);
        }
    };

    const categories = useMemo(() => Array.from(new Set(books.data.map((b) => b.category?.name).filter(Boolean))), [books.data]);
    const subcategories = useMemo(() => Array.from(new Set(books.data.map((b) => b.subcategory?.name).filter(Boolean))), [books.data]);
    
    // Get relevant subcategories based on selected category
    const relevantSubcategories = useMemo(() => {
        if (filterCategory === 'All') {
            return subcategories;
        }
        return Array.from(
            new Set(
                books.data
                    .filter((b) => b.category?.name === filterCategory)
                    .map((b) => b.subcategory?.name)
                    .filter(Boolean),
            ),
        );
    }, [filterCategory, books.data, subcategories]);
    
    const bookcases = useMemo(() => Array.from(new Set(books.data.map((b) => b.bookcase?.code).filter(Boolean))), [books.data]);
    const shelves = useMemo(() => Array.from(new Set(books.data.map((b) => b.shelf?.code).filter(Boolean))), [books.data]);
    const grades = useMemo(() => {
        const gradeNames = Array.from(
            new Set(
                books.data
                    .map((b) => b.grade?.name)
                    .filter((name): name is string => !!name)
                    .filter((name) => {
                        const match = name.match(/(\d+)/);
                        const num = match ? parseInt(match[0], 10) : null;
                        return num !== null && num >= 1 && num <= 12;
                    }),
            ),
        );
        return gradeNames.sort((a, b) => {
            const numA = parseInt(a.match(/(\d+)/)![0], 10);
            const numB = parseInt(b.match(/(\d+)/)![0], 10);
            return numA - numB;
        });
    }, [books.data]);
    const subjects = useMemo(() => Array.from(new Set(books.data.map((b) => b.subject?.name).filter(Boolean))), [books.data]);
    const campuses = useMemo(() => Array.from(new Set(books.data.map((b) => b.campus?.name).filter(Boolean))), [books.data]);
    const languages = useMemo(() => Array.from(new Set(books.data.map((b) => b.language).filter(Boolean))), [books.data]);
    const programs = useMemo(() => Array.from(new Set(books.data.map((b) => b.program?.toLowerCase()).filter(Boolean))), [books.data]);

    const allFilteredBooks = useMemo(() => {
        let filtered = books.data.filter((book) => {
            if (book.type !== bookType) return false;

            const title = String(book.title || '');
            const author = String(book.author || '');
            const code = String(book.code || '');
            const query = search.toLowerCase();

            const matchesSearch = title.toLowerCase().includes(query) || author.toLowerCase().includes(query) || code.toLowerCase().includes(query);

            const matchesCategory = filterCategory === 'All' || book.category?.name === filterCategory;
            const matchesSubCategory = filterSubCategory === 'All' || book.subcategory?.name === filterSubCategory;
            const matchesBookcase = bookType === 'ebook' || filterBookcase === 'All' || book.bookcase?.code === filterBookcase;
            const matchesShelf = bookType === 'ebook' || filterShelf === 'All' || book.shelf?.code === filterShelf;
            const matchesGrade = filterGrade === 'All' || book.grade?.name === filterGrade;
            const matchesSubject = filterSubject === 'All' || book.subject?.name === filterSubject;
            const matchesCampus = bookType === 'ebook' || scope !== 'local' || filterCampus === 'All' || book.campus?.name === filterCampus;
            const matchesLanguage = filterLanguage === 'All' || book.language === filterLanguage;
            const matchesProgram = sortProgram === 'All' || String(book.program || '').toLowerCase() === sortProgram.toLowerCase();

            return (
                matchesSearch &&
                matchesCategory &&
                matchesSubCategory &&
                matchesBookcase &&
                matchesShelf &&
                matchesGrade &&
                matchesSubject &&
                matchesCampus &&
                matchesLanguage &&
                matchesProgram
            );
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'Newest') {
                const dateA = a.created_at || a.published_at;
                const dateB = b.created_at || b.published_at;
                if (dateA && dateB) {
                    if (typeof dateA === 'number' && typeof dateB === 'number') {
                        return dateB - dateA;
                    }
                    const timeB = new Date(String(dateB)).getTime();
                    const timeA = new Date(String(dateA)).getTime();
                    return timeB - timeA;
                }
                return 0;
            } else if (sortBy === 'Title A-Z') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'Most Viewed') {
                const viewA = a.view ?? 0;
                const viewB = b.view ?? 0;
                return viewB - viewA;
            }
            return 0;
        });
    }, [
        books.data,
        search,
        filterCategory,
        filterSubCategory,
        filterBookcase,
        filterShelf,
        filterGrade,
        filterSubject,
        filterCampus,
        filterLanguage,
        sortProgram,
        sortBy,
        bookType,
        scope,
    ]);

    // Find the book with the highest view count
    const maxViews = allFilteredBooks.length > 0 ? Math.max(...allFilteredBooks.map((b) => b.view ?? 0)) : 0;

    const totalPages = books.last_page;
    const paginatedBooks = allFilteredBooks;

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
            router.get(
                route(currentLibrary === 'ebook' ? 'global e-library' : currentLibrary === 'global' ? 'global library' : 'local library'),
                {
                    search,
                    category: filterCategory,
                    subcategory: filterSubCategory,
                    bookcase: filterBookcase,
                    shelf: filterShelf,
                    grade: filterGrade,
                    subject: filterSubject,
                    campus: filterCampus,
                    language: filterLanguage,
                    program: sortProgram,
                    sort_by: sortBy,
                    page,
                },
                { preserveState: true, preserveScroll: true },
            );
            // Scroll to top after page change
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const goToPreviousPage = () => {
        goToPage(currentPage - 1);
    };

    const goToNextPage = () => {
        goToPage(currentPage + 1);
    };

    useEffect(() => {
        setCurrentPage(books.current_page);
    }, [books.current_page]);

    useEffect(() => {
        // Reset to page 1 when filters change
        if (currentPage !== 1) {
            goToPage(1);
        }
    }, [
        search,
        filterCategory,
        filterSubCategory,
        filterBookcase,
        filterShelf,
        filterGrade,
        filterSubject,
        filterCampus,
        filterLanguage,
        sortProgram,
        sortBy,
    ]);

    const accentColor = 'cyan';
    const isAuthenticated = auth.user !== null;
    const allText = language === 'en' ? 'All' : 'ទាំងអស់';
    const BASE_URL = 'https://fls-9fd96a88-703c-423b-a3c6-5b74b203b091.laravel.cloud';

    const NavUser = ({ user }: { user: AuthUser }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-10 items-center space-x-3 rounded-full px-4 text-sm shadow-sm transition-colors hover:bg-gray-100 sm:h-11 sm:text-base dark:hover:bg-gray-700"
                >
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full border border-gray-300 object-contain dark:border-gray-600"
                    />
                    <span className="max-w-32 truncate font-medium sm:max-w-48">{user.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <DropdownMenuLabel className="flex flex-col space-y-1 pb-2">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <AppearanceTabs className="mt-0" />
                <DropdownMenuItem
                    onClick={toggleLanguage}
                    className="flex items-center space-x-2 rounded-md py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <Globe className="h-5 w-5" />
                    <span>{language === 'kh' ? t.switchToEnglish : t.switchToKhmer}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => router.post(route('logout'))}
                    className="flex items-center space-x-2 rounded-md py-2 text-red-600 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                >
                    <LogOut className="h-5 w-5" />
                    <span>{t.logout}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-fuchsia-50 to-pink-100 transition-colors duration-300 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <Head title={bookType === 'ebook' ? t.ebooksLibrary : t.language === 'kh' ? 'បណ្ណាល័យសៀវភៅ' : 'Books Library'} />
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((currentToast) => ({ ...currentToast, show: false }))}
            />
            <div className="mx-auto w-full max-w-full space-y-6 px-3 py-4 text-gray-900 sm:space-y-10 sm:px-6 sm:py-8 lg:px-12 lg:space-y-14 xl:px-16 dark:text-gray-100">
                <header className="relative z-40 flex flex-col rounded-2xl border-b border-gray-200/60 bg-white/60 px-3 py-4 shadow-lg backdrop-blur-[6px] sm:flex-row sm:items-center sm:rounded-3xl sm:px-4 sm:py-6 sm:pb-4 dark:border-gray-800 dark:bg-gray-900/70">
                    {/* LEFT — Logo */}
                    <div className="flex items-center justify-between sm:w-auto sm:justify-start">
                        <Link href="/" className="flex items-center">
                            <img src="/images/dis2.png" alt={t.language === 'en' ? 'Logo' : 'រូបសញ្ញា'} className="h-10 w-auto sm:h-12 lg:h-14" />
                        </Link>

                        {/* Mobile menu toggle */}
                        <div className="sm:hidden">
                            <Button variant="ghost" className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? (
                                    <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                ) : (
                                    <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* CENTER — Search */}
                    <div
                        ref={searchWrapperRef}
                        className="relative z-50 mt-3 w-full sm:absolute sm:top-1/2 sm:left-1/2 sm:mt-0 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
                    >
                        <Search className="absolute top-1/2 left-4 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-cyan-400 dark:text-cyan-300" />
                        <Input
                            placeholder={t.searchPlaceholder}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setIsSearchSuggestionOpen(true);
                            }}
                            onFocus={() => setIsSearchSuggestionOpen(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsSearchSuggestionOpen(false);
                                }
                            }}
                            className="h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl border border-cyan-200 bg-white/80 pr-12 pl-10 sm:pl-12 text-xs sm:text-base shadow-lg transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 dark:border-cyan-900 dark:bg-gray-800/80 dark:text-white"
                            aria-label={language === 'en' ? 'Search books' : 'ស្វែងរកសៀវភៅ'}
                        />

                        {isSearchSuggestionOpen && search.trim().length > 0 && (
                            <div className="absolute top-[calc(100%+0.35rem)] z-[70] w-full overflow-hidden rounded-xl border border-cyan-200 bg-white/95 shadow-xl backdrop-blur dark:border-cyan-900 dark:bg-gray-900/95">
                                {searchSuggestions.length > 0 ? (
                                    <ul className="max-h-72 overflow-y-auto py-1">
                                        {searchSuggestions.map((suggestion) => (
                                            <li key={suggestion.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearch(suggestion.title);
                                                        setIsSearchSuggestionOpen(false);
                                                    }}
                                                    className="flex w-full flex-col items-start px-3 py-2 text-left transition-colors hover:bg-cyan-50 dark:hover:bg-gray-800"
                                                >
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{suggestion.title}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{suggestion.author}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                        {language === 'en' ? 'No suggestions found.' : 'មិនមានការណែនាំ'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Clear search button */}
                        {search && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSearch('');
                                    setIsSearchSuggestionOpen(false);
                                }}
                                className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-full p-0 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                aria-label={language === 'en' ? 'Clear search' : 'សម្អាត'}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* RIGHT — User */}
                    <div className="hidden items-center sm:ml-auto sm:flex">{isAuthenticated && <NavUser user={auth.user!} />}</div>

                    {/* MOBILE MENU */}
                    {isMenuOpen && (
                        <div className="absolute top-16 right-3 z-50 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:hidden dark:border-gray-700 dark:bg-gray-800">
                            {isAuthenticated ? (
                                <>
                                    <div className="mb-3 flex flex-col space-y-1 border-b border-gray-100 pb-3 dark:border-gray-700">
                                        <span className="truncate text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{auth.user!.name}</span>
                                        <span className="truncate text-xs text-gray-500 dark:text-gray-400">{auth.user!.email}</span>
                                    </div>
                                    <AppearanceTabs className="mt-0" />
                                    <button
                                        onClick={toggleLanguage}
                                        className="flex w-full items-center space-x-2 rounded-md py-2 px-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Globe className="h-4 w-4" />
                                        <span>{language === 'kh' ? t.switchToEnglish : t.switchToKhmer}</span>
                                    </button>

                                    <button
                                        onClick={() => router.post(route('logout'))}
                                        className="flex w-full items-center space-x-2 rounded-md py-2 px-1 text-xs sm:text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>{t.logout}</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="flex items-center space-x-2 rounded-md py-2 px-1 text-xs sm:text-sm text-cyan-600 hover:bg-gray-100 dark:text-cyan-400 dark:hover:bg-gray-700"
                                >
                                    <LogIn className="h-4 w-4" />
                                    <span>{t.signIn}</span>
                                </Link>
                            )}
                        </div>
                    )}
                </header>

                {flash.message && (
                    <div className="rounded-lg bg-green-100 p-4 text-green-800 shadow-lg dark:bg-green-900 dark:text-green-200">{flash.message}</div>
                )}
                <div className="mt-2 flex flex-col rounded-2xl border border-cyan-100 bg-white/60 p-4 shadow-lg backdrop-blur-[4px] sm:p-6 dark:border-cyan-900 dark:bg-gray-900/60 space-y-4 sm:space-y-5">
                    {/* Active Filters Display Section */}
                    {activeFilterCount > 0 && (
                        <div className="rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-3 sm:p-4 dark:border-cyan-800 dark:from-cyan-950/50 dark:to-blue-950/50">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {language === 'en' ? 'Active Filters' : 'ច្រោះដែលកំពុងដំណើរការ'} ({activeFilterCount})
                                </span>
                                <button
                                    onClick={resetFilters}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition dark:bg-gray-800 dark:text-cyan-400 dark:hover:bg-gray-700"
                                >
                                    {language === 'en' ? 'Clear All' : 'សម្អាត'}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {activeFilters.map((filter, idx) => (
                                    <div
                                        key={idx}
                                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs border border-cyan-200 shadow-sm dark:bg-gray-800 dark:border-cyan-700"
                                    >
                                        <span className="text-sm">{filter.icon} {filter.label}</span>
                                        <button
                                            onClick={() => {
                                                switch (filter.type) {
                                                    case 'search':
                                                        setSearch('');
                                                        break;
                                                    case 'category':
                                                        setFilterCategory('All');
                                                        break;
                                                    case 'subcategory':
                                                        setFilterSubCategory('All');
                                                        break;
                                                    case 'bookcase':
                                                        setFilterBookcase('All');
                                                        break;
                                                    case 'shelf':
                                                        setFilterShelf('All');
                                                        break;
                                                    case 'grade':
                                                        setFilterGrade('All');
                                                        break;
                                                    case 'subject':
                                                        setFilterSubject('All');
                                                        break;
                                                    case 'campus':
                                                        setFilterCampus('All');
                                                        break;
                                                    case 'language':
                                                        setFilterLanguage('All');
                                                        break;
                                                    case 'program':
                                                        setSortProgram('All');
                                                        break;
                                                    case 'sort':
                                                        setSortBy('None');
                                                        break;
                                                }
                                            }}
                                            className="ml-2 text-gray-500 hover:text-red-500 transition opacity-70 hover:opacity-100"
                                            aria-label={`Remove ${filter.label} filter`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter Controls Section */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                        <Select value={currentLibrary} onValueChange={handleLibraryChange}>
                            <SelectTrigger
                                className={`w-full border text-gray-900 hover:border-gray-400 sm:w-auto dark:text-white sm:px-4 sm:py-2 sm:text-sm h-auto min-h-[2.5rem] rounded-full px-3 py-2 text-xs text-center leading-6 transition border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 focus:ring-cyan-500`}
                            >
                                <SelectValue placeholder={t.selectLibrary} className="whitespace-nowrap" />
                            </SelectTrigger>

                            <SelectContent className="w-auto max-w-[90vw] min-w-[150px] border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                <SelectItem value="local" className="px-3 py-2 text-center break-words">
                                    {t.localLibrary}
                                </SelectItem>
                                <SelectItem value="ebook" className="px-3 py-2 text-center break-words">
                                    {t.ebooksLibrary}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {[
                        { label: t.category, value: filterCategory, onChange: setFilterCategory, options: categories },
                        { label: t.subcategory, value: filterSubCategory, onChange: setFilterSubCategory, options: relevantSubcategories },
                        ...(bookType === 'physical'
                            ? [
                                  { label: t.bookcase, value: filterBookcase, onChange: setFilterBookcase, options: bookcases },
                                  { label: t.shelf, value: filterShelf, onChange: setFilterShelf, options: shelves },
                              ]
                            : []),
                        {
                            label: t.language,
                            value: filterLanguage,
                            onChange: setFilterLanguage,
                            options: languages,
                            display: (lang: string) =>
                                lang === 'en'
                                    ? t.language === 'en'
                                        ? 'English'
                                        : 'ភាសាអង់គ្លេស'
                                    : lang === 'kh'
                                      ? t.language === 'en'
                                          ? 'Khmer'
                                          : 'ភាសាខ្មែរ'
                                      : lang,
                        },
                        { label: t.grade, value: filterGrade, onChange: setFilterGrade, options: grades },
                        { label: t.subject, value: filterSubject, onChange: setFilterSubject, options: subjects },
                    ].map(({ label, value, onChange, options, display }) => {
                        const isActive = value !== 'All';
                        return (
                            <div key={label} className="relative group">
                                <Select value={value} onValueChange={onChange}>
                                    <SelectTrigger
                                        className={`w-full border text-gray-900 hover:border-gray-400 sm:w-auto dark:text-white sm:px-4 sm:py-2 sm:text-sm h-auto min-h-[2.5rem] rounded-full px-3 py-2 text-xs leading-6 transition flex items-center gap-2 ${
                                            isActive
                                                ? 'border-cyan-400 bg-cyan-50/70 dark:border-cyan-600 dark:bg-cyan-900/30 font-medium'
                                                : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                                        } focus:ring-cyan-500`}
                                    >
                                        {isActive && <span className="inline-block h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />}
                                        <SelectValue placeholder={label} />
                                    </SelectTrigger>

                                    <SelectContent className="max-w-[90vw] min-w-[150px] border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                        <SelectItem
                                            value="All"
                                            className="px-3 py-2 text-center break-words whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            {language === 'en' ? `${allText} ${label}` : `${label}${allText}`}
                                        </SelectItem>

                                        {options.map((opt) => (
                                            <SelectItem
                                                key={opt}
                                                value={opt}
                                                className="px-3 py-2 text-center break-words whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                {display ? display(opt) : opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    })}
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger
                            className={`w-full border text-gray-900 hover:border-gray-400 sm:w-auto dark:text-white sm:px-4 sm:py-2 sm:text-sm flex h-auto min-h-[2.5rem] items-center justify-center rounded-full px-3 py-2 text-xs leading-6 transition gap-2 ${
                                sortBy !== 'None'
                                    ? 'border-cyan-400 bg-cyan-50/70 dark:border-cyan-600 dark:bg-cyan-900/30 font-medium'
                                    : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                            } focus:ring-cyan-500`}
                        >
                            {sortBy !== 'None' && <span className="inline-block h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />}
                            {sortBy === 'Title A-Z' ? (
                                <ArrowUpAZ className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            ) : sortBy === 'Newest' ? (
                                <Clock className="h-4 w-4 text-red-500 dark:text-red-400" />
                            ) : sortBy === 'Most Viewed' ? (
                                <Eye className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                            ) : (
                                <ArrowDownUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                            <SelectValue placeholder={t.sortBy} className="whitespace-nowrap" />
                        </SelectTrigger>

                        <SelectContent className="max-w-[90vw] min-w-[150px] border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                            <SelectItem value="None" className="px-3 py-2 text-center whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-700">
                                {t.defaultSort}
                            </SelectItem>
                            <SelectItem value="Newest" className="px-3 py-2 text-center whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-700">
                                {t.newest}
                            </SelectItem>
                            <SelectItem
                                value="Title A-Z"
                                className="px-3 py-2 text-center whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {t.titleAZ}
                            </SelectItem>
                            <SelectItem
                                value="Most Viewed"
                                className="px-3 py-2 text-center whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {t.mostViewed}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 md:gap-8 lg:grid-cols-5 lg:gap-10 xl:grid-cols-6 2xl:grid-cols-6">
                    {paginatedBooks.length > 0 ? (
                        paginatedBooks.map((book) => {
                            const contributorId = book.posted_by_user_id || book.user?.id;
                            const contributorName = book.user?.name || (contributorId ? `អ្នកប្រើ #${contributorId}` : t.unknownContributor);
                            const isContributorVerified = !!book.user?.isVerified;
                            const canShowLoanRequestButton = canRequestLoan && bookType === 'physical' && book.type === 'physical';
                            const currentLoanRequest = loanRequestsByBookId[book.id] ?? null;
                            const loanRequestStatus = currentLoanRequest?.status ?? null;
                            const isPendingLoanRequest = loanRequestStatus === 'pending';
                            const isApprovedLoanRequest = loanRequestStatus === 'approved';
                            const isProcessingLoanRequest = requestingBookId === book.id;
                            const isCanceledLoanRequest = loanRequestStatus === 'rejected' && Boolean(currentLoanRequest?.canceled_by_requester);
                            const shouldDisableLoanRequestButton =
                                requestingBookId !== null ||
                                (isPendingLoanRequest ? false : isApprovedLoanRequest || !book.is_available);
                            const loanRequestLabel = isPendingLoanRequest
                                ? language === 'en'
                                    ? 'Cancel Request'
                                    : 'បោះបង់សំណើរ'
                                : isApprovedLoanRequest
                                  ? language === 'en'
                                      ? 'Request Approved'
                                      : 'សំណើរត្រូវបានអនុម័ត'
                                  : language === 'en'
                                    ? 'Request Loan'
                                    : 'ដាក់សំណើរ';

                            const loanRequestStatusBadge = loanRequestStatus
                                ? {
                                      label:
                                          loanRequestStatus === 'pending'
                                              ? language === 'en'
                                                  ? 'Pending'
                                                  : '\u1780\u17c6\u1796\u17bb\u1784\u179a\u1784\u17cb\u1785\u17b6\u17c6'
                                              : loanRequestStatus === 'approved'
                                                ? language === 'en'
                                                    ? 'Approved'
                                                    : '\u178f\u17d2\u179a\u17bc\u179c\u1794\u17b6\u1793\u17a2\u1793\u17bb\u1798\u17d0\u178f'
                                                : isCanceledLoanRequest
                                                  ? language === 'en'
                                                      ? 'Canceled'
                                                      : '\u1794\u17c4\u17c7\u1794\u1784\u17cb'
                                                  : language === 'en'
                                                    ? 'Rejected'
                                                    : '\u178f\u17d2\u179a\u17bc\u179c\u1794\u17b6\u1793\u1794\u178a\u17b7\u179f\u17c1\u1792',
                                      className:
                                          loanRequestStatus === 'pending'
                                              ? 'border-amber-300 bg-amber-100/95 text-amber-800 dark:border-amber-500/60 dark:bg-amber-900/40 dark:text-amber-200'
                                              : loanRequestStatus === 'approved'
                                                ? 'border-emerald-300 bg-emerald-100/95 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                : isCanceledLoanRequest
                                                  ? 'border-slate-300 bg-slate-100/95 text-slate-800 dark:border-slate-500/60 dark:bg-slate-900/50 dark:text-slate-200'
                                                  : 'border-rose-300 bg-rose-100/95 text-rose-800 dark:border-rose-500/60 dark:bg-rose-900/40 dark:text-rose-200',
                                  }
                                : null;

                            return (
                                <div
                                    key={book.id}
                                    onClick={() => router.get(route('library.show', book.id))}
                                    onKeyDown={(e) => e.key === 'Enter' && router.get(route('library.show', book.id))}
                                    tabIndex={0}
                                    aria-label={`View details for ${book.title} by ${book.author}`}
                                    className={`group relative flex w-full transform cursor-pointer flex-col items-start space-y-2 sm:space-y-3 overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-100 bg-white/70 p-3 sm:p-6 shadow-xl sm:shadow-2xl backdrop-blur-[6px] transition-all duration-300 hover:scale-[1.04] sm:hover:scale-[1.06] hover:shadow-[0_8px_32px_0_rgba(34,211,238,0.18)] focus:ring-2 focus:ring-cyan-300 focus:outline-none dark:border-cyan-900 dark:bg-gray-900/80 dark:shadow-cyan-900/40 dark:focus:ring-cyan-600`}
                                >
                                    <div className="pointer-events-none absolute inset-0 z-0 rounded-3xl bg-gradient-to-br from-cyan-100/30 via-fuchsia-100/20 to-pink-100/30 dark:from-cyan-900/20 dark:via-fuchsia-900/10 dark:to-pink-900/20" />
                                    <div className="relative z-10 w-full pb-[140%] sm:pb-[155%]">
                                        <img
                                            src={book.cover || '/images/placeholder-book.png'}
                                            alt={book.title}
                                            loading="lazy"
                                            className="absolute inset-0 h-full w-full rounded-2xl border border-cyan-100 object-fit shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:brightness-105 group-hover:contrast-110 dark:border-cyan-900"
                                        />

                                        {/* Hover overlay with quick actions */}
                                        <div className="absolute inset-0 z-20 flex items-end justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            <div className="mb-2 sm:mb-4 flex w-[95%] sm:w-[92%] flex-col gap-2 rounded-lg bg-gradient-to-r from-black/40 to-black/20 px-2 py-2 text-white backdrop-blur-sm sm:px-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0 truncate text-xs sm:text-sm">
                                                        <div className="truncate font-semibold leading-6 sm:leading-7">{book.author || t.unknownContributor}</div>
                                                        <div className="truncate text-xs opacity-80 leading-5">
                                                            {book.page_count ? `${book.page_count} ${language === 'en' ? 'pages' : '\u1791\u17c6\u1796\u17d0\u179a'}` : ''}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.get(route('library.show', book.id));
                                                            }}
                                                            className="rounded-full bg-white/10 p-1 sm:p-2 text-white hover:bg-white/20 flex-shrink-0"
                                                            aria-label={language === 'en' ? 'View details' : '\u1798\u17be\u179b\u179b\u1798\u17d2\u17a2\u17b7\u178f'}
                                                        >
                                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300 dark:text-blue-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {canShowLoanRequestButton && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();

                                                            if (isPendingLoanRequest) {
                                                                void handleCancelLoanRequest(book.id);
                                                                return;
                                                            }

                                                            void handleLoanRequest(book.id);
                                                        }}
                                                        disabled={shouldDisableLoanRequestButton}
                                                        className={`w-full rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs ${
                                                            isPendingLoanRequest
                                                                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500'
                                                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                                                        }`}
                                                        aria-label={loanRequestLabel}
                                                    >
                                                        {isProcessingLoanRequest
                                                            ? language === 'en'
                                                                ? isPendingLoanRequest
                                                                    ? 'Canceling...'
                                                                    : 'Requesting...'
                                                                : isPendingLoanRequest
                                                                  ? '\u1780\u17c6\u1796\u17bb\u1784\u1794\u17c4\u17c7\u1794\u1784\u17cb\u179f\u17c6\u178e\u17be\u179a...'
                                                                  : '\u1780\u17c6\u1796\u17bb\u1784\u178a\u17b6\u1780\u17cb\u179f\u17c6\u178e\u17be\u179a...'
                                                            : loanRequestLabel}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Most Viewed Badge */}
                                        {book.view === maxViews && (
                                            <div className="absolute top-2 right-2 flex animate-pulse items-center space-x-1 rounded-xl border border-yellow-300 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-500 px-2.5 py-1 text-[10px] font-semibold text-gray-900 shadow-lg sm:text-xs dark:border-yellow-400 dark:from-yellow-500 dark:to-yellow-600">
                                                <Crown className="h-3 w-3 text-yellow-700 dark:text-yellow-800" />
                                                <span>{t.mostViewed}</span>
                                            </div>
                                        )}
                                        {loanRequestStatusBadge && (
                                            <div
                                                className={`absolute top-2 left-2 z-30 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow sm:text-xs ${loanRequestStatusBadge.className}`}
                                            >
                                                {loanRequestStatusBadge.label}
                                            </div>
                                        )}
                                    </div>

                                    {/* Book Title and Author with Tooltip */}
                                    <div className="z-10 w-full text-center">
                                        <div
                                            className="truncate text-base sm:text-lg lg:text-xl leading-10 font-extrabold text-gray-900 drop-shadow-md dark:text-gray-100"
                                            title={book.title}
                                        >
                                            {book.title}
                                        </div>
                                    </div>

                                    <div className="z-10 flex w-full items-center justify-center space-x-2 border-t border-cyan-100 pt-1 sm:pt-2 dark:border-cyan-900">
                                        <img
                                            src={book.user?.avatar ? book.user.avatar : '/images/placeholder-book.png'}
                                            alt={t.language === 'en' ? "Contributor's avatar" : 'រូបភាពអ្នកបរិច្ចាគ'}
                                            loading="lazy"
                                            className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 rounded-full border-2 border-cyan-200 object-fit shadow-md transition-all group-hover:ring-2 group-hover:ring-cyan-300 dark:border-cyan-800"
                                        />
                                        <span className="flex min-w-0 items-center truncate text-xs sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            <span className="flex-grow truncate" title={contributorName}>
                                                {contributorName}
                                            </span>
                                            {isContributorVerified && (
                                                <BadgeCheck className="ml-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 fill-white text-cyan-500 dark:fill-gray-900 dark:text-cyan-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-20 md:py-32">
                            <div className="animate-fade-in mb-4 sm:mb-6 flex h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200 via-fuchsia-100 to-pink-200 shadow-lg sm:shadow-2xl dark:from-cyan-900 dark:via-fuchsia-900 ">
                                <img src="/images/empty-state.svg" alt="No books found" className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 opacity-90" />
                            </div>
                            <p className="mb-4 sm:mb-6 text-center text-lg sm:text-2xl lg:text-3xl font-light tracking-wide text-gray-400 px-4 dark:text-gray-500">
                                {t.noBooksFound.replace('{type}', bookType === 'ebook' ? t.bookType.ebook : t.bookType.physical)}
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <Button onClick={resetFilters} className="rounded-full px-6 py-3 w-full sm:w-auto" variant="secondary">
                                    {language === 'en' ? 'Reset filters' : 'ពិនិត្យម្តងទៀត'}
                                </Button>
                                <Link
                                    href={route(
                                        currentLibrary === 'ebook'
                                            ? 'global e-library'
                                            : currentLibrary === 'global'
                                              ? 'global library'
                                              : 'local library',
                                    )}
                                    className="w-full sm:w-auto rounded-full px-6 py-3 text-center text-cyan-700 font-semibold border border-cyan-200 hover:bg-cyan-50 transition dark:border-cyan-800 dark:hover:bg-cyan-950/30"
                                >
                                    {language === 'en' ? 'Explore library' : 'ស្វែងរកបណ្ណាល័យ'}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex flex-col gap-4 items-center justify-center pt-12 pb-8 sm:flex-row sm:gap-6">
                        <Button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            variant="outline"
                            className={`w-full sm:w-auto flex h-12 sm:h-14 items-center justify-center rounded-full border-cyan-200 bg-white/70 px-4 sm:px-6 text-sm sm:text-lg font-semibold text-cyan-600 shadow-lg transition-all hover:bg-cyan-50 disabled:opacity-50 dark:border-cyan-900 dark:bg-gray-900/70 dark:text-cyan-400 dark:hover:bg-cyan-950`}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4 sm:h-6 sm:w-6" />
                            {t.previous}
                        </Button>
                        <span className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-lg font-bold text-gray-700 shadow-md whitespace-nowrap dark:border-cyan-900 dark:bg-cyan-900/70 dark:text-gray-300">
                            {t.pageOf.replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
                        </span>
                        <Button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            className={`w-full sm:w-auto flex h-12 sm:h-14 items-center justify-center rounded-full border-cyan-200 bg-white/70 px-4 sm:px-6 text-sm sm:text-lg font-semibold text-cyan-600 shadow-lg transition-all hover:bg-cyan-50 disabled:opacity-50 dark:border-cyan-900 dark:bg-gray-900/70 dark:text-cyan-400 dark:hover:bg-cyan-950`}
                        >
                            {t.next}
                            <ChevronRight className="ml-2 h-4 w-4 sm:h-6 sm:w-6" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

