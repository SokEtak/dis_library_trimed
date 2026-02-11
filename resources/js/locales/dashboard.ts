// resources/js/config/dashboard-cards.ts

import { useTranslation } from '@/locales/dashboard';
import {
    BookOpen,
    BookOpenText,
    AlertCircle,
    Book,
    Clock,
    Layers,
    Layers3,
    Boxes,
    Table,
    Package,
    PackageSearch,
    Share2,
    Truck,
    Users,
    ShieldCheck,
    ShieldAlert,
    GraduationCap,
    DoorOpen,
    MapPinHouse,
    Building2,
    Blocks,
} from 'lucide-react';

/**
 * Returns the full list of dashboard cards with translated titles & tooltips
 */
export const getDashboardCards = () => {
    const { t } = useTranslation();

    return [
        // ──────────────────────────────
        //     បណ្ណាល័យ / Library
        // ──────────────────────────────
        {
            title: t.totalBooks,
            value: (s: any) => (s.bookStats?.ebookCount ?? 0) + (s.bookStats?.physicalBookCount ?? 0),
            Icon: Book,
            href: route('books.index'),
            tooltip: t.viewAllBooks,
            colors: {
                bg: 'bg-violet-100 dark:bg-violet-900/50',
                border: 'border-violet-300 dark:border-violet-700',
                tooltipBg: 'bg-violet-600',
                tooltipArrow: 'fill-violet-600',
                icon: 'text-violet-600 dark:text-violet-400',
            },
        },
        {
            title: t.ebooksTotal,
            value: (s: any) => s.bookStats?.ebookCount ?? 0,
            Icon: BookOpen,
            href: route('books.index', { type: 'ebook' }),
            tooltip: t.viewAllEbooks,
            colors: {
                bg: 'bg-blue-100 dark:bg-blue-900/50',
                border: 'border-blue-300 dark:border-blue-700',
                tooltipBg: 'bg-blue-600',
                tooltipArrow: 'fill-blue-600',
                icon: 'text-blue-600 dark:text-blue-400',
            },
        },
        {
            title: t.physicalBooksTotal,
            value: (s: any) => s.bookStats?.physicalBookCount ?? 0,
            Icon: BookOpenText,
            href: route('books.index', { type: 'physical' }),
            tooltip: t.viewAllPhysicalBooks,
            colors: {
                bg: 'bg-green-100 dark:bg-green-900/50',
                border: 'border-green-300 dark:border-green-700',
                tooltipBg: 'bg-green-600',
                tooltipArrow: 'fill-green-600',
                icon: 'text-green-600 dark:text-green-400',
            },
        },
        {
            title: t.missingBooks,
            value: (s: any) => s.bookStats?.missingBookCount ?? 0,
            Icon: AlertCircle,
            href: route('books.index', { type: 'miss' }),
            tooltip: t.viewMissingBooks,
            colors: {
                bg: 'bg-yellow-100 dark:bg-yellow-900/50',
                border: 'border-yellow-300 dark:border-yellow-700',
                tooltipBg: 'bg-yellow-600',
                tooltipArrow: 'fill-yellow-600',
                icon: 'text-yellow-700 dark:text-yellow-300',
            },
        },
        {
            title: t.currentlyBorrowed,
            value: (s: any) => s.bookStats?.bookLoansCount ?? 0,
            Icon: Book,
            href: route('bookloans.index'),
            tooltip: t.viewAllLoans,
            colors: {
                bg: 'bg-purple-100 dark:bg-purple-900/50',
                border: 'border-purple-300 dark:border-purple-700',
                tooltipBg: 'bg-purple-600',
                tooltipArrow: 'fill-purple-600',
                icon: 'text-purple-600 dark:text-purple-400',
            },
        },
        {
            title: t.overdueLoans,
            value: (s: any) => s.bookStats?.overdueLoansCount ?? 0,
            Icon: Clock,
            href: route('bookloans.index', { overdue: 1 }),
            tooltip: t.viewOverdueLoans,
            colors: {
                bg: 'bg-red-100 dark:bg-red-900/50',
                border: 'border-red-300 dark:border-red-700',
                tooltipBg: 'bg-red-600',
                tooltipArrow: 'fill-red-600',
                icon: 'text-red-600 dark:text-red-400',
            },
        },

        // ──────────────────────────────
        //     ការគ្រប់គ្រងបណ្ណាល័យ / Library Management
        // ──────────────────────────────
        {
            title: t.categories,
            value: (s: any) => s.extraStats?.categoryCount ?? 0,
            Icon: Layers,
            href: route('categories.index'),
            tooltip: t.manageCategories,
            colors: {
                bg: 'bg-cyan-100 dark:bg-cyan-900/50',
                border: 'border-cyan-300 dark:border-cyan-700',
                tooltipBg: 'bg-cyan-600',
                tooltipArrow: 'fill-cyan-600',
                icon: 'text-cyan-600 dark:text-cyan-400',
            },
        },
        {
            title: t.subcategories,
            value: (s: any) => s.extraStats?.subcategoryCount ?? 0,
            Icon: Layers3,
            href: route('subcategories.index'),
            tooltip: t.manageSubcategories,
            colors: {
                bg: 'bg-teal-100 dark:bg-teal-900/50',
                border: 'border-teal-300 dark:border-teal-700',
                tooltipBg: 'bg-teal-600',
                tooltipArrow: 'fill-teal-600',
                icon: 'text-teal-600 dark:text-teal-400',
            },
        },
        {
            title: t.bookcases,
            value: (s: any) => s.extraStats?.bookcaseCount ?? 0,
            Icon: Boxes,
            href: route('bookcases.index'),
            tooltip: t.manageBookcases,
            colors: {
                bg: 'bg-amber-100 dark:bg-amber-900/50',
                border: 'border-amber-300 dark:border-amber-700',
                tooltipBg: 'bg-amber-600',
                tooltipArrow: 'fill-amber-600',
                icon: 'text-amber-700 dark:text-amber-400',
            },
        },
        {
            title: t.shelves,
            value: (s: any) => s.extraStats?.shelfCount ?? 0,
            Icon: Table,
            href: route('shelves.index'),
            tooltip: t.manageShelves,
            colors: {
                bg: 'bg-lime-100 dark:bg-lime-900/50',
                border: 'border-lime-300 dark:border-lime-700',
                tooltipBg: 'bg-lime-600',
                tooltipArrow: 'fill-lime-600',
                icon: 'text-lime-700 dark:text-lime-400',
            },
        },

        // ──────────────────────────────
        //     សម្ភារៈ / Assets
        // ──────────────────────────────
        // {
        //     title: t.totalAssets,
        //     value: (s: any) => s.assetStats?.totalAssets ?? 0,
        //     Icon: Package,
        //     href: route('assets.index'),
        //     tooltip: t.viewAllAssets,
        //     colors: {
        //         bg: 'bg-orange-100 dark:bg-orange-900/50',
        //         border: 'border-orange-300 dark:border-orange-700',
        //         tooltipBg: 'bg-orange-600',
        //         tooltipArrow: 'fill-orange-600',
        //         icon: 'text-orange-600 dark:text-orange-400',
        //     },
        // },
        // {
        //     title: t.assetCategories,
        //     value: (s: any) => s.extraStats?.assetCategoryCount ?? 0,
        //     Icon: PackageSearch,
        //     href: route('asset-categories.index'),
        //     tooltip: t.viewAssetCategories,
        //     colors: {
        //         bg: 'bg-rose-100 dark:bg-rose-900/50',
        //         border: 'border-rose-300 dark:border-rose-700',
        //         tooltipBg: 'bg-rose-600',
        //         tooltipArrow: 'fill-rose-600',
        //         icon: 'text-rose-600 dark:text-rose-400',
        //     },
        // },
        // {
        //     title: t.assetTransactions,
        //     value: (s: any) => s.extraStats?.assetTransactionCount ?? 0,
        //     Icon: Share2,
        //     href: route('asset-transactions.index'),
        //     tooltip: t.viewAssetTransactions,
        //     colors: {
        //         bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/50',
        //         border: 'border-fuchsia-300 dark:border-fuchsia-700',
        //         tooltipBg: 'bg-fuchsia-600',
        //         tooltipArrow: 'fill-fuchsia-600',
        //         icon: 'text-fuchsia-600 dark:text-fuchsia-400',
        //     },
        // },
        // {
        //     title: t.suppliers,
        //     value: (s: any) => s.extraStats?.supplierCount ?? 0,
        //     Icon: Truck,
        //     href: route('suppliers.index'),
        //     tooltip: t.viewSuppliers,
        //     colors: {
        //         bg: 'bg-slate-100 dark:bg-slate-800/50',
        //         border: 'border-slate-300 dark:border-slate-700',
        //         tooltipBg: 'bg-slate-600',
        //         tooltipArrow: 'fill-slate-600',
        //         icon: 'text-slate-600 dark:text-slate-400',
        //     },
        // },

        
        // ──────────────────────────────
        //     សាលារៀន & អគារ / Schools & Buildings
        // ──────────────────────────────
        {
            title: t.totalSchools,
            value: (s: any) => s.schoolStats?.totalSchools ?? 0,
            Icon: GraduationCap,
            href: route('schools.index'),
            tooltip: t.viewAllSchools,
            colors: {
                bg: 'bg-emerald-100 dark:bg-emerald-900/50',
                border: 'border-emerald-300 dark:border-emerald-700',
                tooltipBg: 'bg-emerald-600',
                tooltipArrow: 'fill-emerald-600',
                icon: 'text-emerald-600 dark:text-emerald-400',
            },
        },
        // {
        //     title: t.totalRooms,
        //     value: (s: any) => s.schoolStats?.totalRooms ?? 0,
        //     Icon: DoorOpen,
        //     href: route('rooms.index'),
        //     tooltip: t.viewAllRooms,
        //     colors: {
        //         bg: 'bg-indigo-100 dark:bg-indigo-900/50',
        //         border: 'border-indigo-300 dark:border-indigo-700',
        //         tooltipBg: 'bg-indigo-600',
        //         tooltipArrow: 'fill-indigo-600',
        //         icon: 'text-indigo-600 dark:text-indigo-400',
        //     },
        // },
        // {
        //     title: t.campuses,
        //     value: (s: any) => s.extraStats?.campusCount ?? 0,
        //     Icon: MapPinHouse,
        //     href: route('campuses.index'),
        //     tooltip: t.manageCampuses,
        //     colors: {
        //         bg: 'bg-sky-100 dark:bg-sky-900/50',
        //         border: 'border-sky-300 dark:border-sky-700',
        //         tooltipBg: 'bg-sky-600',
        //         tooltipArrow: 'fill-sky-600',
        //         icon: 'text-sky-600 dark:text-sky-400',
        //     },
        // },
        // {
        //     title: t.buildings,
        //     value: (s: any) => s.extraStats?.buildingCount ?? 0,
        //     Icon: Building2,
        //     href: route('buildings.index'),
        //     tooltip: t.manageBuildings,
        //     colors: {
        //         bg: 'bg-gray-100 dark:bg-gray-800/50',
        //         border: 'border-gray-300 dark:border-gray-700',
        //         tooltipBg: 'bg-gray-600',
        //         tooltipArrow: 'fill-gray-600',
        //         icon: 'text-gray-600 dark:text-gray-400',
        //     },
        // },
        // {
        //     title: t.departments,
        //     value: (s: any) => s.extraStats?.departmentCount ?? 0,
        //     Icon: Blocks,
        //     href: route('departments.index'),
        //     tooltip: t.manageDepartments,
        //     colors: {
        //         bg: 'bg-purple-100 dark:bg-purple-900/50',
        //         border: 'border-purple-300 dark:border-purple-700',
        //         tooltipBg: 'bg-purple-600',
        //         tooltipArrow: 'fill-purple-600',
        //         icon: 'text-purple-600 dark:text-purple-400',
        //     },
        // },
        // ──────────────────────────────
        //     អ្នកប្រើប្រាស់ & សិទ្ធិ (Admin Only)
        // ──────────────────────────────
        {
            title: t.totalUsers,
            value: (s: any) => s.userStats?.totalUsers ?? 0,
            Icon: Users,
            href: route('users.index'),
            tooltip: t.viewAllUsers,
            colors: {
                bg: 'bg-pink-100 dark:bg-pink-900/50',
                border: 'border-pink-300 dark:border-pink-700',
                tooltipBg: 'bg-pink-600',
                tooltipArrow: 'fill-pink-600',
                icon: 'text-pink-600 dark:text-pink-400',
            },
            showFor: ['admin'],
        },
        {
            title: t.roles,
            value: (s: any) => s.extraStats?.roleCount ?? 0,
            Icon: ShieldCheck,
            href: route('roles.index'),
            tooltip: t.manageRoles,
            colors: {
                bg: 'bg-red-100 dark:bg-red-900/50',
                border: 'border-red-300 dark:border-red-700',
                tooltipBg: 'bg-red-600',
                tooltipArrow: 'fill-red-600',
                icon: 'text-red-600 dark:text-red-400',
            },
            showFor: ['admin'],
        },
        {
            title: t.permissions,
            value: (s: any) => s.extraStats?.permissionCount ?? 0,
            Icon: ShieldAlert,
            href: route('permissions.index'),
            tooltip: t.managePermissions,
            colors: {
                bg: 'bg-violet-100 dark:bg-violet-900/50',
                border: 'border-violet-300 dark:border-violet-700',
                tooltipBg: 'bg-violet-600',
                tooltipArrow: 'fill-violet-600',
                icon: 'text-violet-600 dark:text-violet-400',
            },
            showFor: ['admin'],
        },
    ] as const;
};
