'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { CheckCircle2Icon, X } from 'lucide-react';
import { Component, ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { translations } from '@/utils/translations/book/books';


interface Category {
    id: number;
    name: string;
}

interface SubCategory {
    id: number;
    name: string;
    category_id?: number;
}

interface Shelf {
    id: number;
    code: string;
}

interface Bookcase {
    id: number;
    code: string;
}

interface Grade {
    id: number;
    name: string;
}

interface Subject {
    id: number;
    name: string;
}

interface EditBook {
    id: number;
    title?: string | null;
    description?: string | null;
    page_count?: number | string | null;
    publisher?: string | null;
    language?: string | null;
    program?: string | null;
    published_at?: number | string | null;
    author?: string | null;
    flip_link?: string | null;
    code?: string | null;
    isbn?: string | null;
    view?: number | string | null;
    is_available?: boolean | null;
    downloadable?: boolean | null;
    type?: 'physical' | 'ebook' | null;
    category_id?: number | null;
    subcategory_id?: number | null;
    shelf_id?: number | null;
    bookcase_id?: number | null;
    grade_id?: number | null;
    subject_id?: number | null;
    cover?: string | null;
    pdf_url?: string | null;
}

interface BooksEditProps {
    book: EditBook;
    categories: Category[];
    subcategories?: SubCategory[];
    subcategory?: SubCategory[];
    shelves: Shelf[];
    bookcases: Bookcase[];
    grades: Grade[];
    subjects: Subject[];
    flash?: {
        message: string | null;
        error: string | null;
        warning: string | null;
    };
}

const t = translations.kh;

const breadcrumbs: BreadcrumbItem[] = [
    { title: t.go_back, href: route('books.index') },
    { title: 'កែប្រែ', href: '' },
];

// Error Boundary Component
interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            const t = translations.kh;
            return (
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-700 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">{t.somethingWentWrong}</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">{t.errorDescription}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            {t.tryAgain}
                        </Button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

interface FileFieldProps {
    label: string;
    id: string;
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    previewUrl?: string | null;
    onPreviewClick?: () => void;
    error?: string;
    helperText?: string;
    isDragDrop?: boolean;
    dragActive?: boolean;
    onDrag?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
    selectedFileName?: string;
    onRemove?: () => void;
    fileError?: string;
}

const FileField: React.FC<FileFieldProps> = ({
    label,
    id,
    accept,
    onChange,
    previewUrl,
    onPreviewClick,
    error,
    helperText,
    isDragDrop = false,
    dragActive = false,
    onDrag,
    onDrop,
    selectedFileName,
    onRemove,
    fileError,
}) => {
    const t = translations.kh;

    // Handle paste event for cover image field only
    useEffect(() => {
        if (id !== 'cover') return; // Restrict to cover field

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.match('image/(jpeg|png)')) {
                    const file = item.getAsFile();
                    if (!file) return;

                    // Validate file size (5MB limit)
                    if (file.size > 5 * 1024 * 1024) {
                        onChange({ target: { files: null } } as React.ChangeEvent<HTMLInputElement>);
                        return;
                    }

                    // Create synthetic event for existing onChange handler
                    const syntheticEvent = {
                        target: { files: [file] },
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                    break; // Process only the first valid image
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [id, onChange]);

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
            </Label>
            {isDragDrop ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={`mx-auto flex h-64 w-full max-w-md flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ${
                                    dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'
                                } ${error || fileError ? 'border-red-500 dark:border-red-400' : ''}`}
                                onDragEnter={onDrag}
                                onDragLeave={onDrag}
                                onDragOver={onDrag}
                                onDrop={onDrop}
                                role="region"
                                aria-label={`Drag and drop ${label.toLowerCase()} file`}
                            >
                                <Input
                                    id={id}
                                    type="file"
                                    accept={accept}
                                    name={id}
                                    onChange={onChange}
                                    className="hidden"
                                    aria-describedby={error || fileError ? `${id}-error` : undefined}
                                />
                                <div className="space-y-3">
                                    {selectedFileName ? (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Selected: {selectedFileName}{' '}
                                            {onRemove && (
                                                <Button
                                                    variant="link"
                                                    onClick={onRemove}
                                                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                    aria-label={`${t.remove} ${selectedFileName}`}
                                                >
                                                    {t.remove}
                                                </Button>
                                            )}
                                            {onPreviewClick && (
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onPreviewClick();
                                                    }}
                                                    className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    aria-label={`${t.preview} ${selectedFileName}`}
                                                >
                                                    {t.preview}
                                                </Button>
                                            )}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.pdfFilePlaceholder}</p>
                                    )}
                                    <Button
                                        type="button"
                                        onClick={() => document.getElementById(id)?.click()}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                        aria-label={t.browse}
                                    >
                                        {t.browse}
                                    </Button>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.pdfFilePlaceholder}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <div className="space-y-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`relative mx-auto flex h-64 w-full max-w-md cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-gray-100 transition-all duration-200 dark:bg-gray-700 ${
                                        error || fileError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                    } hover:border-indigo-500 dark:hover:border-indigo-400`}
                                    onClick={() => document.getElementById(id)?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            document.getElementById(id)?.click();
                                        }
                                    }}
                                >
                                    <Input
                                        id={id}
                                        type="file"
                                        accept={accept}
                                        name={id}
                                        onChange={onChange}
                                        className="hidden"
                                        aria-describedby={error || fileError ? `${id}-error` : undefined}
                                    />
                                    {previewUrl ? (
                                        <div className="relative h-full w-full">
                                            <img
                                                src={previewUrl}
                                                alt={`${t.cover} Preview`}
                                                className="h-full w-full object-contain"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPreviewClick?.();
                                                }}
                                            />
                                            {onRemove && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemove();
                                                    }}
                                                    aria-label={t.remove}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 sm:text-center dark:text-gray-400">{t.coverPlaceholder} (or Ctrl+V)</span>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                {t.coverPlaceholder} (or paste image with Ctrl+V)
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {(error || fileError) && (
                        <p id={`${id}-error`} className="text-center text-sm text-red-500 dark:text-red-400">
                            {error || fileError || t.coverError}
                        </p>
                    )}
                    {helperText && <p className="text-center text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
                </div>
            )}
        </div>
    );
};

export default function BooksEdit({
    book,
    categories: initialCategories,
    subcategories: initialSubcategories = [],
    subcategory: legacySubcategories = [],
    shelves: initialShelves,
    bookcases: initialBookcases,
    grades: initialGrades,
    subjects: initialSubjects,
    flash,
}: BooksEditProps) {


    const mergedSubcategories = initialSubcategories.length > 0 ? initialSubcategories : legacySubcategories;
    const [type, setType] = useState<'physical' | 'ebook'>((book.type as 'physical' | 'ebook') || 'physical');
    const isEbook = type === 'ebook';
    const categories = initialCategories;
    const subcategories = mergedSubcategories;
    const shelves = initialShelves;
    const bookcases = initialBookcases;
    const grades = initialGrades;
    const subjects = initialSubjects;
    const [pdfFileError, setPdfFileError] = useState<string | null>(null);
    const [coverFileError, setCoverFileError] = useState<string | null>(null);
    const [showErrorAlert, setShowErrorAlert] = useState(!!flash?.error);

    const { data, setData, post, processing, errors, setError } = useForm({
        //where to set initial form value
        title: book.title ?? '',
        description: book.description ?? '',
        page_count: book.page_count ? String(book.page_count) : '',
        publisher: book.publisher ?? '',
        language: book.language ?? 'kh',
        program: book.program ?? '',
        published_at: book.published_at ? String(book.published_at) : '',
        author: book.author ?? '',
        flip_link: book.flip_link ?? '',
        cover: null,
        code: book.code ?? '',
        isbn: book.isbn ?? '',
        view: book.view ? String(book.view) : '0',
        is_available: Boolean(book.is_available),
        pdf_url: null,
        category_id: book.category_id ? String(book.category_id) : '',
        subcategory_id: book.subcategory_id ? String(book.subcategory_id) : '',
        shelf_id: book.shelf_id ? String(book.shelf_id) : '',
        bookcase_id: book.bookcase_id ? String(book.bookcase_id) : '',
        grade_id: book.grade_id ? String(book.grade_id) : '',
        subject_id: book.subject_id ? String(book.subject_id) : '',
        downloadable: Boolean(book.downloadable),
        type,
        is_continue: true,
        _method: 'put',
    });

    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(book.cover ?? null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(book.pdf_url ?? null);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    // Add state to track if the form is dirty
    const [isFormDirty, setIsFormDirty] = useState(false);

    // Update dirty state whenever form data changes
    useEffect(() => {
        // Check if any form field has a value different from initial values
        const initialData = {
            title: book.title ?? '',
            description: book.description ?? '',
            page_count: book.page_count ? String(book.page_count) : '',
            publisher: book.publisher ?? '',
            language: book.language ?? 'kh',
            program: book.program ?? '',
            published_at: book.published_at ? String(book.published_at) : '',
            author: book.author ?? '',
            flip_link: book.flip_link ?? '',
            cover: null,
            code: book.code ?? '',
            isbn: book.isbn ?? '',
            view: book.view ? String(book.view) : '0',
            is_available: Boolean(book.is_available),
            pdf_url: null,
            category_id: book.category_id ? String(book.category_id) : '',
            subcategory_id: book.subcategory_id ? String(book.subcategory_id) : '',
            shelf_id: book.shelf_id ? String(book.shelf_id) : '',
            bookcase_id: book.bookcase_id ? String(book.bookcase_id) : '',
            grade_id: book.grade_id ? String(book.grade_id) : '',
            subject_id: book.subject_id ? String(book.subject_id) : '',
            downloadable: Boolean(book.downloadable),
            type,
            is_continue: true,
            _method: 'put',
        };

        const isDirty = Object.keys(data).some((key) => {
            if (key === 'cover' || key === 'pdf_url') {
                return data[key] !== null;
            }
            return data[key] !== initialData[key];
        });

        setIsFormDirty(isDirty);
    }, [book, data, type]);

    // Add beforeunload event listener for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isFormDirty && !processing) {
                // Standard message for most browsers
                e.preventDefault();
                e.returnValue = t.warning || 'មានការផ្លាស់ប្តូរដែលមិនទាន់រក្សាទុក។ តើអ្នកប្រាកដថាចង់ចាកចេញទេ?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isFormDirty, processing]);

    // Handle flash messages for toast notifications
    useEffect(() => {
        if (flash?.message) {
            toast(t.bookCreated, {
                description: new Date().toLocaleString('km-KH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                }),
                action: {
                    label: t.undo,
                    onClick: () => router.get(route('books.index')),
                },
            });
        }
        setShowErrorAlert(!!Object.keys(errors).length || !!flash?.error);
    }, [flash, errors]);

    useEffect(() => {
        return () => {
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        };
    }, [coverPreviewUrl, pdfPreviewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'pdf_url') => {
        const file = e.target.files?.[0];
        if (!file) {
            setData(field, null);
            if (field === 'cover') {
                setCoverPreviewUrl(null);
                setCoverFileError(null);
            } else {
                setPdfPreviewUrl(null);
                setPdfFileError(null);
            }
            return;
        }

        if (field === 'cover') {
            if (!file.type.match('image/(jpeg|png)')) {
                setData(field, null);
                e.target.value = '';
                setCoverFileError('Cover must be a valid JPEG or PNG image.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setData(field, null);
                e.target.value = '';
                setCoverFileError('Cover image must not exceed 5MB.');
                return;
            }
            setCoverFileError(null);
        }
        if (field === 'pdf_url') {
            if (file.type !== 'application/pdf') {
                setData(field, null);
                e.target.value = '';
                setPdfFileError(t.pdfFileError);
                setPdfPreviewUrl(null);
                return;
            }
            if (file.size > 30 * 1024 * 1024) {
                setData(field, null);
                e.target.value = '';
                setPdfFileError('ឯកសារ PDF លើស ៣០ មេកាបៃ។ សូមផ្ទុកឡើងឯកសារតូចជាង។');
                setPdfPreviewUrl(null);
                return;
            }
            setPdfFileError(null);
        }

        setData(field, file);
        const newUrl = URL.createObjectURL(file);
        if (field === 'cover') {
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            setCoverPreviewUrl(newUrl);
        } else {
            if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(newUrl);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) {
            setPdfFileError('គ្មានឯកសារត្រូវបានទម្លាក់។ សូមព្យាយាមម្តងទៀត។');
            return;
        }
        if (file.type !== 'application/pdf') {
            setPdfFileError(t.pdfFileError);
            setData('pdf_url', null);
            setPdfPreviewUrl(null);
            return;
        }
        if (file.size > 30 * 1024 * 1024) {
            setPdfFileError('ឯកសារ PDF លើស ៣០ មេកាបៃ។ សូមទម្លាក់ឯកសារតូចជាង។');
            setData('pdf_url', null);
            setPdfPreviewUrl(null);
            return;
        }
        setPdfFileError(null);
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        setData('pdf_url', file);
        setPdfPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedProgram = (data.program ?? '').trim();
        if (normalizedProgram !== '' && !['Cambodia', 'American'].includes(normalizedProgram)) {
            setError('program', 'Program must be Cambodia or American.');
            return;
        }
        if (isEbook && !data.pdf_url && !book.pdf_url) {
            setError('pdf_url', t.pdfFileError || 'Please upload a PDF file.');
            setPdfFileError(t.pdfFileError || 'Please upload a PDF file.');
            return;
        }
        // Build payload and omit file fields when they're null so the existing
        // cover/pdf on the server remain unchanged if the user didn't provide a new one.
        const payload: Partial<typeof data> = {};
        (Object.keys(data) as Array<keyof typeof data>).forEach((key) => {
            // If cover or pdf_url were left as null/undefined, don't include them
            // so the server retains the existing storage URL for those fields.
            const value = data[key];
            if ((key === 'cover' || key === 'pdf_url') && (value === null || value === undefined)) return;
            payload[key] = value;
        });

        post(route('books.update', book.id), {
            forceFormData: true,
            data: payload,
            onSuccess: () => {
                setShowErrorAlert(false);
            },
            onError: (errors) => {
                setShowErrorAlert(true);
                if (errors.code?.includes('unique')) {
                    alert(t.codeError + ' សូមបញ្ចូលកូដថ្មី។');
                }
            },
        });
    };

    const handleTypeChange = (newType: 'physical' | 'ebook') => {
        setType(newType);
        setData('type', newType);
    };

    return (
        <ErrorBoundary>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={isEbook ? 'កែប្រែសៀវភៅអេឡិចត្រូនិច' : 'កែប្រែសៀវភៅរូបវន្ត'} />
                <div className="max-w-auto p-2 sm:p-6 lg:p-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{isEbook ? 'កែប្រែសៀវភៅអេឡិចត្រូនិច' : 'កែប្រែសៀវភៅរូបវន្ត'}</h1>

                        {showErrorAlert && (Object.keys(errors).length > 0 || flash?.error) && (
                            <Alert className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-2">
                                        <CheckCircle2Icon className="h-5 w-5 text-red-500 dark:text-red-400" />
                                        <div>
                                            <AlertTitle className="text-red-600 dark:text-red-400">{t.error}</AlertTitle>
                                            <AlertDescription className="text-gray-600 dark:text-gray-300">
                                                {flash?.error || Object.values(errors).join(', ')}
                                            </AlertDescription>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setShowErrorAlert(false)}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        variant="ghost"
                                        size="sm"
                                        disabled={processing}
                                        aria-label="Dismiss error alert"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2" encType="multipart/form-data">
                            <input type="hidden" name="type" value={type} />

                            {/* Tabs for Physical/Ebook */}
                            <div className="col-span-full">
                                <div className="border-b border-gray-200 dark:border-gray-600">
                                    <nav className="flex space-x-4">
                                        {['physical', 'ebook', 'audio'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() =>
                                                    (tab === 'physical' || tab === 'ebook') && handleTypeChange(tab as 'physical' | 'ebook')
                                                }
                                                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                                    type === tab
                                                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                                        : tab === 'audio'
                                                          ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
                                                          : 'text-gray-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                                disabled={tab === 'audio'}
                                            >
                                                {t[tab as keyof typeof t]} 
                                                {tab === 'audio' && t.comingSoon}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="col-span-full">
                                <h2 className="mb-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{t.basicInformation}</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.title} <span className="text-red-500">*</span>
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="title"
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.title ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    required
                                                    aria-describedby={errors.title ? 'title-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.titlePlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.title && (
                                        <p id="title-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.title || t.titleError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.titleHelper}</p>
                                </div>
                                <div>
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.description}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <textarea
                                                    id="description"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.description
                                                            ? 'border-red-500 dark:border-red-400'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    } resize-y bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    rows={4}
                                                    aria-describedby={errors.description ? 'description-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                                {t.descriptionPlaceholder}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.description && (
                                        <p id="description-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.description || t.descriptionError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.descriptionHelper}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="page_count" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.pageCount} <span className="text-red-500">*</span>
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="page_count"
                                                    type="number"
                                                    value={data.page_count}
                                                    onChange={(e) => setData('page_count', e.target.value)}
                                                    min="1"
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.page_count
                                                            ? 'border-red-500 dark:border-red-400'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    required
                                                    aria-describedby={errors.page_count ? 'page_count-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.pageCountPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.page_count && (
                                        <p id="page_count-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.page_count || t.pageCountError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.pageCountHelper}</p>
                                </div>
                                <div>
                                    <Label htmlFor="publisher" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.publisher} <span className="text-red-500">*</span>
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="publisher"
                                                    value={data.publisher}
                                                    onChange={(e) => setData('publisher', e.target.value)}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.publisher
                                                            ? 'border-red-500 dark:border-red-400'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    required
                                                    aria-describedby={errors.publisher ? 'publisher-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.publisherPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.publisher && (
                                        <p id="publisher-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.publisher || t.publisherError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.publisherHelper}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.language} <span className="text-red-500">*</span>
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Select
                                                    value={data.language || undefined}
                                                    onValueChange={(value) => setData('language', value)}
                                                    required
                                                >
                                                    <SelectTrigger
                                                        className={`mt-1 w-full rounded-lg border ${
                                                            errors.language
                                                                ? 'border-red-500 dark:border-red-400'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                        aria-describedby={errors.language ? 'language-error' : undefined}
                                                    >
                                                        <SelectValue placeholder={t.languagePlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                        <SelectItem value="kh">ខ្មែរ</SelectItem>
                                                        <SelectItem value="en">English</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.languagePlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.language && (
                                        <p id="language-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.language || t.languageError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.languageHelper}</p>
                                </div>
                                <div>
                                    <Label htmlFor="published_at" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.publishedAt}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="published_at"
                                                    type="number"
                                                    value={data.published_at ?? ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '' || /^\d{1,4}$/.test(value)) {
                                                            setData('published_at', value);
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const value = e.target.value;
                                                        if (value !== '' && (parseInt(value) < 1000 || parseInt(value) > 2025)) {
                                                            setData('published_at_error', t.publishedAtError || 'ឆ្នាំត្រូវនៅចន្លោះ ១៦៦៦ និង ២៦២៥');
                                                        } else {
                                                            setData('published_at_error', undefined);
                                                        }
                                                    }}
                                                    min="1901"
                                                    max="2025"
                                                    placeholder={t.publishedAtPlaceholder}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.published_at
                                                            ? 'border-red-500 dark:border-red-400'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    aria-describedby={errors.published_at ? 'published_at-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                                {t.publishedAtPlaceholder}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.published_at && (
                                        <p id="published_at-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.published_at}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.publishedAtHelper}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="author" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.author}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="author"
                                                    value={data.author}
                                                    onChange={(e) => setData('author', e.target.value)}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.author ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    aria-describedby={errors.author ? 'author-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.authorPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.author && (
                                        <p id="author-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.author || t.authorError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.authorHelper}</p>
                                </div>
                                <div>
                                    <Label htmlFor="flip_link" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.flipLink}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="flip_link"
                                                    value={data.flip_link}
                                                    onChange={(e) => setData('flip_link', e.target.value)}
                                                    type="url"
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.flip_link
                                                            ? 'border-red-500 dark:border-red-400'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    aria-describedby={errors.flip_link ? 'flip_link-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.flipLinkPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.flip_link && (
                                        <p id="flip_link-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.flip_link || t.flipLinkError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.flipLinkHelper}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.code} <span className="text-red-500">*</span>
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    maxLength={10}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.code ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    // placeholder={t.codePlaceholder}
                                                    required
                                                    aria-describedby={errors.code ? 'code-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.codePlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.code && (
                                        <p id="code-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.code || t.codeError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.codeHelper}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="isbn" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.isbn}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="isbn"
                                                    value={data.isbn}
                                                    onChange={(e) => setData('isbn', e.target.value)}
                                                    maxLength={13}
                                                    className={`mt-1 w-full rounded-lg border ${
                                                        errors.isbn ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                    aria-describedby={errors.isbn ? 'isbn-error' : undefined}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.isbnPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.isbn && (
                                        <p id="isbn-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.isbn || t.isbnError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.isbnHelper}</p>
                                </div>
                            </div>

                            {/* <div className="col-span-full space-y-4">
                                <div>
                                    <Label htmlFor="program" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.program}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Select
                                                    value={data.program || undefined}
                                                    onValueChange={(value) => setData('program', value as 'Cambodia' | 'American')}
                                                >
                                                    <SelectTrigger
                                                        className={`mt-1 w-full rounded-lg border ${
                                                            errors.program
                                                                ? 'border-red-500 dark:border-red-400'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                        aria-describedby={errors.program ? 'program-error' : undefined}
                                                    >
                                                        <SelectValue placeholder={t.programPlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                        <SelectItem value="Cambodia">កម្ពុជា</SelectItem>
                                                        <SelectItem value="American">អាមេរិក</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.programPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.program && (
                                        <p id="program-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.program || t.programError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.programHelper}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {isEbook ? t.downloadable : t.availability} <span className="text-red-500">*</span>
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="mt-1 flex items-center space-x-6">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            id={isEbook ? 'downloadable-yes' : 'is_available-yes'}
                                                            name={isEbook ? 'downloadable' : 'is_available'}
                                                            checked={isEbook ? data.downloadable === true : data.is_available === true}
                                                            onChange={() => setData(isEbook ? 'downloadable' : 'is_available', true)}
                                                            className="h-4 w-4 border-gray-300 bg-gray-100 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
                                                            required
                                                            aria-describedby={
                                                                errors.is_available || errors.downloadable ? 'availability-error' : undefined
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={isEbook ? 'downloadable-yes' : 'is_available-yes'}
                                                            className="ml-2 text-sm text-gray-700 dark:text-gray-200"
                                                        >
                                                            {t.yes}
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            id={isEbook ? 'downloadable-no' : 'is_available-no'}
                                                            name={isEbook ? 'downloadable' : 'is_available'}
                                                            checked={isEbook ? data.downloadable === false : data.is_available === false}
                                                            onChange={() => setData(isEbook ? 'downloadable' : 'is_available', false)}
                                                            className="h-4 w-4 border-gray-300 bg-gray-100 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
                                                            aria-describedby={
                                                                errors.is_available || errors.downloadable ? 'availability-error' : undefined
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={isEbook ? 'downloadable-no' : 'is_available-no'}
                                                            className="ml-2 text-sm text-gray-700 dark:text-gray-200"
                                                        >
                                                            {t.no}
                                                        </Label>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                                {isEbook ? t.downloadableHelper : t.availabilityHelper}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {(errors.is_available || errors.downloadable) && (
                                        <p id="availability-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.is_available || errors.downloadable || t.availabilityError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        {isEbook ? t.downloadableHelper : t.availabilityHelper}
                                    </p>
                                </div>
                            </div> */}

                            {/* Classification */}
                            <div className="col-span-full">
                                <h2 className="mb-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{t.classification}</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.category} <span className="text-red-500">*</span>
                                     (<Link
                                        href={route('categories.create')}
                                        className="mt-1 inline-block text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        preserveState
                                        preserveScroll
                                    >
                                        {t.category} មិនមានទេ? ចុចទីនេះ
                                    </Link>)
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Select
                                                    value={data.category_id || undefined}
                                                    onValueChange={(value) => setData('category_id', value)}
                                                    required
                                                >
                                                    <SelectTrigger
                                                        className={`mt-1 w-full rounded-lg border ${
                                                            errors.category_id
                                                                ? 'border-red-500 dark:border-red-400'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                        aria-describedby={errors.category_id ? 'category-error' : undefined}
                                                    >
                                                        <SelectValue placeholder={t.categoryPlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                        {/* <SelectItem value="none">គ្មាន</SelectItem> */}
                                                        {categories.map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.categoryPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.category_id && (
                                        <p id="category-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.category_id || t.categoryError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.categoryHelper}</p>
                                </div>
                                <div>
                                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.grade}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Select
                                                    value={data.grade_id || undefined}
                                                    onValueChange={(value) => setData('grade_id', value || '')}
                                                >
                                                    <SelectTrigger
                                                        className={`mt-1 w-full rounded-lg border ${
                                                            errors.grade_id
                                                                ? 'border-red-500 dark:border-red-400'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                        aria-describedby={errors.grade_id ? 'grade-error' : undefined}
                                                    >
                                                        <SelectValue placeholder={t.gradePlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                        {/* <SelectItem value="none">គ្មាន</SelectItem> */}
                                                        {grades.map((grade) => (
                                                            <SelectItem key={grade.id} value={grade.id.toString()}>
                                                                {grade.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.gradePlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.grade_id && (
                                        <p id="grade-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.grade_id || t.gradeError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.gradeHelper}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.subcategory+" "}
                                        (<Link
                                        href={route('subcategories.create')}
                                        className="mt-1 inline-block text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        preserveState
                                        preserveScroll
                                        >
                                            {t.subcategory} មិនមានទេ? ចុចទីនេះ
                                        </Link>)
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Select
                                                    value={data.subcategory_id || undefined}
                                                    onValueChange={(value) => setData('subcategory_id', value || '')}
                                                >
                                                    <SelectTrigger
                                                        className={`mt-1 w-full rounded-lg border ${
                                                            errors.subcategory_id
                                                                ? 'border-red-500 dark:border-red-400'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                        aria-describedby={errors.subcategory_id ? 'subcategory-error' : undefined}
                                                    >
                                                        <SelectValue placeholder={t.subcategoryPlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                        {/* <SelectItem value="none">គ្មាន</SelectItem> */}
                                                        {(subcategories || [])
                                                            .filter((subcat) => {
                                                                // If SubCategory has category_id, filter by it; otherwise, show all
                                                                return subcat.category_id ? Number(data.category_id) === subcat.category_id : true;
                                                            })
                                                            .map((subcat) => (
                                                                <SelectItem key={subcat.id} value={subcat.id.toString()}>
                                                                    {subcat.name}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                                {t.subcategoryPlaceholder}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.subcategory_id && (
                                        <p id="subcategory-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.subcategory_id || t.subcategoryError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.subcategoryHelper}</p>
                                </div>
                                <div>
                                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.subject}
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Select
                                                    value={data.subject_id || undefined}
                                                    onValueChange={(value) => setData('subject_id', value === '' ? null : value)}
                                                >
                                                    <SelectTrigger
                                                        className={`mt-1 w-full rounded-lg border ${
                                                            errors.subject_id
                                                                ? 'border-red-500 dark:border-red-400'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                        aria-describedby={errors.subject_id ? 'subject-error' : undefined}
                                                    >
                                                        <SelectValue placeholder={t.subjectPlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                        {/* <SelectItem value="none">គ្មាន</SelectItem> */}
                                                        {subjects.map((subject) => (
                                                            <SelectItem key={subject.id} value={subject.id.toString()}>
                                                                {subject.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-lg bg-indigo-600 text-white">{t.subjectPlaceholder}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {errors.subject_id && (
                                        <p id="subject-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                            {errors.subject_id || t.subjectError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.subjectHelper}</p>
                                </div>
                            </div>

                            {/* Location (Physical Books Only) */}
                            {!isEbook && (
                                <>
                                    <div className="col-span-full">
                                        <h2 className="mb-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{t.location}</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="bookcase" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                {t.bookcase} <span className="text-red-500">*</span>
                                                (<Link
                                                href={route('bookcases.create')}
                                                className="mt-1 inline-block text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                preserveState
                                                preserveScroll
                                            >
                                                {t.bookcase} មិនមានទេ? ចុចទីនេះ
                                            </Link>)
                                            </Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Select
                                                            value={data.bookcase_id || undefined}
                                                            onValueChange={(value) => setData('bookcase_id', value || '')}
                                                            required
                                                        >
                                                            <SelectTrigger
                                                                className={`mt-1 w-full rounded-lg border ${
                                                                    errors.bookcase_id
                                                                        ? 'border-red-500 dark:border-red-400'
                                                                        : 'border-gray-300 dark:border-gray-600'
                                                                } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                                aria-describedby={errors.bookcase_id ? 'bookcase-error' : undefined}
                                                            >
                                                                <SelectValue placeholder={t.bookcasePlaceholder} />
                                                            </SelectTrigger>
                                                            <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                                {/* <SelectItem value="none">គ្មាន</SelectItem> */}
                                                                {bookcases.map((bookcase) => (
                                                                    <SelectItem key={bookcase.id} value={bookcase.id.toString()}>
                                                                        {bookcase.code}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                                        {t.bookcasePlaceholder}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            {errors.bookcase_id && (
                                                <p id="bookcase-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                                    {errors.bookcase_id || t.bookcaseError}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.bookcaseHelper}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="shelf" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                {t.shelf} <span className="text-red-500">*</span>
                                                (<Link
                                                    href={route('shelves.create')}
                                                    className="mt-1 inline-block text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    preserveState
                                                    preserveScroll
                                                >
                                                    {t.shelf} មិនមានទេ? ចុចទីនេះ
                                                </Link>)
                                            </Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Select
                                                            value={data.shelf_id || undefined}
                                                            onValueChange={(value) => setData('shelf_id', value || '')}
                                                            required
                                                        >
                                                            <SelectTrigger
                                                                className={`mt-1 w-full rounded-lg border ${
                                                                    errors.shelf_id
                                                                        ? 'border-red-500 dark:border-red-400'
                                                                        : 'border-gray-300 dark:border-gray-600'
                                                                } bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400`}
                                                                aria-describedby={errors.shelf_id ? 'shelf-error' : undefined}
                                                            >
                                                                <SelectValue placeholder={t.shelfPlaceholder} />
                                                            </SelectTrigger>
                                                            <SelectContent className="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                                                                {/* <SelectItem value="none">គ្មាន</SelectItem> */}
                                                                {shelves.map((shelf) => (
                                                                    <SelectItem key={shelf.id} value={shelf.id.toString()}>
                                                                        {shelf.code}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="rounded-lg bg-indigo-600 text-white">
                                                        {t.shelfPlaceholder}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            {errors.shelf_id && (
                                                <p id="shelf-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                                                    {errors.shelf_id || t.shelfError}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.shelfHelper}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Files */}
                            <div className="col-span-full">
                                <h2 className="mb-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{t.files}</h2>
                            </div>
                            <div className="space-y-4">
                                <FileField
                                    label={t.cover}
                                    id="cover"
                                    accept="image/jpeg,image/png"
                                    onChange={(e) => handleFileChange(e, 'cover')}
                                    previewUrl={coverPreviewUrl}
                                    onPreviewClick={() => setIsCoverModalOpen(true)}
                                    error={errors.cover}
                                    fileError={coverFileError}
                                    helperText={t.coverHelper}
                                    onRemove={() => {
                                        setData('cover', null);
                                        setCoverPreviewUrl(null);
                                        setCoverFileError(null);
                                    }}
                                    selectedFileName={data.cover?.name}
                                />
                            </div>
                            {isEbook && (
                                <div className="space-y-4">
                                    <FileField
                                        label={t.pdfFile}
                                        id="pdf_url"
                                        accept="application/pdf"
                                        onChange={(e) => handleFileChange(e, 'pdf_url')}
                                        previewUrl={pdfPreviewUrl}
                                        onPreviewClick={() => setIsPdfModalOpen(true)}
                                        error={errors.pdf_url}
                                        helperText={t.pdfFileHelper}
                                        isDragDrop
                                        dragActive={dragActive}
                                        onDrag={handleDrag}
                                        onDrop={handleDrop}
                                        selectedFileName={data.pdf_url?.name}
                                        onRemove={() => {
                                            setData('pdf_url', null);
                                            setPdfPreviewUrl(null);
                                            setPdfFileError(null);
                                        }}
                                        fileError={pdfFileError}
                                    />
                                    {/* PDF max size message below PDF area */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                                        {t.pdfMaxSize || 'PDF file must be less than 30MB.'}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons and Checkbox */}
                            <div className="col-span-full mt-6 flex items-center justify-between space-x-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_continue"
                                        checked={data.is_continue}
                                        onChange={(e) => setData('is_continue', e.target.checked)}
                                        className="h-4 w-4 border-gray-300 bg-gray-100 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
                                        aria-label={t.isContinue}
                                    />
                                    <Label htmlFor="is_continue" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {t.isContinue}
                                    </Label>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                        aria-label="Update book"
                                    >
                                        {processing ? 'កំពុងកែប្រែ...' : 'រក្សាទុក'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get(route('books.index'))}
                                        className="rounded-lg border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                        aria-label={t.returnToBooks}
                                    >
                                        {t.cancel}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Cover Preview Modal */}
                        <Dialog open={isCoverModalOpen} onOpenChange={setIsCoverModalOpen}>
                            <DialogContent className="max-w-4xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                <DialogHeader>
                                    <DialogTitle className="text-gray-900 dark:text-gray-100">{t.coverPreview}</DialogTitle>
                                </DialogHeader>
                                {coverPreviewUrl ? (
                                    <img src={coverPreviewUrl} alt={t.coverPreview} className="max-h-[70vh] w-full object-contain" />
                                ) : (
                                    <p className="text-gray-600 dark:text-gray-300">{t.noCoverAvailable}</p>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* PDF Preview Modal */}
                        {isEbook && (
                            <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                                <DialogContent className="max-w-8xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <DialogHeader>
                                        <DialogTitle className="text-gray-900 dark:text-gray-100">{t.pdfPreview}</DialogTitle>
                                    </DialogHeader>
                                    {pdfPreviewUrl ? (
                                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                            <div className="max-h-[70vh] overflow-auto">
                                                <Viewer fileUrl={pdfPreviewUrl} plugins={[defaultLayoutPluginInstance]} />
                                            </div>
                                        </Worker>
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-300">{t.noPdfAvailable}</p>
                                    )}
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </AppLayout>
        </ErrorBoundary>
    );
}
