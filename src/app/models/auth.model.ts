export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  role: UserRole;
  email: string;
}
