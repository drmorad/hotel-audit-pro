
export type View = 'dashboard' | 'audit' | 'auditList' | 'incidents' | 'sop' | 'admin' | 'collections' | 'reports';

// Changed from Enum to string to allow dynamic creation in Admin panel
export type Department = string;

export const DefaultDepartments = {
  Kitchen: 'Kitchen',
  Housekeeping: 'Housekeeping',
  FrontOffice: 'Front Office',
  Maintenance: 'Maintenance',
};

export type UserRole = 'admin' | 'staff';
export type UserStatus = 'active' | 'on-hold';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  department?: Department;
  status: UserStatus;
}

export enum AuditStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum InspectionResult {
  Pass = 'Pass',
  Fail = 'Fail',
  NA = 'N/A',
}

export interface InspectionItem {
  id: string;
  description: string;
  result?: InspectionResult; // Made optional to represent 'Pending'/Unassigned state
  temperature?: number | null;
  photo?: string | null; // Base64 string of the image
  notes: string;
  assignee?: string; // New field for task assignment
}

export interface Audit {
  id: string;
  title: string;
  department: Department;
  status: AuditStatus;
  items: InspectionItem[];
  dueDate: string;
  completedDate?: string;
  hotelName?: string; // Added for multi-hotel support
}

export interface AuditTemplate {
  id: string;
  title: string;
  department: Department;
  items: { description: string; assignee?: string }[];
}

export enum IncidentStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Verified = 'Verified',
}

export enum IncidentPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Critical = 'Critical',
}

export enum IncidentType {
    Emergency = 'Emergency',
    DailyLog = 'Daily Log'
}

export interface IncidentActivity {
    id: string;
    timestamp: string;
    action: string; // e.g., 'Reported', 'Status Update', 'Comment'
    user: string;
    details?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  department: Department;
  assignee: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  type: IncidentType;
  reportedAt: string;
  photo?: string | null; // Base64 string of the image
  history: IncidentActivity[]; // New field for audit trail
}

export type NewIncidentData = Omit<Incident, 'id' | 'status' | 'reportedAt' | 'history'>;

export interface ChartDataPoint {
    name: string;
    score: number;
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  content: string;
  document?: string; // Base64 string or URL
  documentName?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  templateIds: string[];
  sopIds: string[];
}
