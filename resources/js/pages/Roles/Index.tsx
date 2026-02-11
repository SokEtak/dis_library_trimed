'use client';

import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { translations } from '@/utils/translations/role/role';
import { Link, useForm } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal, Pencil } from 'lucide-react';
import { useMemo } from 'react';

interface Role {
    id: number;
    code: string;
    name: string;
    permissions_count: number;
    permissions: { id: number; name: string }[];
}

interface RolesIndexProps {
    roles?: Role[];
    flash?: {
        message?: string;
        type?: 'success' | 'error';
    };
    isSuperLibrarian?: boolean;
    lang?: 'kh' | 'en';
}

const commonStyles = {
    button: 'rounded-lg text-sm transition-colors',
    text: 'text-gray-800 dark:text-gray-100 text-sm',
    indigoButton: 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700',
    outlineButton:
        'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-800',
    gradientBg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900',
    tooltipBg: 'bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl',
};

const getColumns = (processing: boolean, lang: 'kh' | 'en' = 'kh'): ColumnDef<Role>[] => {
    const t = translations[lang] || translations.en;
    return [
        {
            id: 'actions',
            enableHiding: false,
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={`${commonStyles.button} h-8 w-8 p-0`} aria-label="Open actions menu">
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
                                            <Link href={route('roles.show', role.id)}>
                                                <Button variant="ghost" className="h-4 w-4 p-0">
                                                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                            {t.indexViewTooltip || 'View Role'}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={route('roles.edit', role.id)}>
                                                <Button variant="ghost" className="h-4 w-4 p-0" disabled={processing} aria-label="Edit role">
                                                    <Pencil className="mb-1 h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                            {t.indexEditTooltip || 'Edit Role'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
        {
            accessorKey: 'id',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexId || 'ID'}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <Link href={route('roles.show', row.original.id)} className={`${commonStyles.text} px-10 hover:underline`}>
                    {row.getValue('id')}
                </Link>
            ),
            filterFn: (row, id, value) => String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexName || 'Name'}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <Link href={route('roles.show', row.original.id)} className={`${commonStyles.text} px-4 hover:underline`}>
                    {row.getValue('name')}
                </Link>
            ),
            filterFn: (row, id, value) => String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            accessorKey: 'permissions_count',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexPermissionsCount || 'Permissions Count'}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={route('roles.show', role.id)} className={`${commonStyles.text} px-10 hover:underline`}>
                                    {role.permissions_count ?? 0}
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className={`${commonStyles.tooltipBg} max-w-sm shadow-xl`}>
                                <Card className="border-indigo-200 bg-white dark:border-indigo-600 dark:bg-gray-800">
                                    <CardContent className="p-0">
                                        <h3 className="p-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                                            {(t.indexPermissionsInRole || 'Permissions in Role {name}').replace('{name}', role.name)}
                                        </h3>
                                        {role.permissions && role.permissions.length > 0 ? (
                                            <ul className="list-inside list-disc space-y-2 p-2 text-base text-gray-700 dark:text-gray-200">
                                                {role.permissions.map((permission) => (
                                                    <li key={permission.id} className="whitespace-nowrap">
                                                        {permission.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="p-2 text-sm text-gray-600 dark:text-gray-300">{t.indexNoPermissions || 'No Permissions'}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
            filterFn: (row, id, value) => String(row.getValue(id) ?? 0).includes(String(value)),
        },
    ];
};

export default function RolesIndex({
                                       roles = [], // Default to empty array
                                       flash,
                                       isSuperLibrarian = false,
                                       lang = 'kh',
                                   }: RolesIndexProps) {
    const t = translations[lang] || translations.en;
    const { processing } = useForm();
    const columns = useMemo(() => getColumns(processing, lang), [processing, lang]);

    // Safely access roles
    const rolesData = Array.isArray(roles) ? roles : [];

    const modalFields = (item: Role) => (
        <>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">
                    {t.indexPermissionsCount || 'Permissions Count'} ({item.permissions_count ?? 0}):
                </strong>{' '}
                {item.permissions && item.permissions.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm">
                        {item.permissions.map((permission) => (
                            <li key={permission.id}>{permission.name}</li>
                        ))}
                    </ul>
                ) : (
                    t.indexNoPermissions || 'No Permissions'
                )}
            </p>
        </>
    );

    const breadcrumbs = [{ title: t.indexTitle || 'Roles', href: route('roles.index') }];

    return (
        <div className={`${commonStyles.gradientBg}`}>
            {/* Flash Message */}
            {flash?.message && (
                <div className={`mb-4 rounded p-4 ${flash.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {flash.message}
                </div>
            )}
            {/* Create Button */}
            {isSuperLibrarian && (
                <div className="mb-4">
                    <Link href={route('roles.create')}>
                        <Button className={`${commonStyles.indigoButton} ${commonStyles.button}`}>{t.indexCreateButton || 'Create Role'}</Button>
                    </Link>
                </div>
            )}
            {/* DataTable with default sorting */}
            <DataTable
                data={rolesData.map((role) => ({ ...role, code: role.name }))}
                columns={columns}
                breadcrumbs={breadcrumbs}
                title={t.indexTitle || 'Roles'}
                resourceName={t.indexTitle}
                routes={{
                    index: route('roles.index'),
                    create: route('roles.create'),
                    show: (id) => route('roles.show', id),
                    edit: (id) => route('roles.edit', id),
                }}
                flash={flash}
                modalFields={modalFields}
                isSuperLibrarian={isSuperLibrarian}
            />
        </div>
    );
}
