export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  role: UserRole;
  email: string;
  access_status?: string;
}
