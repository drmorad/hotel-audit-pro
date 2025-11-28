import type { Audit, Incident, ChartDataPoint, SOP, AuditTemplate, Collection, User } from './types';
import { DefaultDepartments, AuditStatus, InspectionResult, IncidentStatus, IncidentPriority, IncidentType } from './types';

export const STAFF_MEMBERS = [
  'Jane Doe',
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'Diana Prince',
  'Maria Garcia',
  'John Doe',
  'Sarah Lee'
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Jane Doe',
    role: 'admin',
    avatar: 'JD',
    department: 'Management',
    status: 'active'
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    role: 'staff',
    avatar: 'BS',
    department: 'Kitchen',
    status: 'active'
  }
];

export const mockAudits: Audit[] = [
  {
    id: 'audit-1',
    title: 'Morning Kitchen Prep Audit',
    department: DefaultDepartments.Kitchen,
    status: AuditStatus.Pending,
    dueDate: '2024-08-15',
    items: [
      { id: 'item-1-1', description: 'Refrigerator temperatures below 40°F/4°C', notes: '', assignee: 'Alice Johnson' },
      { id: 'item-1-2', description: 'All food surfaces sanitized', notes: '', assignee: 'Bob Smith' },
      { id: 'item-1-3', description: 'Hand washing stations stocked and clean', notes: '' },
      { id: 'item-1-4', description: 'Proper food labeling and dating', notes: '' },
    ],
  },
  {
    id: 'audit-2',
    title: 'Room 201 Turnover Inspection',
    department: DefaultDepartments.Housekeeping,
    status: AuditStatus.Pending,
    dueDate: '2024-08-15',
    items: [
      { id: 'item-2-1', description: 'Bed linens are fresh and wrinkle-free', notes: '', assignee: 'Maria Garcia' },
      { id: 'item-2-2', description: 'Bathroom surfaces sanitized and polished', notes: '', assignee: 'Maria Garcia' },
      { id: 'item-2-3', description: 'No dust on surfaces (headboard, tables, lamps)', notes: '' },
      { id: 'item-2-4', description: 'Trash cans empty and clean', notes: '' },
      { id: 'item-2-5', description: 'Welcome amenities correctly placed', notes: '' },
    ],
  },
  {
    id: 'audit-3',
    title: 'Lobby & Entrance Cleanliness Check',
    department: DefaultDepartments.FrontOffice,
    status: AuditStatus.Completed,
    dueDate: '2024-08-14',
    completedDate: '2024-08-14',
    items: [
      { id: 'item-3-1', description: 'Glass doors are free of smudges', result: InspectionResult.Pass, notes: 'Looks good.', assignee: 'John Doe' },
      { id: 'item-3-2', description: 'Floors are clean and dry', result: InspectionResult.Pass, notes: '', assignee: 'John Doe' },
      { id: 'item-3-3', description: 'Reception desk is tidy and organized', result: InspectionResult.Pass, notes: '', assignee: 'Sarah Lee' },
      { id: 'item-3-4', description: 'Seating area is clean and inviting', result: InspectionResult.Fail, photo: 'https://picsum.photos/400/300', notes: 'Cushion out of place.', assignee: 'Sarah Lee' },
    ],
  },
];

export const mockTemplates: AuditTemplate[] = [
  {
    id: 'temp-1',
    title: 'Daily Kitchen Opening',
    department: DefaultDepartments.Kitchen,
    items: [
      { description: 'Check fridge temp', assignee: 'Alice Johnson' },
      { description: 'Sanitize food prep surfaces', assignee: 'Bob Smith' },
      { description: 'Verify dishwasher chemicals', assignee: 'Bob Smith' }
    ]
  },
  {
    id: 'temp-2',
    title: 'Standard Room Inspection',
    department: DefaultDepartments.Housekeeping,
    items: [
      { description: 'Check for dust on high surfaces', assignee: 'Maria Garcia' },
      { description: 'Ensure bathroom amenities stocked', assignee: 'Maria Garcia' },
      { description: 'Test TV and remote', assignee: 'Maria Garcia' }
    ]
  }
];

