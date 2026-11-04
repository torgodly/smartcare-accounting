/**
 * Small JSON client for the fast inline endpoints (Inertia v3 ships without axios).
 * Sends Laravel's CSRF token and throws HttpError with the server message on failure.
 */
export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public data: unknown = null,
    ) {
        super(message);
    }
}

function csrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));

    if (cookie) {
        return decodeURIComponent(cookie.split('=')[1]);
    }

    return '';
}

function metaToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export async function request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    body?: Record<string, unknown> | FormData,
): Promise<T> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const xsrf = csrfToken();

    if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
    } else {
        headers['X-CSRF-TOKEN'] = metaToken();
    }

    let payload: BodyInit | undefined;

    if (body instanceof FormData) {
        payload = body;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    let response: Response;

    try {
        response = await fetch(url, {
            method: method.toUpperCase(),
            headers,
            body: payload,
            credentials: 'same-origin',
        });
    } catch {
        throw new HttpError(0, 'تعذر الاتصال بالخادم');
    }

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw new HttpError(response.status, errorMessage(data), data);
    }

    return data as T;
}

function errorMessage(data: unknown): string {
    if (data && typeof data === 'object') {
        const record = data as {
            message?: string;
            errors?: Record<string, string[]>;
        };
        const first = record.errors ? Object.values(record.errors)[0]?.[0] : '';

        return first || record.message || 'حدث خطأ غير متوقع';
    }

    return 'حدث خطأ غير متوقع';
}

export const http = {
    get: <T>(url: string) => request<T>('get', url),
    post: <T>(url: string, body?: Record<string, unknown> | FormData) =>
        request<T>('post', url, body),
    put: <T>(url: string, body?: Record<string, unknown>) =>
        request<T>('put', url, body),
    delete: <T>(url: string) => request<T>('delete', url),
};
