import { AppContent } from '@/components/app-content';
import ActivityLogAlerts from '@/components/activity-log-alerts';
import AdminLoanRequestAlerts from '@/components/admin-loan-request-alerts';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';

interface SharedData {
    auth: {
        user: {
            role_id: number;
            name: string;
            email: string;
        } | null;
    };
}

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { auth } = usePage<SharedData>().props;
    const showSidebar = auth.user && auth.user.role_id !== 1;

    return (
        <AppShell variant={showSidebar ? "sidebar" : "plain"}>
            {showSidebar && <AppSidebar />}
            <AppContent variant={showSidebar ? "sidebar" : "plain"} className="overflow-x-hidden">
                {showSidebar && <AppSidebarHeader breadcrumbs={breadcrumbs} />}
                <AdminLoanRequestAlerts />
                <ActivityLogAlerts />
                {children}
            </AppContent>
        </AppShell>
    );
}
