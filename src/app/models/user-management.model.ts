export interface AccessRequest {
  id: string;
  email: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
}

export interface AccessRequestListResponse {
  items: AccessRequest[];
  total: number;
}

export interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
}

export interface TeamMemberListResponse {
  items: TeamMember[];
  total: number;
}