export const mockIncidents: Incident[] = [
  {
    id: 'inc-1',
    title: 'Pest Sighting in Kitchen',
    description: 'A small rodent was reported near the dry storage area.',
    department: DefaultDepartments.Kitchen,
    assignee: 'Exterminator Co.',
    status: IncidentStatus.InProgress,
    priority: IncidentPriority.Critical,
    type: IncidentType.Emergency,
    reportedAt: '2024-08-14T08:00:00Z',
    history: [
      {
        id: 'h1',
        timestamp: '2024-08-14T08:00:00Z',
        action: 'Reported',
        user: 'Jane Doe',
        details: 'Initial sighting reported.'
      }
    ]
  },
  {
    id: 'inc-2',
    title: 'Leaky Faucet in Room 305',
    description: 'Guest reported a constant drip from the bathroom sink.',
    department: DefaultDepartments.Maintenance,
    assignee: 'John Doe',
    status: IncidentStatus.Open,
    priority: IncidentPriority.Medium,
    type: IncidentType.DailyLog,
    reportedAt: '2024-08-15T10:15:00Z',
    history: [
      {
        id: 'h2',
        timestamp: '2024-08-15T10:15:00Z',
        action: 'Reported',
        user: 'Reception',
        details: 'Guest complaint logged.'
      }
    ]
  },
  {
    id: 'inc-3',
    title: 'Lobby carpet stain',
    description: 'Coffee spill near the main entrance that requires deep cleaning.',
    department: DefaultDepartments.Housekeeping,
    assignee: 'Cleaning Crew',
    status: IncidentStatus.Resolved,
    priority: IncidentPriority.Low,
    type: IncidentType.DailyLog,
    reportedAt: '2024-08-13T14:00:00Z',
    history: [
      {
        id: 'h3',
        timestamp: '2024-08-13T14:00:00Z',
        action: 'Reported',
        user: 'System',
        details: 'Automated log.'
      },
      {
        id: 'h4',
        timestamp: '2024-08-13T16:00:00Z',
        action: 'Resolved',
        user: 'Cleaning Crew',
        details: 'Stain removed.'
      }
    ]
  },
];

export const mockSops: SOP[] = [
    {
      id: 'sop-1',
      title: 'Kitchen Opening & Closing Procedures',
      category: 'Kitchen',
      content: 'Detailed checklist for daily kitchen setup and breakdown, including equipment checks, sanitation stations, and food storage protocols.'
    },
    {
      id: 'sop-2',
      title: 'Guest Room Deep Cleaning Standard',
      category: 'Housekeeping',
      content: 'Step-by-step guide for deep cleaning guest rooms, covering high-touch surfaces, UVC light usage, and linen handling.'
    },
    {
      id: 'sop-3',
      title: 'Biohazard Spill Response Protocol',
      category: 'All Departments',
      content: 'Emergency procedures for safely containing and cleaning biohazardous materials, including required PPE and disposal methods.'
    },
    {
        id: 'sop-4',
        title: 'Front Desk Hygiene & Safety',
        category: 'Front Office',
        content: 'Guidelines for maintaining a clean and safe reception area, including sanitizing key cards, managing guest queues, and handling luggage.'
    }
];

export const mockCollections: Collection[] = [
  {
    id: 'col-1',
    title: 'Kitchen Hygiene Pack',
    description: 'Complete set of checks and guides for kitchen safety and daily operations.',
    templateIds: ['temp-1'],
    sopIds: ['sop-1', 'sop-3']
  },
  {
    id: 'col-2',
    title: 'Housekeeping Excellence',
    description: 'Standard operating procedures and inspection templates for room turnover.',
    templateIds: ['temp-2'],
    sopIds: ['sop-2', 'sop-3']
  }
];

export const mockChartData: ChartDataPoint[] = [
    { name: 'Mon', score: 92 },
    { name: 'Tue', score: 95 },
    { name: 'Wed', score: 88 },
    { name: 'Thu', score: 97 },
    { name: 'Fri', score: 91 },
    { name: 'Sat', score: 94 },
    { name: 'Sun', score: 98 },
];