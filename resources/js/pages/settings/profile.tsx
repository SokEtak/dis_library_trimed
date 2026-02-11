import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ការកំណត់ប្រវត្តិរូប',
        href: '/settings/profile',
    },
];

export default function Profile({ status }: { status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        password: '',
    });

    const handleSubmitName = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'), {
            onSuccess: () => {
                setIsEditing(false);
                setData('password', '');
            },
        });
    };



    // Map Spatie roles to display names
    const roleDisplayMap: { [key: string]: string } = {
        'regular-user': 'User',
        'staff': 'Librarian',
        'admin': 'Super Librarian',
        'super-admin': 'Admin',
    };

    // Determine the display pms (show the first matching pms or 'Unknown')
    const displayRole = auth.user && auth.user.roles.length > 0
        ? roleDisplayMap[auth.user.roles[0]] || 'Unknown'
        : 'Unknown';

    console.log('User Roles:', auth.user);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ការកំណត់ប្រវត្តិរូប" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* <HeadingSmall title="Profile information" description="Update your name and email address" /> */}
                    <HeadingSmall title="ប្រវត្តិរូបរបស់អ្នក" description="" />
                    <div className="relative z-10 p-8 md:p-12 rounded-3xl bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl backdrop-blur-md transition-all duration-500 ease-in-out">
                        <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="relative group focus:outline-none focus:ring-4 focus:ring-purple-400/50 rounded-full transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-xl"
                            >
                                <Avatar className="h-28 w-28 rounded-full border-4 border-purple-300 dark:border-purple-600 shadow-lg transition-all duration-500 ease-in-out group-hover:border-pink-500 group-hover:shadow-2xl group-hover:animate-pulse">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="rounded-full text-4xl font-extrabold bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                                        {auth.user.name.split(" ")[0][0]}
                                        {auth.user.name.split(" ")[1]?.[0] ?? ""}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute inset-0 rounded-full bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-white text-sm font-semibold tracking-wider">មើល</span>
                                </span>
                            </button>
                            <div className="text-center md:text-left">
                                {isEditing ? (
                                    <form onSubmit={handleSubmitName} className="space-y-4 w-full max-w-md">
                                        <div>
                                            <Label htmlFor="name" className="text-sm font-semibold text-gray-500 dark:text-gray-400">ឈ្មោះ</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="mt-2 text-lg"
                                                disabled={processing}
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="text-sm font-semibold text-gray-500 dark:text-gray-400">អ៊ីមែល</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="mt-2 text-lg"
                                                disabled={processing}
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="password" className="text-sm font-semibold text-gray-500 dark:text-gray-400">ពាក្យសម្ងាត់ (បញ្ជាក់ដើម្បីរក្សាទុក)</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="បញ្ចូលពាក្យសម្ងាត់របស់អ្នកដើម្បីបញ្ជាក់"
                                                className="mt-2 text-lg"
                                                disabled={processing}
                                            />
                                            {errors.password && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                {processing ? 'រក្សាទុក...' : 'រក្សាទុក'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setData({
                                                        name: auth.user.name,
                                                        email: auth.user.email,
                                                        password: '',
                                                    });
                                                }}
                                                disabled={processing}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                                            >
                                                បោះបង់
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-50 drop-shadow-md">{auth.user.name}</h3>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                title="កែសម្រួលឈ្មោះ"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-md text-gray-600 dark:text-gray-300 mt-1 drop-shadow-sm">{auth.user.email}</p>
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">✓ រក្សាទុកដោយជោគជ័យ!</p>
                                        </Transition>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"> */}
                            {/* {auth.user.campus && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Campus</Label>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{auth.user.campus.name}</p>
                                </div>
                            )} */}

                            {/* <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Role</Label>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{displayRole}</p>
                            </div> */}
                        {/* </div> */}

                        {/* {status === 'verification-link-sent' && (
                            <div className="mt-8 p-4 bg-green-500/10 dark:bg-green-800/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-opacity duration-500 ease-in-out border border-green-500/20 dark:border-green-500/30">
                                A new verification link has been sent to your email address.
                            </div>
                        )}

                        <div className="mt-8 flex items-center gap-4">
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Saved successfully! 🎉</p>
                            </Transition>
                        </div> */}
                    </div>
                </div>

                {isModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md transition-all duration-300 ease-in-out"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <div
                            className="relative max-w-[90vw] max-h-[90vh] p-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden transform transition-transform duration-300 ease-in-out hover:scale-105"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200/70 dark:bg-gray-700/70 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform duration-200 hover:scale-110 z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsModalOpen(false);
                                }}
                                aria-label="បិទហ្វនូស"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Avatar */}
                            <Avatar className="h-[28rem] w-[28rem] rounded-2xl shadow-2xl mx-auto">
                                <AvatarImage
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                    className="object-cover w-full h-full rounded-2xl"
                                />
                                <AvatarFallback className="rounded-2xl text-8xl font-black bg-gray-200/50 dark:bg-gray-700/50 flex items-center justify-center">
                                    {auth.user.name.split(" ")[0][0]}
                                    {auth.user.name.split(" ")[1]?.[0] ?? ""}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                )}

                {/* <DeleteUser /> */}
            </SettingsLayout>
        </AppLayout>
    );
}
