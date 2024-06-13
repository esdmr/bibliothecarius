import type {paths} from './api.js';

export const backend = new URL(
    import.meta.env.DEV
        ? 'http://localhost:5000/'
        : 'https://bibliothecarius.esdmr.ir/',
);

export type UrlOf<S extends string> =
    S extends `${infer A}/{${string}}${infer B extends string}`
        ? `${A}` | `${A}/${string}${UrlOf<B>}`
        : S;

export const getUrl = (url: UrlOf<keyof paths>) => new URL(url, backend);

export type Route = {
    singular: string;
    plural: string;
    url: string;
    adminOnly?: boolean;
    key: string;
    schema: Schema;
};

export type Schema = Record<
    string,
    {
        type:
            | StringConstructor
            | NumberConstructor
            | BooleanConstructor
            | Route;
        nullable?: boolean;
        secret?: boolean;
        name: string;
    }
>;

export const category: Route = {
    singular: 'Category',
    plural: 'Categories',
    url: '/categories/',
    key: 'id',
    schema: {
        name: {
            type: String,
            name: 'Name',
        },
    },
};

export const book: Route = {
    singular: 'Book',
    plural: 'Books',
    url: '/books/',
    key: 'id',
    schema: {
        title: {
            type: String,
            name: 'Title',
        },
        description: {
            type: String,
            name: 'Description',
        },
        category: {
            type: category,
            nullable: true,
            name: 'Category',
        },
    },
};

export const author: Route = {
    singular: 'Author',
    plural: 'Authors',
    url: '/authors/',
    key: 'id',
    schema: {
        name: {
            type: String,
            name: 'Name',
        },
    },
};

export const bookAuthor: Route = {
    singular: 'Book Author',
    plural: 'Book Authors',
    url: '/book_authors/',
    key: 'id',
    schema: {
        book: {
            type: book,
            name: 'Book',
        },
        author: {
            type: author,
            name: 'Author',
        },
    },
};

export const publisher: Route = {
    singular: 'Publisher',
    plural: 'Publishers',
    url: '/publishers/',
    key: 'id',
    schema: {
        name: {
            type: String,
            name: 'Publisher',
        },
    },
};

export const bookCopy: Route = {
    singular: 'Book Copy',
    plural: 'Book Copies',
    url: '/book_copies/',
    key: 'id',
    schema: {
        year_published: {
            type: Number,
            nullable: true,
            name: 'Year Published',
        },
        book: {
            type: book,
            name: 'Book',
        },
        publisher: {
            type: publisher,
            name: 'Publisher',
        },
    },
};

export const librarian: Route = {
    singular: 'Librarian',
    plural: 'Librarians',
    url: '/librarians/',
    key: 'username',
    adminOnly: true,
    schema: {
        username: {
            type: String,
            name: 'Username',
        },
        password: {
            type: String,
            name: 'Password',
            secret: true,
        },
        admin: {
            type: Boolean,
            name: 'Admin',
        },
    },
};

export const routes = [
    category,
    book,
    author,
    bookAuthor,
    publisher,
    bookCopy,
    librarian,
];

export function createFromRoute(route: Route) {
    const data = Object.create({}) as Record<string, any>;

    for (const [key, {type}] of Object.entries(route.schema)) {
        data[key] = typeof type === 'object' ? undefined : type();
    }

    return data;
}
