export type Role = 'ADMIN' | 'AGENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
