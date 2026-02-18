import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link, router, useForm } from '@inertiajs/react';
import {
    Eye,
    Pencil,
    Trash2,
    MoreHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ExternalLink,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DataTable from "@/components/DataTable";
import { translations } from "@/utils/translations/campus/campus";

interface Campus {
    id: number;
    school_id: number;
    name: string;
    code: string;
    email: string;
    contact: string;
    address: string;
    website: string | null;
    school: {
        name: string;
    };
}

interface CampusesIndexProps {
    campuses: {
        data: Campus[];
        current_page: number;
        last_page: number;
        next_page_url: string | null;
        prev_page_url: string | null;
        total?: number;
        per_page?: number;
    };
    flash?: {
        message?: string;
        type?: "success" | "error";
    };
    isSuperLibrarian?: boolean;
    lang?: "kh" | "en";
}

const commonStyles = {
    button: "rounded-lg text-sm transition-colors",
    text: "text-gray-800 dark:text-gray-100 text-sm",
    indigoButton:
        "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700",
    gradientBg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900",
    tooltipBg: "bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl",
    link: "text-indigo-600 dark:text-indigo-300 hover:underline flex items-center gap-1",
    truncate: "truncate max-w-xs",
};

const getColumns = (
    processing: boolean,
    isSuperLibrarian: boolean,
    lang: "kh" | "en" = "kh"
): ColumnDef<Campus>[] => {
    const t = translations["kh"];

    return [
        // Actions
        {
            id: "actions",
            enableHiding: false,
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => {
                const campus = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={`${commonStyles.button} h-8 w-8 p-0`}
                                aria-label="Open actions menu"
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="center"
                            className={`${commonStyles.gradientBg} w-auto min-w-0 rounded-xl p-1 dark:border-indigo-600`}
                        >
                            <div className="flex flex-col items-center gap-1 px-1 py-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={route("campuses.edit", campus.id)}>
                                                <Button
                                                    variant="ghost"
                                                    className="h-4 w-4"
                                                    disabled={processing}
                                                >
                                                    <Pencil className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                            {t.indexEditTooltip}
                                        </TooltipContent>
                                    </Tooltip>

                                    {/*{isSuperLibrarian && (*/}
                                    {/*    <Tooltip>*/}
                                    {/*        <TooltipTrigger asChild>*/}
                                    {/*            <Button*/}
                                    {/*                variant="ghost"*/}
                                    {/*                className="h-4 w-4 p-0"*/}
                                    {/*                disabled={processing}*/}
                                    {/*                onClick={() => {*/}
                                    {/*                    if (confirm(t.indexDeleteTooltip || "Delete this campus?")) {*/}
                                    {/*                        router.delete(route("campuses.destroy", campus.id));*/}
                                    {/*                    }*/}
                                    {/*                }}*/}
                                    {/*            >*/}
                                    {/*                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />*/}
                                    {/*            </Button>*/}
                                    {/*        </TooltipTrigger>*/}
                                    {/*        <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>*/}
                                    {/*            {t.indexDeleteTooltip}*/}
                                    {/*        </TooltipContent>*/}
                                    {/*    </Tooltip>*/}
                                    {/*)}*/}
                                </TooltipProvider>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },

        // ID
        {
            accessorKey: "id",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexId}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={route("campuses.show", row.original.id)}
                    className={`${commonStyles.text} px-10 hover:underline`}
                >
                    {row.getValue("id")}
                </Link>
            ),
        },

        // School
        {
            accessorKey: "school.name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexSchool}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={route("schools.show", row.original.school_id)}
                    className={`${commonStyles.text} px-4 hover:underline`}
                >
                    {row.original.school.name}
                </Link>
            ),
        },

        // Name
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexName}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={route("campuses.show", row.original.id)}
                    className={`${commonStyles.text} px-4 hover:underline`}
                >
                    {row.getValue("name")}
                </Link>
            ),
        },

        // Code
        {
            accessorKey: "code",
            header: t.indexCode,
            cell: ({ row }) => <span className="font-mono">{row.getValue("code")}</span>,
        },

        // Email
        {
            accessorKey: "email",
            header: t.indexEmail,
            cell: ({ row }) => {
                const email = row.getValue("email") as string;
                if (!email) return <span className="text-gray-400 px-2">N/A</span>;
                return (
                    <a href={`mailto:${email}`} className={commonStyles.link}>
                        {email}
                    </a>
                );
            },
        },

        // Contact
        {
            accessorKey: "contact",
            header: t.indexContact,
            cell: ({ row }) => {
                const contact = row.getValue("contact") as string;
                if (!contact) return <span className="text-gray-400 px-4">N/A</span>;
                return (
                    <a href={`tel:${contact}`} className={commonStyles.link}>
                        {contact}
                    </a>
                );
            },
        },

        // Address
        {
            accessorKey: "address",
            header: t.indexAddress,
            defaultHidden: true,
            cell: ({ row }) => {
                const address = row.getValue("address") as string;
                if (!address) return <span className="text-gray-400 px-5">N/A</span>;
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                        <span className={`${commonStyles.text} ${commonStyles.truncate} block`}>
                            {address}
                        </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md p-3 text-sm">
                                <p className="whitespace-pre-wrap">{address}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
        },

        // Website
        {
            accessorKey: "website",
            header: t.indexWebsite,
            cell: ({ row }) => {
                const website = row.getValue("website") as string | null;
                if (!website) return <span className="text-gray-400 px-4">N/A</span>;
                return (
                    <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={commonStyles.link}
                    >
                        <ExternalLink className="h-3 w-3" />
                        <span className={commonStyles.truncate}>
                    {website.replace(/^https?:\/\//, "")}
                </span>
                    </a>
                );
            },
        },
    ];
};

export default function CampusesIndex({
                                          campuses,
                                          flash,
                                          isSuperLibrarian = false,
                                          lang = "kh",
                                      }: CampusesIndexProps) {
    const t = translations["kh"];
    const { processing } = useForm();
    const columns = useMemo(
        () => getColumns(processing, isSuperLibrarian, lang),
        [processing, isSuperLibrarian, lang]
    );

    const breadcrumbs = [
        { title: t.indexTitle, href: route("campuses.index") },
    ];

    return (
        <DataTable
            data={campuses.data}
            columns={columns}
            breadcrumbs={breadcrumbs}
            title={t.indexTitle}
            resourceName="campuses"
            routes={{
                index: route("campuses.index"),
                create: route("campuses.create"),
                show: (id) => route("campuses.show", id),
                edit: (id) => route("campuses.edit", id),
                export: route("campuses.export"),
                import: route("campuses.import"),
            }}
            flash={flash}
            isSuperLibrarian={isSuperLibrarian}
        />
    );
}
