interface Translations {
    kh: {
        title: string;
        id: string;
        returnDate: string;
        returned_at: string;
        book: string;
        loaner: string;
        status: string;
        statusProcessing: string;
        statusReturned: string;
        statusCanceled: string;
        statusAll: string;
        createdAt: string;
        updatedAt: string;
        view: string;
        edit: string;
        delete: string;
        viewTooltip: string;
        editTooltip: string;
        deleteTooltip: string;
        bookLinkTooltip: (id: number) => string;
        userLinkTooltip: (id: number) => string;
        deleteDialogTitle: string;
        deleteDialogDescription: (bookTitle: string, userName: string) => string;
        cancel: string;
        confirmDelete: string;
        none: string;
        statusPlaceholder: string;
        statusEmpty: string;
    };
    en: {
        title: string;
        id: string;
        returnDate: string;
        returned_at: string;
        book: string;
        loaner: string;
        status: string;
        statusProcessing: string;
        statusReturned: string;
        statusCanceled: string;
        statusAll: string;
        createdAt: string;
        updatedAt: string;
        view: string;
        edit: string;
        delete: string;
        viewTooltip: string;
        editTooltip: string;
        deleteTooltip: string;
        bookLinkTooltip: (id: number) => string;
        userLinkTooltip: (id: number) => string;
        deleteDialogTitle: string;
        deleteDialogDescription: (bookTitle: string, userName: string) => string;
        cancel: string;
        confirmDelete: string;
        none: string;
        statusPlaceholder: string;
        statusEmpty: string;
    };
}

const translations: Translations = {
    kh: {
        title: "កម្ចីសៀវភៅ",
        id: "លេខរៀង",
        returnDate: "ថ្ងៃសងសៀវភៅ",
        returned_at: "បានសងនៅថ្ថៃ",
        book: "ចំណងជើងសៀវភៅ",
        loaner: "ម្ចាស់កម្ចី",
        status: "ស្ថានភាព",
        statusProcessing: "កំពុងដំណើរការ",
        statusReturned: "បានត្រឡប់",
        statusCanceled: "បានលុបចោល",
        statusAll: "ទាំងអស់",
        createdAt: "ធ្វើឡើងនៅ",
        updatedAt: "កែប្រែលើកចុងក្រោយ",
        view: "មើល",
        edit: "កែសម្រួល",
        delete: "លុប",
        viewTooltip: "មើលកម្ចីសៀវភៅ",
        editTooltip: "កែសម្រួលកម្ចីសៀវភៅ",
        deleteTooltip: "លុបកម្ចីសៀវភៅ",
        bookLinkTooltip: (id: number) => `រុករកទៅ /books/${id}`,
        userLinkTooltip: (id: number) => `រុករកទៅ /users/${id}`,
        deleteDialogTitle: "តើអ្នកប្រាកដទេថាចង់លុបកម្ចីស៖ាវភៅនេះ?",
        deleteDialogDescription: (bookTitle: string, userName: string) =>
            `សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។ វានឹងលុបកម្ចីសៀវភៅ${bookTitle ? ` សម្រាប់ "${bookTitle}"` : ""}${userName ? ` ខ្ចីដោយ ${userName}` : ""} ជាអចិន្ត្រៃយ៍។`,
        cancel: "បោះបង់",
        confirmDelete: "លុប",
        none: "មិនទាន់បានសង",
        statusPlaceholder: "ជ្រើសរើសស្ថានភាព",
        statusEmpty: "រកមិនឃើញស្ថានភាព",
    },
    en: {
        title: "Book Loans",
        id: "ID",
        returnDate: "Return Date",
        returned_at: "Returned At",
        book: "Book Title",
        loaner: "Loaner",
        status: "Status",
        statusProcessing: "Processing",
        statusReturned: "Returned",
        statusCanceled: "Canceled",
        statusAll: "All",
        createdAt: "Created At",
        updatedAt: "Last Modified",
        view: "View",
        edit: "Edit",
        delete: "Delete",
        viewTooltip: "View Book Loan",
        editTooltip: "Edit Book Loan",
        deleteTooltip: "Delete Book Loan",
        bookLinkTooltip: (id: number) => `Navigate to /books/${id}`,
        userLinkTooltip: (id: number) => `Navigate to /users/${id}`,
        deleteDialogTitle: "Are you sure you want to delete this book loan?",
        deleteDialogDescription: (bookTitle: string, userName: string) =>
            `This action cannot be undone. This will permanently delete the book loan${bookTitle ? ` for "${bookTitle}"` : ""}${userName ? ` borrowed by ${userName}` : ""}.`,
        cancel: "Cancel",
        confirmDelete: "Delete",
        none: "N/A",
        statusPlaceholder: "Select a status",
        statusEmpty: "No status found",
    },
};

export default translations;
