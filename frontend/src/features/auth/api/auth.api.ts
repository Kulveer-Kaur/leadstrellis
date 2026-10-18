import { http } from '@/services/http';
import type { AuthUser } from '../auth.types';

export const login = (email: string, password: string) => http.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
export const fetchMe = () => http.get<AuthUser>('/auth/me');
export const logout = () => http.post<{ loggedOut: boolean }>('/auth/logout');
export const verifyInvite = (token: string) => http.get<{ email: string; name: string }>(`/auth/invite/${token}`);
export const acceptInvite = (token: string, password: string) => http.post<{ token: string; user: AuthUser }>(`/auth/invite/${token}/accept`, { password });
