import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowUpDown,
    BookOpen,
    CheckCircle2Icon,
    ChevronDown,
    ChevronUp,
    Columns2,
    Download,
    EyeIcon,
    EyeOff,
    Filter as FilterIcon,
    Library,
    Loader2,
    Pencil,
    Plus,
    Search,
    TrashIcon,
    Upload,
    X,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'សៀវភៅ',
        href: '/books',
    },
];

interface AuthUser {
    id: number;
    name: string;
    role_id: number;
}

interface CategoryOption {
    id: number;
    name: string;
}

interface SubjectOption {
    id: number;
    name: string;
}

interface BookcaseOption {
    id: number;
    code: string;
}

interface ShelfOption {
    id: number;
    code: string;
}

interface GradeOption {
    id: number;
    name: string;
}

interface CampusOption {
    id: number;
    name: string;
}

interface SubcategoryOption {
    id: number;
    name: string;
}

interface PageProps {
    flash: {
        error: unknown;
        message?: string;
    };
    books: Book[];
    availableCategories: CategoryOption[];
    availableSubcategories: SubcategoryOption[];
    availableSubjects: SubjectOption[];
    availableBookcases: BookcaseOption[];
    availableShelves: ShelfOption[];
    availableGrades: GradeOption[];
    availableCampuses: CampusOption[];
    isSuperLibrarian: boolean;
    auth: {
        user: AuthUser;
    };
}

interface Book {
    user: any;
    id: number;
    title: string;
    description: string;
    page_count: number;
    publisher: string;
    language: string;
    published_at: string | number | null;
    cover: string;
    pdf_url: string;
    flip_link: string;
    view: number;
    is_available: boolean;
    author: string;
    code: string;
    isbn: string;
    type: string;
    downloadable: boolean;
    category_id: number;
    subcategory_id: number;
    bookcase_id: number;
    shelf_id: number;
    subject_id: number;
    grade_id: number;
    campus_id: number;
    program: string;
    created_at: string;
    updated_at: string;
    category?: {
        id: number;
        name: string;
    };
    campus?: {
        id: number;
        name: string;
    };
    subcategory?: {
        id: number;
        name: string;
    };
    subject?: {
        id: number;
        name: string;
    };
    bookcase?: {
        id: number;
        code: string;
    };
    shelf?: {
        id: number;
        code: string;
    };
    grade?: {
        id: number;
        name: string;
    };
}

