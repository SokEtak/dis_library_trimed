export interface AuthUser {
    id: number;
    name: string;
    role_id: number;
}

export interface CategoryOption {
    id: number;
    name: string;
}

export interface SubjectOption {
    id: number;
    name: string;
}

export interface BookcaseOption {
    id: number;
    code: string;
}

export interface ShelfOption {
    id: number;
    code: string;
}

export interface GradeOption {
    id: number;
    name: string;
}

export interface CampusOption {
    id: number;
    name: string;
}

export interface SubcategoryOption {
    id: number;
    name: string;
}

export interface Book {
    user: any;
    id: number;
    title: string;
    description: string;
    page_count: number;
    publisher: string;
    language: string;
    published_at: string | number | null;
    cover: string;
    pdf_url: string;
    flip_link: string;
    view: number;
    is_available: boolean;
    author: string;
    code: string;
    isbn: string;
    type: string;
    downloadable: boolean;
    category_id: number;
    subcategory_id: number;
    bookcase_id: number;
    shelf_id: number;
    subject_id: number;
    grade_id: number;
    campus_id: number;
    program: string;
    created_at: string;
    updated_at: string;
    category?: { id: number; name: string };
    campus?: { id: number; name: string };
    subcategory?: { id: number; name: string };
    subject?: { id: number; name: string };
    bookcase?: { id: number; code: string };
    shelf?: { id: number; code: string };
    grade?: { id: number; name: string };
}

export interface PageProps {
    flash: {
        error: unknown;
        message?: string;
    };
    books: Book[];
    availableCategories: CategoryOption[];
    availableSubcategories: SubcategoryOption[];
    availableSubjects: SubjectOption[];
    availableBookcases: BookcaseOption[];
    availableShelves: ShelfOption[];
    availableGrades: GradeOption[];
    availableCampuses: CampusOption[];
    isSuperLibrarian: boolean;
    auth: {
        user: AuthUser;
    };
}
