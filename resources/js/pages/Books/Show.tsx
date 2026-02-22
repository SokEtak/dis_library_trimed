import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';
import { Copy, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

interface Subcategory {
    id: number;
    name: string;
}

interface Bookcase {
    id: number;
    code: string;
}

interface Shelves {
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

interface Book {
    id: number;
    title: string;
    description: string | null;
    flip_link: string | null;
    cover: string | null;
    code: string;
    isbn: string;
    view: number;
    is_available: boolean;
    user_id: number;
    category_id: number;
    subcategory_id: number | null;
    bookcase_id: number | null;
    shelf_id: number | null;
    grade_id: number | null;
    subject_id: number | null;
    is_deleted: boolean;
    user: User | null;
    category: Category | null;
    subcategory: Subcategory | null;
    bookcase: Bookcase | null;
    shelf: Shelves | null;
    grade: Grade | null;
    subject: Subject | null;
    page_count: number | null;
    publisher: string | null;
    language: string | null;
    program: string | null;
    published_at: string | null;
    author: string | null;
    type: string | null;
    downloadable: boolean | null;
    created_at: string | null;
    updated_at: string | null;
}

interface BooksShowProps {
    book: Book;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Books',
        href: route('books.index'),
    },
    {
        title: 'Show',
        href: '',
    },
];

export default function BooksShow({ book }: BooksShowProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const toggleModal = () => setIsModalOpen(!isModalOpen);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Book Details" />
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6">
                <div className="max-w-1xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-10">
                    {book.cover && (
                        <div className="mb-10 flex justify-center">
                            <img
                                src={book.cover}
                                alt="Book Cover"
                                className="w-full max-w-sm rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-transform duration-300 cursor-pointer"
                                onClick={toggleModal}
                            />
                        </div>
                    )}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="location">Location</TabsTrigger>
                            <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* General Info */}
                                {[
                                    { label: 'អត្តសញ្ញាណ', value: book.id.toString(), field: 'id', copyable: true },
                                    { label: 'ចំណងជើង', value: book.title, field: 'title', copyable: true },
                                    { label: 'សេចក្ដីពិពណ៌នា', value: book.description || 'មិនមាន', field: 'description', copyable: true },
                                    { label: 'ចំនួនទំព័រ', value: book.page_count ? `${book.page_count} ទំព័រ` : 'មិនមាន', field: 'page_count' },
                                    { label: 'បោះពុម្ពផ្សាយដោយដោយ', value: book.publisher || 'មិនមាន', field: 'publisher' },
                                    { label: 'ភាសា', value: book.language === 'en' ? 'អង់គ្លេស' : book.language === 'kh' ? 'ខ្មែរ' : 'មិនមាន', field: 'language' },
                                    { label: 'កម្មវិធី', value: book.program || 'មិនមាន', field: 'program' },
                                    { label: 'ថ្ងៃបោះពុម្ព', value: book.published_at ? new Date(book.published_at).toLocaleString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' }) : 'មិនមាន', field: 'published_at' },
                                    { label: 'អ្នកនិពន្ធ', value: book.author || 'មិនមាន', field: 'author' },
                                    { label: 'ប្រភេទសៀវភៅ', value: book.type ? book.type.charAt(0).toUpperCase() + book.type.slice(1) : 'មិនមាន', field: 'type' },
                                    { label: 'អាចទាញយកបាន', value: book.downloadable ? 'បាទ/ចាស' : 'ទេ', field: 'downloadable', className: book.downloadable ? 'text-green-500' : 'text-red-500' },
                                ].map(({ label, value, field, className, copyable }) => (
                                    <div key={field} className="relative group bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">{label}</label>
                                        <div className="flex items-center mt-2">
                                            <p className={`flex-1 text-gray-900 dark:text-gray-100 ${className || ''}`}>{value}</p>
                                            {copyable && (
                                                <button onClick={() => copyToClipboard(value, field)} className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200" title="Copy to clipboard">
                                                    {copiedField === field ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                                </button>
                                            )}
                                        </div>
                                        {copiedField === field && (
                                            <span className="absolute top-0 right-0 mt-12 mr-2 text-xs text-green-500 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md shadow">Copied!</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="location">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Location Info */}
                                {[
                                    { label: 'ទូ', value: book.bookcase?.code || 'មិនមាន', field: 'bookcase' },
                                    { label: 'ធ្នើ', value: book.shelf?.code || 'មិនមាន', field: 'shelf' },
                                    { label: 'ថ្នាក់', value: book.grade?.name || 'មិនមាន', field: 'grade' },
                                    { label: 'មុខវិជ្ជា', value: book.subject?.name || 'មិនមាន', field: 'subject' },
                                    { label: 'ប្រភេទ', value: book.category?.name || 'មិនមាន', field: 'category' },
                                    { label: 'ប្រភេទរង', value: book.subcategory?.name || 'មិនមាន', field: 'subcategory' },
                                ].map(({ label, value, field }) => (
                                    <div key={field} className="group bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">{label}</label>
                                        <div className="flex items-center mt-2">
                                            <p className="flex-1 text-gray-900 dark:text-gray-100">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="metadata">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Metadata Info */}
                                {[
                                    { label: 'កូដ', value: book.code, field: 'code', copyable: true },
                                    { label: 'លេខសៀវភៅ (ISBN)', value: book.isbn, field: 'isbn', copyable: true },
                                    { label: 'ចំនួនមើល', value: book.view.toString(), field: 'view' },
                                    { label: 'ភាពអាចរកបាន', value: book.is_available ? 'បាទ/ចាស' : 'ទេ', field: 'is_available', className: book.is_available ? 'text-green-500' : 'text-red-500' },
                                    { label: 'បង្ហោះដោយ', value: book.user?.name || 'មិនមាន', field: 'user' },
                                    { label: 'ថ្ងៃបង្ហោះ', value: book.created_at ? new Date(book.created_at).toLocaleString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : 'មិនមាន', field: 'created_at' },
                                    { label: 'កែចុងក្រោយ', value: book.updated_at ? new Date(book.updated_at).toLocaleString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' }) : 'មិនមាន', field: 'updated_at' },
                                    { label: 'តំណភ្ជាប់ Flip', value: book.flip_link || 'មិនមាន', field: 'flip_link', copyable: true },
                                ].map(({ label, value, field, className, copyable }) => (
                                    <div key={field} className="relative group bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">{label}</label>
                                        <div className="flex items-center mt-2">
                                            <p className={`flex-1 text-gray-900 dark:text-gray-100 ${className || ''}`}>{value}</p>
                                            {copyable && (
                                                <button onClick={() => copyToClipboard(value, field)} className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200" title="Copy to clipboard">
                                                    {copiedField === field ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                                </button>
                                            )}
                                        </div>
                                        {copiedField === field && (
                                            <span className="absolute top-0 right-0 mt-12 mr-2 text-xs text-green-500 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md shadow">Copied!</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="mt-12 flex gap-4 justify-center">
                        <Link href={route('books.index')}>
                            <Button className="border-2  px-8 py-3 rounded-lg font-semibold cursor-pointer">
                                <ArrowLeft/> Go Back Book List
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            {isModalOpen && book.cover && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full">
                        <button
                            onClick={toggleModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        {/* console.log(book.cover) */}
                        <img
                            src={book.cover}
                            alt="Book Cover Large"
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