const getColumns = (
    setBookToDelete: React.Dispatch<React.SetStateAction<Book | null>>,
    processing: boolean,
    isSuperLibrarian: unknown,
    availableCategories: unknown,
    availableSubcategories: unknown,
    availableSubjects: unknown,
    availableBookcases: unknown,
    availableShelves: unknown,
    availableGrades: unknown,
    availableYears: string[],
    availableUsers: unknown,
    availableCampuses: string[],
    setRowModal: React.Dispatch<React.SetStateAction<Book | null>>,
): ColumnDef<Book>[] => {
    const getArrowColor = (sorted: string | false) => {
        if (sorted === 'asc') return 'text-blue-500';
        if (sorted === 'desc') return 'text-red-500';
        return 'text-gray-400';
    };

    return [
        {
            accessorKey: 'code',
            header: 'លេខកូដសម្គាល់',
            cell: ({ row }) => <div className="px-0">{row.getValue('code') || 'N/A'}</div>,
            enableHiding: true,
        },
        {
            accessorKey: 'title',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    ចំណងជើង
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div className="px-3">{row.getValue('title')}</div>,
        },
        {
            accessorKey: 'author',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    អ្នកនិពន្ធ
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div className="px-3">{row.getValue('author')}</div>,
        },
        // {
        //     accessorKey: 'cover',
        //     header: 'រូបក្រប',
        //     cell: ({ row }) =>
        //         row.getValue('cover') ? (
        //             //for local
        //             // <img src={'/storage/' + row.getValue('cover')} alt="Book cover" className="h-12 w-8 object-cover" />
        //             //for production
        //             <img src={row.getValue('cover')} alt="Book cover" className="h-12 w-8 object-fill" />
        //         ) : (
        //             <ImageOff className="h-10 w-8 text-red-500 dark:text-red-300" />
        //         ),
        //     enableSorting: false,
        //     enableHiding: true,
        // },
        // {
        //     accessorKey: 'description',
        //     header: 'ការពណ៌នា',
        //     cell: ({ row }) => <div className="max-w-xs truncate px-3">{row.getValue('description') || 'N/A'}</div>,
        //     enableHiding: true,
        // },
        {
            accessorKey: 'page_count',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    ចំនួនទំព័រ
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div className="px-4">{row.getValue('page_count') || 'N/A'}</div>,
            enableHiding: true,
        },
        {
            accessorKey: 'publisher',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    បោះពុម្ពផ្សាយ
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div className="px-6">{row.getValue('publisher') || 'N/A'}</div>,
            enableHiding: true,
        },
        {
            accessorKey: 'language',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <span>ភាសា</span>
                        <DropdownMenu open={isLanguageDropdownOpen} onOpenChange={setIsLanguageDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Language</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsLanguageDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="សូមជ្រើសរើសភាសា" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">ភាសាទាំងអស់</SelectItem>
                                        <SelectItem value="en">ភាសាអង់គ្លេស</SelectItem>
                                        <SelectItem value="kh">ភាសាខ្មែរ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => {
                const language = row.getValue('language');
                const displayLanguage = language === 'en' ? 'អង់គ្លេស' : language === 'kh' ? 'ខ្មែរ' : 'N/A';
                return <div className="px-0">{displayLanguage}</div>;
            },
            filterFn: (row, columnId, filterValue) => {
                const language = String(row.getValue(columnId)).toLowerCase();
                return filterValue === '' || language === filterValue.toLowerCase();
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: 'program',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                            កម្មវិធីសិក្សា
                        </Button>
                        <DropdownMenu open={isProgramDropdownOpen} onOpenChange={setIsProgramDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Program</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsProgramDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="ជ្រើសរើសកម្មវិធី" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">កម្មវិធីសិក្សាទាំងអស់</SelectItem>
                                        <SelectItem value="Cambodia">កម្មវិធីខ្មែរ</SelectItem>
                                        <SelectItem value="American">កម្មវិធីអាមេរិកកាំង</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => {
                const value = row.getValue('program');
                let label = 'N/A';

                if (value === 'Cambodia') {
                    label = value === 'Cambodia' ? 'កម្មវិធីខ្មែរ' : 'កម្មវិធីអង់គ្លេស';
                } else if (value === 'American') {
                    label = value === 'American' ? 'កម្មវិធីអាមេរិកកាំង' : 'កម្មវិធីអង់គ្លេស';
                }

                return <div className="px-4">{label}</div>;
            },
            filterFn: (row, columnId, filterValue) => {
                if (!filterValue || filterValue === 'All') return true;
                return String(row.getValue(columnId)).toLowerCase().includes(String(filterValue).toLowerCase());
            },
            sortingFn: (rowA, rowB, columnId) => {
                const valueA = String(rowA.getValue(columnId) || '').toLowerCase();
                const valueB = String(rowB.getValue(columnId) || '').toLowerCase();
                return valueA.localeCompare(valueB);
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'published_at',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isPublishedAtDropdownOpen, setIsPublishedAtDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                            ឆ្នាំបោះពុម្ព
                            {column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    </div>
                );
            },
            cell: ({ row }) => {
                const publishedAt = row.getValue('published_at');
                return <div className="px-6">{publishedAt ? publishedAt : 'N/A'}</div>;
            },
            filterFn: (row, columnId, filterValue) => {
                const filterYearString = String(filterValue);
                if (filterYearString === '' || filterYearString === 'All') {
                    return true;
                }
                const publishedAt = row.getValue(columnId);
                return String(publishedAt) === filterYearString;
            },
            sortingFn: (rowA, rowB, columnId) => {
                const valueA = rowA.getValue(columnId) || 0;
                const valueB = rowB.getValue(columnId) || 0;
                return Number(valueA) - Number(valueB);
            },
            enableSorting: true,
            enableHiding: true,
        },
        // {
        //     accessorKey: 'pdf_url',
        //     header: 'ឯកសារ(PDF)',
        //     cell: ({ row }) =>
        //         row.getValue('pdf_url') ? (
        //             // <a href={'/storage/' + row.getValue('pdf_url')} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
        //             <a href={row.getValue('pdf_url')} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
        //                 View PDF
        //             </a>
        //         ) : (
        //             <div className="px-3">N/A</div>
        //         ),
        //     enableSorting: false,
        //     enableHiding: true,
        // },
        // {
        //     accessorKey: 'flip_link',
        //     header: 'លីងសៀវភៅឌីជីថល',
        //     cell: ({ row }) =>
        //         row.getValue('flip_link') ? (
        //             <a href={row.getValue('flip_link')} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
        //                 View Flip
        //             </a>
        //         ) : (
        //             <div className="px-3">N/A</div>
        //         ),
        //     enableSorting: false,
        //     enableHiding: true,
        // },
        {
            accessorKey: 'view',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    ចំនួនអ្នកមើល
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div className="px-3">{row.getValue('view') || 0}</div>,
            enableHiding: true,
        },
        {
            accessorKey: 'is_available',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isAvailabilityDropdownOpen, setIsAvailabilityDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                            ស្ថានភាព
                        </Button>
                        <DropdownMenu open={isAvailabilityDropdownOpen} onOpenChange={setIsAvailabilityDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Availability</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsAvailabilityDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="ជ្រើសរើសស្ថានភាព" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">ទាំងអស់</SelectItem>
                                        <SelectItem value="true">មិនទាន់ខ្ចី</SelectItem>
                                        <SelectItem value="false">ត្រូវបានខ្ចី</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => (
                <div className="px-8">
                    {row.getValue('is_available') ? (
                        <EyeIcon className={'text-blue-500 dark:text-blue-300'} />
                    ) : (
                        <EyeOff className={'text-red-500 dark:text-red-300'} />
                    )}
                </div>
            ),
            filterFn: (row, columnId, filterValue) => {
                if (filterValue === '' || filterValue === 'All') {
                    return true;
                }
                // Convert boolean to string for comparison
                const isAvailable = row.getValue(columnId) ? 'true' : 'false';
                return isAvailable === filterValue;
            },
            sortingFn: (rowA, rowB) => {
                // Sort by boolean is_available: true (Available) comes before false (Not Available)
                const valueA = rowA.getValue('is_available') ? 1 : 0;
                const valueB = rowB.getValue('is_available') ? 1 : 0;
                return valueB - valueA; // true comes first in ascending order
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'isbn',
            header: 'ISBN',
            cell: ({ row }) => <div className="px-0">{row.getValue('isbn') || 'N/A'}</div>,
            enableHiding: true,
        },
        {
            accessorKey: 'type',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <span>ប្រភេទមាតិកា</span>
                        <DropdownMenu open={isTypeDropdownOpen} onOpenChange={setIsTypeDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Type</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsTypeDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="ប្រភេទមាតិកា" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">ប្រភេទមាតិកា​ទាំងអស់</SelectItem>
                                        <SelectItem value="physical">សៀវភៅរូបវន្ត</SelectItem>
                                        <SelectItem value="ebook">សៀវភៅឌីជីថល</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => {
                const type = row.getValue('type');
                const displayText = type === 'physical' ? 'សៀវភៅរូបវន្ត' : type === 'ebook' ? 'សៀវភៅឌីជីថល' : 'N/A';
                return <div className="px-2 capitalize">{displayText}</div>;
            },
            filterFn: (row, columnId, filterValue) => {
                if (filterValue === '' || filterValue === 'All') {
                    return true;
                }
                const rowValue = String(row.getValue(columnId)).toLowerCase();
                const filterLower = filterValue.toLowerCase();
                return rowValue === filterLower;
            },
            enableSorting: false,
            enableHiding: true,
        },
        // ...(isEbook?
        {
            accessorKey: 'downloadable',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isDownloadableDropdownOpen, setIsDownloadableDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <span>ទាញយក</span>
                        <DropdownMenu open={isDownloadableDropdownOpen} onOpenChange={setIsDownloadableDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Downloadable</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsDownloadableDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">ទាំងអស់</SelectItem>
                                        <SelectItem value="1">ទាញយកបាន</SelectItem>
                                        <SelectItem value="0">ទាញយកបានមិនបាន</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => (
                <div className="px-4">
                    {row.getValue('downloadable') === 1 ? (
                        <Download className={'text-blue-500 dark:text-blue-300'} />
                    ) : (
                        <Download className={'text-red-500 dark:text-red-300'} />
                    )}
                </div>
            ),
            filterFn: (row, columnId, filterValue) => {
                if (filterValue === '' || filterValue === 'All') {
                    return true;
                }
                return String(row.getValue(columnId)) === filterValue;
            },
            enableSorting: false,
            enableHiding: true,
        },
        // ...(isSuperLibrarian
        //     ? [
        //         {
        //             accessorKey: 'Posted By',
        //             header: ({ column }) => {
        //                 const filterValue = (column.getFilterValue() || '') as string;
        //                 const [isPostedByDropdownOpen, setIsPostedByDropdownOpen] = useState(false);
        //
        //                 return (
        //                     <div className="flex items-center space-x-2">
        //                         ចែកចាយដោយ
        //                         <DropdownMenu open={isPostedByDropdownOpen} onOpenChange={setIsPostedByDropdownOpen}>
        //                             <TooltipProvider>
        //                                 <Tooltip>
        //                                     <TooltipTrigger asChild>
        //                                         <DropdownMenuTrigger asChild>
        //                                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
        //                                                 {/*<FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />*/}
        //                                                 <span className="sr-only">Open filter menu</span>
        //                                             </Button>
        //                                         </DropdownMenuTrigger>
        //                                     </TooltipTrigger>
        //                                     <TooltipContent>Filter by Posted By</TooltipContent>
        //                                 </Tooltip>
        //                             </TooltipProvider>
        //                             <DropdownMenuContent align="start" className="w-[180px] p-2">
        //                                 <Select
        //                                     value={filterValue}
        //                                     onValueChange={(value) => {
        //                                         column.setFilterValue(value === 'All' ? '' : value);
        //                                         setIsPostedByDropdownOpen(false);
        //                                     }}
        //                                 >
        //                                     <SelectTrigger className="w-full">
        //                                         <SelectValue placeholder="Select User" />
        //                                     </SelectTrigger>
        //                                     <SelectContent>
        //                                         <SelectItem value="All">All Users</SelectItem>
        //                                         {availableUsers.map((userName) => (
        //                                             <SelectItem key={userName} value={userName}>
        //                                                 {userName}
        //                                             </SelectItem>
        //                                         ))}
        //                                     </SelectContent>
        //                                 </Select>
        //                             </DropdownMenuContent>
        //                         </DropdownMenu>
        //                     </div>
        //                 );
        //             },
        //             cell: ({ row }) => <div className="px-3">{row.original.user?.name || 'N/A'}</div>,
        //             filterFn: (row, columnId, filterValue) => {
        //                 const userName = row.original.user?.name?.toLowerCase() || '';
        //                 return filterValue === '' || userName.includes(String(filterValue).toLowerCase());
        //             },
        //             sortingFn: (rowA, rowB) => {
        //                 const nameA = rowA.original.user?.name?.toLowerCase() || '';
        //                 const nameB = rowB.original.user?.name?.toLowerCase() || '';
        //                 return nameA.localeCompare(nameB);
        //             },
        //             enableSorting: true,
        //             enableHiding: true,
        //         },
        //     ]
        //     : []),
        // {
        //     accessorKey: 'category',
        //     header: ({ column }) => {
        //         const filterValue = (column.getFilterValue() || '') as string;
        //         const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

        //         return (
        //             <div className="flex items-center space-x-2">
        //                 <span>ប្រភេទ</span>
        //                 <DropdownMenu open={isCategoryDropdownOpen} onOpenChange={setIsCategoryDropdownOpen}>
        //                     <TooltipProvider>
        //                         <Tooltip>
        //                             <TooltipTrigger asChild>
        //                                 <DropdownMenuTrigger asChild>
        //                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
        //                                         <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
        //                                         <span className="sr-only">Open filter menu</span>
        //                                     </Button>
        //                                 </DropdownMenuTrigger>
        //                             </TooltipTrigger>
        //                             <TooltipContent>Filter by Category</TooltipContent>
        //                         </Tooltip>
        //                     </TooltipProvider>
        //                     <DropdownMenuContent align="start" className="w-[180px] p-2">
        //                         <Select
        //                             value={filterValue}
        //                             onValueChange={(value) => {
        //                                 column.setFilterValue(value === 'All' ? '' : value);
        //                                 setIsCategoryDropdownOpen(false);
        //                             }}
        //                         >
        //                             <SelectTrigger className="w-full">
        //                                 <SelectValue placeholder="ជ្រើសរើសប្រភេទ" />
        //                             </SelectTrigger>
        //                             <SelectContent>
        //                                 <SelectItem value="All">ប្រភេទទាំងអស់</SelectItem>
        //                                 {availableCategories.map((category) => (
        //                                     <SelectItem key={category.id} value={category.name}>
        //                                         {category.name}
        //                                     </SelectItem>
        //                                 ))}
        //                             </SelectContent>
        //                         </Select>
        //                     </DropdownMenuContent>
        //                 </DropdownMenu>
        //             </div>
        //         );
        //     },
        //     cell: ({ row }) => <div className="px-2">{row.original.category?.name || 'N/A'}</div>,
        //     filterFn: (row, columnId, filterValue) => {
        //         const categoryName = row.original.category?.name?.toLowerCase() || '';
        //         return categoryName.includes(String(filterValue).toLowerCase());
        //     },
        //     enableSorting: false,
        // },
        {
            accessorKey: 'bookcase',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isBookcaseDropdownOpen, setIsBookcaseDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <span>ថត/ទូរ</span>
                        <DropdownMenu open={isBookcaseDropdownOpen} onOpenChange={setIsBookcaseDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Bookcase</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsBookcaseDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="ជ្រើសរើស" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">ទូរសៀវភៅទាំងអស់</SelectItem>
                                        {availableBookcases
                                            .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
                                            .map((bookcase) => (
                                                <SelectItem key={bookcase.id} value={bookcase.code}>
                                                    {bookcase.code || 'N/A'}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => <div className="px-3">{row.original.bookcase?.code || 'N/A'}</div>,
            filterFn: (row, columnId, filterValue) => {
                const bookcaseCode = row.original.bookcase?.code?.toLowerCase() || '';
                return filterValue === '' || bookcaseCode.includes(String(filterValue).toLowerCase());
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: 'shelf',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <span>លេខកូដធ្នើរ</span>
                        <DropdownMenu open={isShelfDropdownOpen} onOpenChange={setIsShelfDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Shelf</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsShelfDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="ជ្រើសរើស" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">ធ្នើរសៀវភៅទាំងអស់</SelectItem>
                                        {availableShelves
                                            .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
                                            .map((shelf) => (
                                                <SelectItem key={shelf.id} value={shelf.code}>
                                                    {shelf.code || 'N/A'}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => <div className="px-6">{row.original.shelf?.code || 'N/A'}</div>,
            filterFn: (row, columnId, filterValue) => {
                const shelfCode = row.original.shelf?.code?.toLowerCase() || '';
                return filterValue === '' || shelfCode.includes(String(filterValue).toLowerCase());
            },
            enableSorting: false,
            enableHiding: true,
        },
        // ...(isSuperLibrarian
        //     ? [
        //         {
        //             accessorKey: 'campus',
        //             header: ({ column }) => {
        //                 const filterValue = (column.getFilterValue() || '') as string;
        //                 const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);
        //
        //                 return (
        //                     <div className="flex items-center space-x-2">
        //                         <span>សាខា</span>
        //                         <DropdownMenu open={isCampusDropdownOpen} onOpenChange={setIsCampusDropdownOpen}>
        //                             <TooltipProvider>
        //                                 <Tooltip>
        //                                     <TooltipTrigger asChild>
        //                                         <DropdownMenuTrigger asChild>
        //                                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
        //                                                 {/*<FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />*/}
        //                                                 <span className="sr-only">Open filter menu</span>
        //                                             </Button>
        //                                         </DropdownMenuTrigger>
        //                                     </TooltipTrigger>
        //                                     <TooltipContent>Filter by Campuses</TooltipContent>
        //                                 </Tooltip>
        //                             </TooltipProvider>
        //                             <DropdownMenuContent align="start" className="w-[180px] p-2">
        //                                 <Select
        //                                     value={filterValue}
        //                                     onValueChange={(value) => {
        //                                         column.setFilterValue(value === 'All' ? '' : value);
        //                                         setIsCampusDropdownOpen(false);
        //                                     }}
        //                                 >
        //                                     <SelectTrigger className="w-full">
        //                                         <SelectValue placeholder="ជ្រើសរើសសាខា" />
        //                                     </SelectTrigger>
        //                                     <SelectContent>
        //                                         <SelectItem value="All">គ្រប់សាខា</SelectItem>
        //                                         {availableCampuses
        //                                             .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        //                                             .map((campus) => (
        //                                                 <SelectItem key={campus.id} value={campus.name}>
        //                                                     {campus.name || 'N/A'}
        //                                                 </SelectItem>
        //                                             ))}
        //                                     </SelectContent>
        //                                 </Select>
        //                             </DropdownMenuContent>
        //                         </DropdownMenu>
        //                     </div>
        //                 );
        //             },
        //             cell: ({ row }) => <div className="px-2">{row.original.campus?.name || 'N/A'}</div>,
        //             filterFn: (row, columnId, filterValue) => {
        //                 const campusName = row.original.campus?.name?.toLowerCase() || '';
        //                 return filterValue === '' || campusName.includes(String(filterValue).toLowerCase());
        //             },
        //             enableSorting: true,
        //             enableHiding: true,
        //         },
        //     ]
        //     : []),
        // {
        //     accessorKey: 'subcategory',
        //     header: ({ column }) => {
        //         const filterValue = (column.getFilterValue() || '') as string;
        //         const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
        //         const subcategories = Array.isArray(availableSubcategories) ? availableSubcategories : [];

        //         return (
        //             <div className="flex items-center space-x-2">
        //                 <span>ប្រភេទរង</span>
        //                 <DropdownMenu open={isSubcategoryDropdownOpen} onOpenChange={setIsSubcategoryDropdownOpen}>
        //                     <TooltipProvider>
        //                         <Tooltip>
        //                             <TooltipTrigger asChild>
        //                                 <DropdownMenuTrigger asChild>
        //                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
        //                                         <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
        //                                         <span className="sr-only">Open filter menu</span>
        //                                     </Button>
        //                                 </DropdownMenuTrigger>
        //                             </TooltipTrigger>
        //                             <TooltipContent>Filter by Subcategory</TooltipContent>
        //                         </Tooltip>
        //                     </TooltipProvider>
        //                     <DropdownMenuContent align="start" className="w-[180px] p-2">
        //                         <Select
        //                             value={filterValue}
        //                             onValueChange={(value) => {
        //                                 column.setFilterValue(value === 'All' ? '' : value);
        //                                 setIsSubcategoryDropdownOpen(false);
        //                             }}
        //                         >
        //                             <SelectTrigger className="w-full">
        //                                 <SelectValue placeholder="ប្រភេទរង" />
        //                             </SelectTrigger>
        //                             <SelectContent>
        //                                 <SelectItem value="All">All Subcategories</SelectItem>
        //                                 {subcategories.length > 0 ? (
        //                                     subcategories.map((subcategory) => (
        //                                         <SelectItem key={subcategory.id} value={subcategory.name}>
        //                                             {subcategory.name}
        //                                         </SelectItem>
        //                                     ))
        //                                 ) : (
        //                                     <SelectItem value="none" disabled>
        //                                         គ្មានប្រភេទរងសម្រាប់ជ្រើសរើស
        //                                     </SelectItem>
        //                                 )}
        //                             </SelectContent>
        //                         </Select>
        //                     </DropdownMenuContent>
        //                 </DropdownMenu>
        //             </div>
        //         );
        //     },
        //     cell: ({ row }) => <div className="px-2">{row.original.subcategory?.name || 'N/A'}</div>,
        //     filterFn: (row, columnId, filterValue) => {
        //         if (!filterValue || filterValue === 'All') return true;
        //         const subcategoryName = row.original.subcategory?.name?.toLowerCase() || '';
        //         return subcategoryName.includes(String(filterValue).toLowerCase());
        //     },
        //     enableSorting: false,
        //     enableHiding: true,
        // },
        {
            accessorKey: 'grade',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
                const grades = Array.isArray(availableGrades) ? availableGrades : [];

                return (
                    <div className="flex items-center space-x-2">
                        <span>កម្រិតថ្នាក់</span>
                        <DropdownMenu open={isGradeDropdownOpen} onOpenChange={setIsGradeDropdownOpen}>
                            {/*<TooltipProvider>*/}
                            {/*    <Tooltip>*/}
                            {/*        <TooltipTrigger asChild>*/}
                            {/*            <DropdownMenuTrigger asChild>*/}
                            {/*                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">*/}
                            {/*                    <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />*/}
                            {/*                    <span className="sr-only">Open filter menu</span>*/}
                            {/*                </Button>*/}
                            {/*            </DropdownMenuTrigger>*/}
                            {/*        </TooltipTrigger>*/}
                            {/*        <TooltipContent>Filter by Grade</TooltipContent>*/}
                            {/*    </Tooltip>*/}
                            {/*</TooltipProvider>*/}

                            {/*<DropdownMenuContent align="start" className="w-[180px] p-2">*/}
                            {/*    /!*<Select*!/*/}
                            {/*    /!*    value={filterValue}*!/*/}
                            {/*    /!*    onValueChange={(value) => {*!/*/}
                            {/*    /!*        column.setFilterValue(value === 'All' ? '' : value);*!/*/}
                            {/*    /!*        setIsGradeDropdownOpen(false);*!/*/}
                            {/*    /!*    }}*!/*/}
                            {/*    /!*>*!/*/}
                            {/*    /!*    <SelectTrigger className="w-full">*!/*/}
                            {/*    /!*        <SelectValue placeholder="ជ្រើសរើសកម្រិតថ្នាក់ថ្នាក់" />*!/*/}
                            {/*    /!*    </SelectTrigger>*!/*/}
                            {/*    /!*    <SelectContent>*!/*/}
                            {/*    /!*        <SelectItem value="All">កម្រិតថ្នាក់ថ្នាក់ទាំងអស់</SelectItem>*!/*/}
                            {/*    /!*        {grades.map((grade) => (*!/*/}
                            {/*    /!*            <SelectItem key={grade.id} value={grade.name}>*!/*/}
                            {/*    /!*                ថ្នាក់ទី {grade.name}*!/*/}
                            {/*    /!*            </SelectItem>*!/*/}
                            {/*    /!*        ))}*!/*/}
                            {/*    /!*    </SelectContent>*!/*/}
                            {/*    /!*</Select>*!/*/}
                            {/*</DropdownMenuContent>*/}
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => <div className="px-2">{row.original.grade?.name || 'N/A'}</div>,
            filterFn: (row, columnId, filterValue) => {
                const gradeName = row.original.grade?.name?.toLowerCase() || '';
                return gradeName.includes(String(filterValue).toLowerCase());
            },
            enableSorting: false,
        },
        {
            accessorKey: 'subject',
            header: ({ column }) => {
                const filterValue = (column.getFilterValue() || '') as string;
                const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

                return (
                    <div className="flex items-center space-x-2">
                        <span>មុខវិជ្ជា</span>
                        <DropdownMenu open={isSubjectDropdownOpen} onOpenChange={setIsSubjectDropdownOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
                                                <FilterIcon className={`h-4 w-4 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="sr-only">Open filter menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by Subject</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-[180px] p-2">
                                <Select
                                    value={filterValue}
                                    onValueChange={(value) => {
                                        column.setFilterValue(value === 'All' ? '' : value);
                                        setIsSubjectDropdownOpen(false);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="ជ្រើសរើសមុខវិជ្ជា" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">មុខវិជ្ជាទាំងអស់</SelectItem>
                                        {availableSubjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.name}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            cell: ({ row }) => <div className="px-2">{row.original.subject?.name || 'N/A'}</div>,
            filterFn: (row, columnId, filterValue) => {
                const subjectName = row.original.subject?.name?.toLowerCase() || '';
                return subjectName.includes(String(filterValue).toLowerCase());
            },
            enableSorting: false,
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    បង្កើតឡើងនៅ
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'));
                return (
                    <div className="px-2">
                        {isNaN(date.getTime())
                            ? 'N/A'
                            : date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  second: 'numeric',
                                  hour12: false,
                              })}
                    </div>
                );
            },
            enableHiding: true,
        },
        // {
        //     accessorKey: 'updated_at',
        //     header: ({ column }) => (
        //         <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        //             ថ្ងៃកែប្រែរ
        //             {column.getIsSorted() === 'asc' ? (
        //                 <ArrowUp className="ml-2 h-4 w-4" />
        //             ) : column.getIsSorted() === 'desc' ? (
        //                 <ArrowDown className="ml-2 h-4 w-4" />
        //             ) : (
        //                 <ArrowUpDown className="ml-2 h-4 w-4" />
        //             )}
        //         </Button>
        //     ),
        //     cell: ({ row }) => {
        //         const date = new Date(row.getValue('updated_at'));
        //         return (
        //             <div className="px-2">
        //                 {isNaN(date.getTime())
        //                     ? 'N/A'
        //                     : date.toLocaleDateString('en-US', {
        //                         year: 'numeric',
        //                         month: 'long',
        //                         day: 'numeric',
        //                         hour: 'numeric',
        //                         minute: 'numeric',
        //                         second: 'numeric',
        //                         hour12: false,
        //                     })}
        //             </div>
        //         );
        //     },
        //     enableHiding: true,
        // },
    ];
};

function BookIndex() {
    const {
        flash,
        books,
        isSuperLibrarian,
        availableCategories,
        availableSubcategories,
        availableSubjects,
        availableBookcases,
        availableShelves,
        availableGrades,
        availableCampuses,
    } = usePage<PageProps>().props;
    const [showAlert, setShowAlert] = useState<'success' | 'error' | null>(null);
    const { processing, delete: destroy, post: postForm } = useForm();
    const {
        setData: setImportData,
        post: postImport,
        processing: importProcessing,
        reset: resetImportForm,
    } = useForm<{ import_file: File | null }>({
        import_file: null,
    });
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [activeModalTab, setActiveModalTab] = useState('info');
    const [rowModal, setRowModal] = useState<Book | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<Book | null>(null);
    const [open, setOpen] = useState(false);
    const importFileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (flash?.message) {
            toast(flash.message, {
                description: new Date().toLocaleString('km-KH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                }),
                duration: 5000,
                ariaProps: {
                    role: 'status',
                    'aria-live': 'polite',
                },
            });
        }
    }, [flash]);

    const downloadPdf = async (book: Book | null) => {
        if (!book || !book.pdf_url) {
            toast.error('គ្មានឯកសារ PDF', { duration: 3000 });
            return;
        }

        try {
            const resp = await fetch(book.pdf_url, { method: 'GET' });
            if (!resp.ok) throw new Error('Network response was not ok');
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeName = (book.title || 'book').replace(/[^a-z0-9\-_. ]/gi, '_').slice(0, 120);
            a.href = url;
            a.download = `${safeName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ចាប់ផ្តើមការទាញយក', { duration: 3000 });
        } catch (error) {
            console.error(error);
            toast.error('ទាញយកមិនបាន', { duration: 4000 });
        }
    };

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        books.forEach((book) => {
            if (book.published_at) {
                years.add(String(book.published_at));
            }
        });
        // Add all years from 1000 to 2025
        for (let year = 1000; year <= 2025; year++) {
            years.add(year.toString());
        }
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [books]);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        description: false,
        page_count: false,
        publisher: false,
        language: true,
        program: false,
        pdf_url: false,
        flip_link: false,
        view: false,
        code: true,
        isbn: false,
        cover: true,
        type: true,
        downloadable: false,
        'Posted By': isSuperLibrarian,
        is_available: true,
        category: true,
        subcategory: false,
        subject: false,
        bookcase: true,
        shelf: true,
        grade: false,
        published_at: true,
        campus: isSuperLibrarian,
        created_at: false,
        updated_at: false,
    });
    const [rowSelection, setRowSelection] = useState({});
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [globalFilter, setGlobalFilter] = useState('');

    const availableUsers = useMemo(() => {
        const users = new Set<string>();
        books.forEach((book) => {
            if (book.user?.name) {
                users.add(book.user.name);
            }
        });
        return Array.from(users).sort();
    }, [books]);

    const columns = useMemo(
        () =>
            getColumns(
                setBookToDelete,
                processing,
                isSuperLibrarian,
                availableCategories,
                availableSubcategories,
                availableSubjects,
                availableBookcases,
                availableShelves,
                availableGrades,
                availableYears,
                availableCampuses,
                availableUsers,
                setRowModal,
            ),
        [
            setBookToDelete,
            processing,
            isSuperLibrarian,
            availableCategories,
            availableSubcategories,
            availableSubjects,
            availableBookcases,
            availableShelves,
            availableGrades,
            availableYears,
            availableCampuses,
            availableUsers,
            setRowModal,
        ],
    );

    const table = useReactTable({
        data: books,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            //specify sortable column
            const search = String(filterValue).toLowerCase();
            const title = String(row.original.title).toLowerCase();
            const code = String(row.original.code).toLowerCase();
            const isbn = String(row.original.isbn).toLowerCase();
            const author = String(row.original.author).toLowerCase();
            const description = String(row.original.description || '').toLowerCase();
            const campus = String(row.original.campus).toLowerCase();
            const postedBy = String(row.original.user?.name).toLowerCase();
            const flip_link = String(row.original.flip_link).toLowerCase();
            const created_at = String(row.original.created_at).toLowerCase();
            const updated_at = String(row.original.updated_at).toLowerCase();

            const publisher = String(row.original.publisher || '').toLowerCase();
            return (
                title.includes(search) ||
                publisher.includes(search) ||
                author.includes(search) ||
                code.includes(search) ||
                isbn.includes(search) ||
                description.includes(search) ||
                flip_link.includes(search) ||
                campus.includes(search) ||
                postedBy.includes(search) ||
                created_at.includes(search) ||
                updated_at.includes(search)
            );
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    useEffect(() => {
        if (flash.message) setShowAlert(true);
        const timer = setTimeout(() => {
            setIsTableLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [flash.message, books]);

    const handleCloseAlert = () => setShowAlert(false);

    const confirmDelete = () => {
        if (bookToDelete) {
            destroy(route('books.destroy', bookToDelete.id), {
                onSuccess: () => {
                    setBookToDelete(null);
                },
                onError: () => {
                    setBookToDelete(null);
                },
            });
        }
    };

    const confirmRestore = (book: Book | null) => {
        if (!book) return;
        postForm(route('books.restore', book.id), {
            onSuccess: () => {
                toast.success('Book restored');
            },
            onError: () => {
                toast.error('Failed to restore book');
            },
        });
    };

    const triggerImportPicker = () => {
        importFileInputRef.current?.click();
    };

    const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportData('import_file', file);
        postImport(route('books.import'), {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                resetImportForm();
                if (importFileInputRef.current) {
                    importFileInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="List of Books" />
            <div className="p-4 sm:p-6 lg:p-5 xl:p-2">
                {showAlert && (flash.message || flash.error) && (
                    <Alert
                        className={`mb-0 flex items-start justify-between ${
                            showAlert === 'error'
                                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
                                : 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                    >
                        <div className="flex gap-2">
                            <CheckCircle2Icon className="h-4 w-4" />
                            <div>
                                <AlertTitle>{showAlert === 'error' ? 'Error' : 'Success'}</AlertTitle>
                                <AlertDescription>{flash.message || flash.error}</AlertDescription>
                            </div>
                        </div>
                        <Button onClick={handleCloseAlert} className="cursor-pointer text-sm font-medium" disabled={processing}>
                            ×
                        </Button>
                    </Alert>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <input ref={importFileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFileChange} />

                    {/* Left: Search Input */}
                    <div className="relative flex items-center">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                            <Search className="h-4 w-4" />
                        </span>
                        <Input
                            placeholder="ស្វែងរក"
                            value={globalFilter ?? ''}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="max-w-2xl flex-grow pl-9 sm:max-w-4xl sm:flex-grow-0"
                            disabled={isTableLoading || processing}
                        />
                    </div>

                    {/* Center: Action Buttons Group */}
                    <div className="flex-1 flex justify-center">
                        <ButtonGroup orientation="horizontal">
                            {/* Column Visibility Dropdown */}
                            <DropdownMenu>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-8 rounded-lg border-blue-200 bg-white text-sm text-blue-600 hover:bg-indigo-50 dark:border-blue-600 dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-indigo-800"
                                                    disabled={isTableLoading || processing}
                                                >
                                                    <Columns2 className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                                            Column Visibility
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="center">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="text-sm capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                disabled={isTableLoading || processing}
                                            >
                                                {column.id.replace(/_/g, ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Import Button */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-8 rounded-lg border-blue-200 bg-white text-sm text-emerald-600 hover:bg-indigo-50 dark:border-blue-600 dark:bg-gray-700 dark:text-emerald-300 dark:hover:bg-indigo-800"
                                            disabled={isTableLoading || processing || importProcessing}
                                            onClick={triggerImportPicker}
                                        >
                                            {importProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                                        Import from CSV
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Export Button */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="h-8 rounded-lg border-blue-200 bg-white text-sm text-amber-600 hover:bg-indigo-50 dark:border-blue-600 dark:bg-gray-700 dark:text-amber-300 dark:hover:bg-indigo-800"
                                            disabled={isTableLoading || processing || importProcessing}
                                        >
                                            <a href={route('books.export')}>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                                        Export to CSV
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Add Button */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="h-8 rounded-lg border-blue-200 bg-white text-sm text-indigo-600 hover:bg-indigo-50 dark:border-blue-600 dark:bg-gray-700 dark:text-indigo-300 dark:hover:bg-indigo-800"
                                            disabled={isTableLoading || processing}
                                        >
                                            <Link href={route('books.create')}>
                                                <Plus className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                                        Add a new book
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Unified Library Button */}
                            <TooltipProvider>
                                <Tooltip>
                                    {/* Tooltip wraps only the button trigger */}
                                    <TooltipTrigger asChild>
                                        <DropdownMenu open={open} onOpenChange={setOpen}>
                                            <DropdownMenuTrigger asChild className={'transition:300 hover:cursor-pointer'}>
                                                <Button
                                                    variant="outline"
                                                    className="h-8 rounded-lg border-blue-200 bg-white text-sm text-cyan-600 hover:bg-indigo-50 dark:border-blue-600 dark:bg-gray-700 dark:text-cyan-300 dark:hover:bg-indigo-800"
                                                    disabled={isTableLoading || processing}
                                                    onMouseEnter={() => setOpen(true)}
                                                    onMouseLeave={() => setOpen(false)}
                                                >
                                                    ប្រភេទបណ្ណាល័យ
                                                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                className="rounded-lg shadow-md"
                                                onMouseEnter={() => setOpen(true)}
                                                onMouseLeave={() => setOpen(false)}
                                            >
                                                {/* <DropdownMenuItem asChild>
                                                        <Link href={route("global library")}> 
                                                            <div className="flex items-center">
                                                                <Globe className="h-4 w-4 mr-2 text-cyan-600" />
                                                                បណ្ណាល័យសកល
                                                            </div>
                                                        </Link>
                                                    </DropdownMenuItem> */}
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('local library')}>
                                                        <div className="flex items-center">
                                                            <Library className="mr-2 h-4 w-4 text-yellow-600" />
                                                            បណ្ណាល័យក្នុងរូបវន្ត
                                                        </div>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('global e-library')}>
                                                        <div className="flex items-center">
                                                            <BookOpen className="mr-2 h-4 w-4 text-rose-600" />
                                                            បណ្ណាល័យអេឡិចត្រូនិច
                                                        </div>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TooltipTrigger>

                                    <TooltipContent className="rounded-xl bg-gradient-to-br from-cyan-900 to-cyan-600 text-white">
                                        Choose between Global, Local, or E‑Library
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </ButtonGroup>
                    </div>

                    {/* Right: Filtered Books Count */}
                    <div className="flex items-center sm:justify-center">
                        <span className="text-sm font-medium">
                            ចំនួនសៀវភៅ {`${table.getFilteredRowModel().rows.length} ក្បាលនៃ ${books.length} ត្រូវបានរកឃើញ `}
                        </span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-blue-500 dark:border-blue-400">
                    {/* Animated Loader */}
                    {isTableLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="mb-2 h-10 w-10 animate-spin text-blue-500" />
                            <span className="text-blue-600 dark:text-blue-300">កំពុងផ្ទុក...</span>
                        </div>
                    ) : (
                        <>
                            {/* Responsive Card Layout for Mobile */}
                            <div className="block md:hidden">
                                {table.getRowModel().rows?.length ? (
                                    <div className="grid grid-cols-1 gap-4 p-2">
                                        {table.getRowModel().rows.map((row) => (
                                            <div
                                                key={row.id}
                                                className="relative flex cursor-pointer flex-col gap-2 rounded-xl border border-blue-200 bg-white p-4 shadow transition-all hover:shadow-lg dark:bg-gray-900"
                                                onClick={() => setRowModal(row.original)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <img
                                                        src={row.original.cover}
                                                        alt="Book cover"
                                                        className="h-28 w-20 flex-shrink-0 rounded border border-blue-100 object-cover"
                                                    />
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <div className="mb-1">
                                                            <span className="block truncate text-lg font-bold text-blue-700 dark:text-blue-200">
                                                                {row.original.title}
                                                            </span>
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {row.original.type && (
                                                                    <Badge
                                                                        className={
                                                                            row.original.type === 'ebook'
                                                                                ? 'bg-rose-500 text-white'
                                                                                : 'bg-blue-500 text-white'
                                                                        }
                                                                    >
                                                                        {row.original.type === 'ebook' ? 'ឌីជីថល' : 'រូបវន្ត'}
                                                                    </Badge>
                                                                )}
                                                                {row.original.is_available ? (
                                                                    <Badge className="bg-green-500 text-white">មាន</Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-500 text-white">ខ្ចីរួច</Badge>
                                                                )}
                                                                {row.original.downloadable ? (
                                                                    <Badge className="bg-yellow-500 text-white">អាចទាញយក</Badge>
                                                                ) : (
                                                                    <Badge className="bg-gray-500 text-white">មិនអាចទាញយក</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                                                            {row.original.description}
                                                        </div>
                                                        <div className="mt-3 flex justify-end gap-2">
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setRowModal(row.original);
                                                                }}
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Link href={route('books.edit', row.original.id)}><Button size="icon" variant="outline" className="h-7 w-7"><Pencil className="h-4 w-4" /></Button></Link>
                                                            {row.original.is_deleted ? (
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    className="h-7 w-7"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        confirmRestore(row.original);
                                                                    }}
                                                                >
                                                                    <ArrowLeft className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    className="h-7 w-7"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setBookToDelete(row.original);
                                                                    }}
                                                                >
                                                                    <TrashIcon className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-600 dark:text-gray-300">គ្មានទិន្នន័យ</div>
                                )}
                            </div>
                            {/* Table for Desktop */}
                            <div className="hidden max-h-[70vh] overflow-auto md:block">
                                <Table className="relative">
                                    <TableHeader className="sticky top-0 z-10 bg-blue-50 shadow dark:bg-blue-900">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <TableHead key={header.id} className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TooltipProvider key={row.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <TableRow
                                                                key={row.id}
                                                                className="cursor-pointer transition-all hover:bg-blue-100 hover:shadow-md dark:hover:bg-blue-900"
                                                                onMouseEnter={() => setHoveredRow(row.original)}
                                                                onMouseLeave={() => setHoveredRow(null)}
                                                                onClick={() => setRowModal(row.original)}
                                                            >
                                                                {row.getVisibleCells().map((cell) => (
                                                                    <TableCell
                                                                        key={cell.id}
                                                                        className="py-2 text-sm text-gray-800 dark:text-gray-100"
                                                                    >
                                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="py-2 text-center">
                                                                    <div className="flex justify-center gap-1">
                                                                        <Button
                                                                            size="icon"
                                                                            variant="outline"
                                                                            className="h-7 w-7"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setRowModal(row.original);
                                                                            }}
                                                                        >
                                                                            <EyeIcon className="h-4 w-4" />
                                                                        </Button>
                                                                        <Link href={route('books.edit', row.original.id)}><Button size="icon" variant="outline" className="h-7 w-7"><Pencil className="h-4 w-4" /></Button></Link>
                                                                        {row.original.is_deleted ? (
                                                                            <Button
                                                                                size="icon"
                                                                                variant="outline"
                                                                                className="h-7 w-7"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    confirmRestore(row.original);
                                                                                }}
                                                                            >
                                                                                <ArrowLeft className="h-4 w-4 text-green-600" />
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                size="icon"
                                                                                variant="outline"
                                                                                className="h-7 w-7"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setBookToDelete(row.original);
                                                                                }}
                                                                            >
                                                                                <TrashIcon className="h-4 w-4 text-red-500" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="max-w-md border-none">
                                                            {row.original.cover ? (
                                                                <img src={row.original.cover} alt="Book cover" className="h-66 w-40" />
                                                            ) : (
                                                                <span className="text-white dark:text-black">N/A</span>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={columns.length + 1}
                                                    className="h-24 text-center text-sm text-gray-600 dark:text-gray-300"
                                                >
                                                    គ្មានទិន្នន័យ
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}

                    {/* Big Modal on Row Click */}
                    {rowModal && (
                        <div
                            className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setRowModal(null);
                            }}
                        >
                            <div
                                className="pointer-events-auto h-auto max-h-[100vh] w-full max-w-[95vw] overflow-y-auto rounded-2xl border border-blue-300 bg-white p-3 shadow-2xl sm:max-w-lg sm:p-4 md:max-w-xl md:p-6 lg:max-w-2xl dark:border-blue-500 dark:bg-gray-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-2xl font-bold text-blue-700 dark:text-blue-200">{rowModal.title}</h2>
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="h-8 w-8 cursor-pointer rounded-full text-blue-700 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-700"
                                        onClick={() => setRowModal(null)}
                                        aria-label="Close modal"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="w-full">
                                    <TabsList className="mb-4 flex w-full flex-wrap justify-center gap-2">
                                        <TabsTrigger value="info">ពត៌មាន</TabsTrigger>
                                        <TabsTrigger value="classify">ចាត់ថ្នាក់</TabsTrigger>
                                        <TabsTrigger value="meta">ទិន្នន័យពិពណ៌នា</TabsTrigger>
                                        <TabsTrigger value="cover">ក្រប</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="info">
                                        <div className="space-y-2">
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">អ្នកនិពន្ធ:</strong> {rowModal.author || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ការពណ៌នា:</strong>{' '}
                                                {rowModal.description || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">បោះពុម្ពផ្សាយ:</strong>{' '}
                                                {rowModal.publisher || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ភាសា:</strong>{' '}
                                                {rowModal.language === 'en' ? 'អង់គ្លេស' : rowModal.language === 'kh' ? 'ខ្មែរ' : 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">កម្មវិធីសិក្សា:</strong>{' '}
                                                {rowModal.program === 'American'
                                                    ? 'អាមេរិកកាំង'
                                                    : rowModal.program === 'Cambodia'
                                                      ? 'កម្ពុជា'
                                                      : rowModal.program || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ចំនួនទំព័រសរុប:</strong>{' '}
                                                {rowModal.page_count || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ឆ្នាំបោះពុម្ព:</strong>{' '}
                                                {rowModal.published_at ? rowModal.published_at : 'N/A'}
                                            </p>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="classify">
                                        <div className="space-y-2">
                                            {/* <p><strong className="text-blue-600 dark:text-blue-300">ប្រភេទ:</strong> {rowModal.category ? (<Link href={route('categories.show', rowModal.category.id)} className="text-blue-500 underline hover:text-blue-700 dark:text-blue-200 dark:hover:text-blue-100">{rowModal.category.name}</Link>) : 'N/A'}</p>
                                                <p><strong className="text-blue-600 dark:text-blue-300">ប្រភេទរង:</strong> {rowModal.subcategory ? (<Link href={route('subcategories.show', rowModal.subcategory.id)} className="text-blue-500 underline hover:text-blue-700 dark:text-blue-200 dark:hover:text-blue-100">{rowModal.subcategory.name}</Link>) : 'N/A'}</p> */}
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">កម្រិតថ្នាក់:</strong>{' '}
                                                {rowModal.grade?.name || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">មុខវិជ្ជា:</strong>{' '}
                                                {rowModal.subject?.name || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">លេដកូដធ្នើរ:</strong>{' '}
                                                {rowModal.shelf ? (
                                                    <Link
                                                        href={route('shelves.show', rowModal.shelf.id)}
                                                        className="text-blue-500 underline hover:text-blue-700 dark:text-blue-200 dark:hover:text-blue-100"
                                                    >
                                                        {rowModal.shelf.code}
                                                    </Link>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">លេដកូដទូរសៀវភៅ:</strong>{' '}
                                                {rowModal.bookcase ? (
                                                    <Link
                                                        href={route('bookcases.show', rowModal.bookcase.id)}
                                                        className="text-blue-500 underline hover:text-blue-700 dark:text-blue-200 dark:hover:text-blue-100"
                                                    >
                                                        {rowModal.bookcase.code}
                                                    </Link>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </p>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="meta">
                                        <div className="space-y-2">
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ISBN:</strong> {rowModal.isbn || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">លេខកូដសៀវភៅ:</strong> {rowModal.code || 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ប្រភេទមាតិកា:</strong>{' '}
                                                {rowModal.type === 'physical'
                                                    ? 'រូបវន្ត'
                                                    : rowModal.type === 'ebook'
                                                      ? 'អេឡិចត្រូនិក'
                                                      : rowModal.type || 'N/A'}
                                            </p>
                                            {/* Show status only for physic books */}
                                            {rowModal.type === 'physic' && (
                                                <p>
                                                    <strong className="text-blue-600 dark:text-blue-300">ស្ថានភាព:</strong>{' '}
                                                    {rowModal.is_available ? 'មិនទាន់បានខ្ចី' : 'បានខ្ចី'}
                                                </p>
                                            )}
                                            {/* Show download permission only for ebook */}
                                            {rowModal.type === 'ebook' && (
                                                <p>
                                                    <strong className="text-blue-600 dark:text-blue-300">អនុញ្ញាតអោយទាញយក:</strong>{' '}
                                                    {rowModal.downloadable ? 'បាន' : 'មិនបាន'}
                                                </p>
                                            )}
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">ចំនួនអ្នកទស្សានា:</strong> {rowModal.view || 0}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">បង្កើតឡើងនៅ:</strong>{' '}
                                                {rowModal.created_at
                                                    ? new Date(rowModal.created_at).toLocaleDateString('en-US', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                          second: 'numeric',
                                                          hour12: false,
                                                      })
                                                    : 'N/A'}
                                            </p>
                                            <p>
                                                <strong className="text-blue-600 dark:text-blue-300">បានកែប្រែនៅ:</strong>{' '}
                                                {rowModal.updated_at
                                                    ? new Date(rowModal.updated_at).toLocaleDateString('en-US', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                          second: 'numeric',
                                                          hour12: false,
                                                      })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="cover">
                                        <div className="flex flex-col items-center gap-2">
                                            {rowModal.cover ? (
                                                <img
                                                    src={rowModal.cover}
                                                    alt="Book cover"
                                                    className="h-80 w-56 rounded border border-blue-300 object-cover shadow"
                                                />
                                            ) : (
                                                <span className="text-gray-500">គ្មានរូបភាព</span>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <div className="mt-6 flex justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border-blue-300 bg-white text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-blue-700"
                                        onClick={() => {
                                            if (!rowModal.flip_link) return;
                                            try {
                                                window.open(rowModal.flip_link, '_blank', 'noopener,noreferrer');
                                            } catch (e) {
                                                // fallback for very old browsers
                                                const a = document.createElement('a');
                                                a.href = rowModal.flip_link;
                                                a.target = '_blank';
                                                a.rel = 'noopener noreferrer';
                                                a.click();
                                            }
                                        }}
                                        aria-label="Open reader in new tab"
                                        disabled={!rowModal.flip_link}
                                    >
                                        <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">ចាប់ផ្តើមអាន</span>
                                    </Button>
                                    {rowModal.pdf_url && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:bg-gray-800 dark:text-yellow-200 dark:hover:bg-yellow-700"
                                            onClick={() => setPdfPreviewUrl(rowModal.pdf_url)}
                                        >
                                            <EyeIcon className="h-4 w-4" /> <span className="hidden sm:inline">មើលជាមុន</span>
                                        </Button>
                                    )}
                                    <Link href={route('books.edit', rowModal.id)}>
                                            <Button variant="outline" size="sm" className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border-blue-300 bg-white text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-blue-700">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    {rowModal.pdf_url && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border-green-300 bg-white text-green-700 hover:bg-green-100 dark:border-green-500 dark:bg-gray-800 dark:text-green-200 dark:hover:bg-green-700"
                                            onClick={() => downloadPdf(rowModal)}
                                        >
                                            <Download className="h-4 w-4" /> <span className="hidden sm:inline">ទាញយក</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border-red-300 bg-white text-red-600 hover:bg-red-100 dark:border-red-500 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-700"
                                        onClick={() => {
                                            setBookToDelete(rowModal);
                                            setRowModal(null);
                                        }}
                                    >
                                        <TrashIcon className="h-4 w-4" /> <span className="hidden sm:inline">លុប</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    {pdfPreviewUrl && (
                        <div
                            className="bg-opacity-80 fixed inset-0 z-60 flex items-center justify-center bg-black"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setPdfPreviewUrl(null);
                            }}
                        >
                            <div className="relative h-full max-h-[95vh] w-full max-w-[95vw] overflow-hidden rounded bg-white shadow-lg dark:bg-gray-900">
                                <div className="pointer-events-auto absolute top-3 right-3 z-50">
                                    {/* <Button size="icon" variant="ghost" onClick={() => setPdfPreviewUrl(null)} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
                                            <X className="h-4 w-4" />
                                        </Button> */}
                                </div>
                                <iframe src={pdfPreviewUrl} className="z-10 h-full w-full" title="PDF Preview" />
                            </div>
                        </div>
                    )}
                </div>
                {/* Pagination Controls at Bottom */}
                <div
                    className={`flex w-full items-center justify-center gap-4 border-t py-4 ${table.getState().pagination.pageSize >= 10 ? 'sticky bottom-0 z-40' : ''}`}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100">ចំនួនសៀវភៅក្នុងមួយទំព័រ:</span>
                            <Select
                                value={String(table.getState().pagination.pageSize)}
                                onValueChange={(value) => {
                                    if (value === 'All') {
                                        table.setPageSize(table.getFilteredRowModel().rows.length);
                                    } else {
                                        table.setPageSize(Number(value));
                                    }
                                }}
                                disabled={isTableLoading || processing}
                            >
                                <SelectTrigger className="h-8 w-[120px] rounded-lg border-blue-200 bg-white text-sm text-gray-800 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100">
                                    <SelectValue placeholder={String(table.getState().pagination.pageSize)} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`} className="text-sm">
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                    {table.getFilteredRowModel().rows.length > 0 && (
                                        <SelectItem key="all" value="All" className="text-sm">
                                            ទាំងអស់
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage() || isTableLoading || processing}
                                            className="rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-blue-800"
                                        >
                                            <ArrowLeft className={`h-4 w-4 ${table.getCanPreviousPage() ? 'text-blue-500' : 'text-gray-400'}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                                        ទំព័រមុន
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage() || isTableLoading || processing}
                                            className="rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-blue-800"
                                        >
                                            <ArrowRight className={`h-4 w-4 ${table.getCanNextPage() ? 'text-blue-500' : 'text-gray-400'}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                                        ទំព័របន្ទាប់
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-100">
                            ទំព័រ {table.getState().pagination.pageIndex + 1} នៃ {table.getPageCount()}
                        </div>
                    </div>
                </div>

                <AlertDialog open={!!bookToDelete} onOpenChange={(openState) => !openState && setBookToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>ពិតប្រាកដឬ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                សកម្មភាពនេះមុនអាចត្រឡប់វិញបាននុះទេ ហើយវានឹងលុបសៀវភៅ<strong>{bookToDelete?.title}</strong> ជានិរន្ន
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setBookToDelete(null)}>បធិសេធ</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} disabled={processing}>
                                បន្ត
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}

export default BookIndex;
