export type ValidationErrors = Record<string, string[]>;

export class JsonRequestError extends Error {
    status: number;
    errors?: ValidationErrors;

    constructor(message: string, status: number, errors?: ValidationErrors) {
        super(message);
        this.name = "JsonRequestError";
        this.status = status;
        this.errors = errors;
    }
}

const getCsrfToken = () => {
    const token = document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content");

    return token ?? "";
};

interface JsonRequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Record<string, unknown> | null;
    headers?: HeadersInit;
}

export async function requestJson<T>(
    url: string,
    { method = "GET", body = null, headers = {} }: JsonRequestOptions = {},
): Promise<T> {
    const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": getCsrfToken(),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
        ? await response.json()
        : {};

    if (!response.ok) {
        const message =
            typeof payload?.message === "string"
                ? payload.message
                : "Request failed.";

        throw new JsonRequestError(
            message,
            response.status,
            payload?.errors as ValidationErrors | undefined,
        );
    }

    return payload as T;
}

