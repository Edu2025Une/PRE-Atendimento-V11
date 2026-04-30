/* ── Types ──────────────────────────────────────────────────────────── */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  tenant_id: string | null;
  created_at: string;
  tenants: { name: string; slug: string } | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ApiError {
  success: false;
  data: null;
  error: string;
}

type ApiResult<T> = ApiResponse<T> | ApiError;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function authHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function apiFetch<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: authHeaders(token),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const json = await res.json();
    return json as ApiResult<T>;
  } catch {
    return { success: false, data: null, error: 'Erro de rede.' };
  }
}

/* ── Users ───────────────────────────────────────────────────────────── */

export function apiListUsers(token: string): Promise<ApiResult<AppUser[]>> {
  return apiFetch('GET', '/api/users', token);
}

export interface AppUserCreated {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
}

export function apiCreateUser(
  token: string,
  payload: { name: string; email: string; password: string; role: string; tenantId?: string },
): Promise<ApiResult<AppUserCreated>> {
  return apiFetch('POST', '/api/users', token, payload);
}

export interface AppUserPatch {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  tenant_id: string | null;
}

export function apiUpdateUser(
  token: string,
  id: string,
  payload: { name?: string; role?: string; active?: boolean; tenantId?: string | null },
): Promise<ApiResult<AppUserPatch>> {
  return apiFetch('PATCH', `/api/users/${id}`, token, payload);
}

export function apiDeleteUser(
  token: string,
  id: string,
): Promise<ApiResult<{ message: string }>> {
  return apiFetch('DELETE', `/api/users/${id}`, token);
}

/* ── Tenants ─────────────────────────────────────────────────────────── */

export function apiListTenants(token: string): Promise<ApiResult<Tenant[]>> {
  return apiFetch('GET', '/api/tenants', token);
}

export function apiCreateTenant(
  token: string,
  payload: { name: string; slug: string },
): Promise<ApiResult<Tenant>> {
  return apiFetch('POST', '/api/tenants', token, payload);
}

export function apiUpdateTenantEvolutionConfig(
  token: string,
  id: string,
  payload: { evolutionApiUrl?: string; evolutionGlobalApiKey?: string },
): Promise<ApiResult<Tenant>> {
  return apiFetch('PATCH', `/api/tenants/${id}/evolution-config`, token, payload);
}
