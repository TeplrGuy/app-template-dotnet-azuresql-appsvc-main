const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(status: number, message: string, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryable = retryable;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `API ${res.status}`;
    let retryable = false;
    try {
      const body = await res.json();
      message = body.message ?? message;
      retryable = body.retryable === true;
    } catch {
      message = await res.text().catch(() => message);
    }
    throw new ApiError(res.status, message, retryable);
  }

  return (await res.json()) as T;
}
