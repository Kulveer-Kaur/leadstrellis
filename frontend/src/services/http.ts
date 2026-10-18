import { env } from '@/config/env';
import { tokenStorage } from './token-storage';

export interface FieldError {
  path: string;
  message: string;
}

/** Error thrown for any non-2xx response, carrying the backend's { code, message, details }. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }

  /** Field-level validation errors (VALIDATION_ERROR), keyed by field path. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries((this.details as FieldError[]).map((d) => [d.path, d.message]));
  }
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

/** Called on 401 so the app can drop the session (set by AuthProvider). */
let onUnauthorized: (() => void) | undefined;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

function buildUrl(path: string, query?: Query) {
  const url = `${env.apiBaseUrl}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: PageMeta }> {
  const token = tokenStorage.get();
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      credentials: 'include',
      signal: opts.signal,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Is the backend running on port 4000?');
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    if (res.status === 401 && path !== '/auth/login') onUnauthorized?.();
    const err = json?.error;
    throw new ApiError(res.status, err?.code ?? 'HTTP_ERROR', err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return { data: json.data as T, meta: json.meta as PageMeta | undefined };
}

/** Typed API client for the Express backend (/api/v1). */
export const http = {
  get: async <T>(path: string, query?: Query, signal?: AbortSignal) => (await request<T>(path, { query, signal })).data,
  getPage: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: async <T>(path: string, body?: unknown) => (await request<T>(path, { method: 'POST', body: body ?? {} })).data,
  patch: async <T>(path: string, body: unknown) => (await request<T>(path, { method: 'PATCH', body })).data,
  delete: async <T>(path: string) => (await request<T>(path, { method: 'DELETE' })).data,
};
