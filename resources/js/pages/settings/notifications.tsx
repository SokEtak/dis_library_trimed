import HeadingSmall from '@/components/heading-small';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ការកំណត់ការជូនដំណឹង',
        href: '/settings/notifications',
    },
];

interface NotificationSettingsProps {
    preferences: {
        show_activity_log_alert_popup: boolean;
        show_loan_request_alert_popup: boolean;
    };
}

export default function NotificationSettings({ preferences }: NotificationSettingsProps) {
    const [data, setData] = useState({
        show_activity_log_alert_popup: preferences.show_activity_log_alert_popup,
        show_loan_request_alert_popup: preferences.show_loan_request_alert_popup,
    });
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    useEffect(() => {
        setData({
            show_activity_log_alert_popup: preferences.show_activity_log_alert_popup,
            show_loan_request_alert_popup: preferences.show_loan_request_alert_popup,
        });
    }, [
        preferences.show_activity_log_alert_popup,
        preferences.show_loan_request_alert_popup,
    ]);

    useEffect(() => {
        if (!recentlySuccessful) {
            return;
        }

        const timeoutId = window.setTimeout(() => setRecentlySuccessful(false), 1500);
        return () => window.clearTimeout(timeoutId);
    }, [recentlySuccessful]);

    const toggleAndSave = (
        key: 'show_activity_log_alert_popup' | 'show_loan_request_alert_popup',
        checked: boolean,
    ) => {
        if (processing) {
            return;
        }

        const previousData = data;
        const nextData = {
            ...data,
            [key]: checked,
        };

        setData(nextData);
        setProcessing(true);
        setRecentlySuccessful(false);

        router.patch(route('notifications.update'), nextData, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onError: () => {
                setData(previousData);
            },
            onSuccess: () => {
                setRecentlySuccessful(true);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ការកំណត់ការជូនដំណឹង" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="ការជូនដំណឹងបន្តផ្ទាល់"
                        description="បើក ឬបិទផ្ទាំងជូនដំណឹងពេលមានកំណត់ហេតុសកម្មភាព និងសំណើខ្ចីសៀវភៅ។"
                    />

                    <div className="space-y-6 rounded-xl border border-border p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="show_activity_log_alert_popup">ផ្ទាំងជូនដំណឹងកំណត់ហេតុសកម្មភាព</Label>
                                <p className="text-sm text-muted-foreground">
                                    បង្ហាញផ្ទាំងជូនដំណឹងបន្តផ្ទាល់នៅពេលមានការបង្កើត ឬកែប្រែកំណត់ហេតុសកម្មភាព។
                                </p>
                            </div>
                            <Switch
                                id="show_activity_log_alert_popup"
                                checked={data.show_activity_log_alert_popup}
                                onCheckedChange={(checked) => toggleAndSave('show_activity_log_alert_popup', checked)}
                                disabled={processing}
                            />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="show_loan_request_alert_popup">ផ្ទាំងជូនដំណឹងសំណើខ្ចីសៀវភៅ</Label>
                                <p className="text-sm text-muted-foreground">
                                    បង្ហាញផ្ទាំងជូនដំណឹងបន្តផ្ទាល់នៅពេលមានសំណើខ្ចីសៀវភៅថ្មីសម្រាប់អ្នកគ្រប់គ្រង។
                                </p>
                            </div>
                            <Switch
                                id="show_loan_request_alert_popup"
                                checked={data.show_loan_request_alert_popup}
                                onCheckedChange={(checked) => toggleAndSave('show_loan_request_alert_popup', checked)}
                                disabled={processing}
                            />
                        </div>

                        <div className="flex items-center gap-4 min-h-6">
                            {processing && <p className="text-sm text-muted-foreground">កំពុងរក្សាទុក...</p>}

                            <Transition
                                show={!processing && recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">បានរក្សាទុក</p>
                            </Transition>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
