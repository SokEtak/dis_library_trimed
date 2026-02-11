//own create file
import {
    LayoutDashboard,
    Book,
    BookOpenCheck,
    Layers,
    Layers3,
    Boxes,
    Table,
    Users,
    ShieldCheck,
    ShieldAlert,
    GraduationCap,
    MapPinHouse,
    Building2,
    Blocks,
    DoorOpen,
    Package,
    PackageSearch,
    Share2,
    Truck,
    NotepadText,
    BookPlus,
    BookOpenText,
    BookOpen,
    BookX,
    ShieldPlus,
    UserRound,
    UserRoundPlus,
    PackagePlus,
    Ambulance,
} from 'lucide-react';

export interface NavItem {
    title: string;
    url?: string;
    icon?: any;
    iconColor?: string;
    children?: NavItem[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const globalNav: NavItem[] = [
    {
        title: "ផ្ទាំងកិច្ចការ",
        url: route("dashboard"),
        icon: LayoutDashboard,
        iconColor: "text-sky-500",
    },
];

export const navGroups: NavGroup[] = [
    {
        label: "បណ្ណាល័យ",
        items: [
            {
                title: "សៀវភៅ",
                url: route("books.index"),
                icon: Book,
                iconColor: "text-green-500",
                children: [
                    {
                        title: "អេឡិចត្រូនិក",
                        url: route("books.index", { type: "ebook" }),
                        icon: BookOpen,
                        iconColor: "text-orange-600",
                    },
                    {
                        title: "សៀវភៅរូបវន្ត",
                        url: route("books.index", { type: "physical" }),
                        icon: BookOpenText,
                        iconColor: "text-orange-600",
                    },
                    {
                        title: "សៀវភៅបោះបង់",
                        url: route("books.index", { type: "del" }),
                        icon: BookX,
                        iconColor: "text-orange-600",
                    },
                    {
                        title: "សៀវភៅកំពុងខ្ចី",
                        url: route("bookloans.index", { status: "processing" }),
                        icon: BookOpenCheck,
                        iconColor: "text-orange-600",
                    },
                    {
                        title: "បន្ថែមសៀវភៅ",
                        url: route("books.create"),
                        icon: BookPlus,
                        iconColor: "text-blue-600",
                    },
                ],
            },
            {
                title: "កម្ចីសៀវភៅ",
                url: route("bookloans.index"),
                icon: BookOpenCheck,
                iconColor: "text-blue-500",
                children: [
                    {
                        title: "បន្ថែមកម្ចីសៀវភៅ",
                        url: route("bookloans.create"),
                        icon: BookOpenCheck,
                        iconColor: "text-orange-600",
                    },
                ],
            },
            {
                title: "ប្រភេទ",
                url: route("categories.index"),
                icon: Layers,
                iconColor: "text-purple-500",
                children: [
                    {
                        title: "បន្ថែមប្រភេទ",
                        url: route("categories.create"),
                        icon: BookOpenCheck,
                        iconColor: "text-orange-600",
                    },
                ],
            },
            {
                title: "ប្រភេទរង",
                url: route("subcategories.index"),
                icon: Layers3,
                iconColor: "text-indigo-500",
                children: [
                    {
                        title: "បន្ថែមប្រភេទរង",
                        url: route("subcategories.create"),
                        icon: BookOpenCheck,
                        iconColor: "text-orange-600",
                    },
                ],
            },
            {
                title: "ទូរសៀវភៅ",
                url: route("bookcases.index"),
                icon: Boxes,
                iconColor: "text-yellow-500",
                children: [
                    {
                        title: "បន្ថែមទូរសៀវភៅ",
                        url: route("bookcases.create"),
                        icon: BookOpenCheck,
                        iconColor: "text-orange-600",
                    },
                ],
            },
            {
                title: "ធ្នើរ/ថតទូរ",
                url: route("shelves.index"),
                icon: Table,
                iconColor: "text-teal-500",
                children: [
                    {
                        title: "បន្ថែមថតសៀវភៅ",
                        url: route("shelves.create"),
                        icon: BookOpenCheck,
                        iconColor: "text-orange-600",
                    },
                ],
            },
           
            {
                title: "អ្នកប្រើប្រាស់",
                url: route("users.index"),
                icon: UserRound,
                iconColor: "text-orange-500",
                children: [
                    {
                        title: "បន្ថែមអ្នកគណនី",
                        url: route("users.create"),
                        icon: UserRoundPlus,
                        iconColor: "text-orange-600",
                    },
                ],
            },
        ],
    },
    // {
    //     label: "អ្នកប្រើប្រាស់",
    //     items: [
    //         {
    //             title: "អ្នកប្រើប្រាស់",
    //             url: route("users.index"),
    //             icon: UserRound,
    //             iconColor: "text-orange-500",
    //             children: [
    //                 {
    //                     title: "បន្ថែមអ្នកគណនី",
    //                     url: route("users.create"),
    //                     icon: UserRoundPlus,
    //                     iconColor: "text-orange-600",
    //                 },
    //             ],
    //         },
    //     ],
    // },
];
