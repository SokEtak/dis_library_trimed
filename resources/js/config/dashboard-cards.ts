// resources/js/config/dashboard-cards.ts

import {
    BookOpen, BookOpenText, AlertCircle, Book, Clock,
    Layers, Layers3, Boxes, Table,
    Package, PackageSearch, Share2, Truck,
    Users, ShieldCheck, ShieldAlert,
    GraduationCap, DoorOpen, MapPinHouse, Building2, Blocks,
} from 'lucide-react';

export const dashboardCards = [
    // Library
    {
        title: 'សៀវភៅសរុប',
        value: (stats: any) => (stats.bookStats?.ebookCount ?? 0) + (stats.bookStats?.physicalBookCount ?? 0),
        Icon: BookOpen,
        href: route('books.index'),
        tooltip: 'សៀវភៅសរុប (អេឡិចត្រូនិក + រូបវន្ត)',
        colors: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', border: 'border-indigo-300 dark:border-indigo-700', tooltipBg: 'bg-indigo-600', tooltipArrow: 'fill-indigo-600', icon: 'text-indigo-600 dark:text-indigo-400' },
    },
    {
        title: 'សៀវភៅអេឡិចត្រូនិក',
        value: (stats: any) => stats.bookStats?.ebookCount ?? 0,
        Icon: BookOpen,
        href: route('books.index', { type: 'ebook' }),
        tooltip: 'មើលសៀវភៅអេឡិចត្រូនិកទាំងអស់',
        colors: { bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-300 dark:border-blue-700', tooltipBg: 'bg-blue-600', tooltipArrow: 'fill-blue-600', icon: 'text-blue-600 dark:text-blue-400' },
    },
    {
        title: 'សៀវភៅរូបវន្ត',
        value: (stats: any) => stats.bookStats?.physicalBookCount ?? 0,
        Icon: BookOpenText,
        href: route('books.index', { type: 'physical' }),
        tooltip: 'មើលសៀវភៅរូបវន្តទាំងអស់',
        colors: { bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-300 dark:border-green-700', tooltipBg: 'bg-green-600', tooltipArrow: 'fill-green-600', icon: 'text-green-600 dark:text-green-400' },
    },
    {
        title: 'សៀវភៅបោះបង់',
        value: (stats: any) => stats.bookStats?.trashBookCount ?? 0,
        Icon: AlertCircle,
        href: route('books.index', { type: 'del' }),
        tooltip: 'សៀវភៅដែលត្រូវបានបោះបង់',
        colors: { bg: 'bg-gray-200 dark:bg-gray-800/50', border: 'border-gray-400 dark:border-gray-700', tooltipBg: 'bg-gray-700', tooltipArrow: 'fill-gray-700', icon: 'text-gray-700 dark:text-gray-300' },
    },
    {
        title: 'សៀវភៅបាត់/មិនមាន',
        value: (stats: any) => stats.bookStats?.missingBookCount ?? 0,
        Icon: AlertCircle,
        href: route('books.index', { type: 'miss' }),
        tooltip: 'សៀវភៅដែលបាត់ ឬមិនមាននៅទូ',
        colors: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-300 dark:border-yellow-700', tooltipBg: 'bg-yellow-600', tooltipArrow: 'fill-yellow-600', icon: 'text-yellow-700 dark:text-yellow-300' },
    },
    {
    title: 'សៀវភៅបាត់',
    value: (stats: any) => stats.bookStats?.missingBookCount ?? 0,
    Icon: AlertCircle,
    href: route('books.index', { status: 'overdue' }),
    tooltip: 'សៀវភៅដែលបានខ្ចី ប៉ុន្តែមិនបានត្រឡប់វិញ',
    },

    
    {
        title: 'កំពុងខ្ចីសរុប',
        value: (stats: any) => stats.bookStats?.bookLoansCount ?? 0,
        Icon: Book,
        href: route('bookloans.index'),
        tooltip: 'សៀវភៅដែលកំពុងខ្ចីទាំងអស់',
        colors: { bg: 'bg-purple-100 dark:bg-purple-900/50', border: 'border-purple-300 dark:border-purple-700', tooltipBg: 'bg-purple-600', tooltipArrow: 'fill-purple-600', icon: 'text-purple-600 dark:text-purple-400' },
    },
    {
        title: 'ខ្ចីលើសកាលកំណត់',
        value: (stats: any) => stats.bookStats?.overdueLoansCount ?? 0,
        Icon: Clock,
        href: route('bookloans.index', { overdue: 1 }),
        tooltip: 'សៀវភៅដែលខ្ចីលើសកាលកំណត់',
        colors: { bg: 'bg-red-100 dark:bg-red-900/50', border: 'border-red-300 dark:border-red-700', tooltipBg: 'bg-red-600', tooltipArrow: 'fill-red-600', icon: 'text-red-600 dark:text-red-400' },
    },

    // Library Management
    {
        title: 'ប្រភេទសៀវភៅ',
        value: (stats: any) => stats.extraStats?.categoryCount ?? 0,
        Icon: Layers,
        href: route('categories.index'),
        tooltip: 'គ្រប់គ្រងប្រភេទសៀវភៅ',
        colors: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', border: 'border-cyan-300 dark:border-cyan-700', tooltipBg: 'bg-cyan-600', tooltipArrow: 'fill-cyan-600', icon: 'text-cyan-600 dark:text-cyan-400' },
    },
    {
        title: 'ប្រភេទរង',
        value: (stats: any) => stats.extraStats?.subcategoryCount ?? 0,
        Icon: Layers3,
        href: route('subcategories.index'),
        tooltip: 'គ្រប់គ្រងប្រភេទរង',
        colors: { bg: 'bg-teal-100 dark:bg-teal-900/50', border: 'border-teal-300 dark:border-teal-700', tooltipBg: 'bg-teal-600', tooltipArrow: 'fill-teal-600', icon: 'text-teal-600 dark:text-teal-400' },
    },
    {
        title: 'ទូរសៀវភៅ',
        value: (stats: any) => stats.extraStats?.bookcaseCount ?? 0,
        Icon: Boxes,
        href: route('bookcases.index'),
        tooltip: 'គ្រប់គ្រងទូរសៀវភៅ',
        colors: { bg: 'bg-amber-100 dark:bg-amber-900/50', border: 'border-amber-300 dark:border-amber-700', tooltipBg: 'bg-amber-600', tooltipArrow: 'fill-amber-600', icon: 'text-amber-700 dark:text-amber-400' },
    },
    {
        title: 'ធ្នើរ/ថតទូរ',
        value: (stats: any) => stats.extraStats?.shelfCount ?? 0,
        Icon: Table,
        href: route('shelves.index'),
        tooltip: 'គ្រប់គ្រងធ្នរ និងថតទូរ',
        colors: { bg: 'bg-lime-100 dark:bg-lime-900/50', border: 'border-lime-300 dark:border-lime-700', tooltipBg: 'bg-lime-600', tooltipArrow: 'fill-lime-600', icon: 'text-lime-700 dark:text-lime-400' },
    },

    // Admin Only
    {
        title: 'អ្នកប្រើប្រាស់សរុប',
        value: (stats: any) => stats.userStats?.totalUsers ?? 0,
        Icon: Users,
        href: route('users.index'),
        tooltip: 'មើលអ្នកប្រើប្រាស់ទាំងអស់',
        colors: { bg: 'bg-pink-100 dark:bg-pink-900/50', border: 'border-pink-300 dark:border-pink-700', tooltipBg: 'bg-pink-600', tooltipArrow: 'fill-pink-600', icon: 'text-pink-600 dark:text-pink-400' },
        showFor: ['admin'],
    },

    // School & Buildings
    {
        title: 'សាលារៀនសរុប',
        value: (stats: any) => stats.schoolStats?.totalSchools ?? 0,
        Icon: GraduationCap,
        href: route('schools.index'),
        tooltip: 'មើលសាលារៀនទាំងអស់',
        colors: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', border: 'border-emerald-300 dark:border-emerald-700', tooltipBg: 'bg-emerald-600', tooltipArrow: 'fill-emerald-600', icon: 'text-emerald-600 dark:text-emerald-400' },
    },
    // {
    //     title: 'បន្ទប់សរុប',
    //     value: (stats: any) => stats.schoolStats?.totalRooms ?? 0,
    //     Icon: DoorOpen,
    //     href: route('rooms.index'),
    //     tooltip: 'មើលបន្ទប់ទាំងអស់',
    //     colors: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', border: 'border-indigo-300 dark:border-indigo-700', tooltipBg: 'bg-indigo-600', tooltipArrow: 'fill-indigo-600', icon: 'text-indigo-600 dark:text-indigo-400' },
    // },
    {
        title: 'សាខា',
        value: (stats: any) => stats.extraStats?.campusCount ?? 0,
        Icon: MapPinHouse,
        href: route('campuses.index'),
        tooltip: 'គ្រប់គ្រងសាខា',
        colors: { bg: 'bg-sky-100 dark:bg-sky-900/50', border: 'border-sky-300 dark:border-sky-700', tooltipBg: 'bg-sky-600', tooltipArrow: 'fill-sky-600', icon: 'text-sky-600 dark:text-sky-400' },
    },
    // {
    //     title: 'អគារ',
    //     value: (stats: any) => stats.extraStats?.buildingCount ?? 0,
    //     Icon: Building2,
    //     href: route('buildings.index'),
    //     tooltip: 'គ្រប់គ្រងអគារ',
    //     colors: { bg: 'bg-gray-100 dark:bg-gray-800/50', border: 'border-gray-300 dark:border-gray-700', tooltipBg: 'bg-gray-600', tooltipArrow: 'fill-gray-600', icon: 'text-gray-600 dark:text-gray-400' },
    // },
    // {
    //     title: 'ការិយាល័យ',
    //     value: (stats: any) => stats.extraStats?.departmentCount ?? 0,
    //     Icon: Blocks,
    //     href: route('departments.index'),
    //     tooltip: 'គ្រប់គ្រងការិយាល័យ',
    //     colors: { bg: 'bg-purple-100 dark:bg-purple-900/50', border: 'border-purple-300 dark:border-purple-700', tooltipBg: 'bg-violet-600', tooltipArrow: 'fill-violet-600', icon: 'text-purple-600 dark:text-purple-400' },
    // },
] as const;
