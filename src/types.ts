export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  rollNumber?: string;
  year?: string;
  section?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
  issuedAt: string;
}

export type EventCategory = 'workshop' | 'hackathon' | 'bootcamp' | 'seminar';

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  tagline: string;
  description: string;
  organizer: string;
  coOrganizer?: string;
  dates: string;
  venue: string;
  targetAudience: string;
  price: number; // 0 for free
  capacity: number;
  registeredCount: number;
  topics: string[];
  schedule: {
    day: string;
    title: string;
    time: string;
    description: string;
  }[];
  speakers: {
    name: string;
    role: string;
    organization: string;
    avatar: string;
  }[];
  isFlagship?: boolean;
}

export interface StudentRegistration {
  id: string;
  registrationId: string; // e.g. WIDS26-00427
  fullName: string;
  email: string;
  phone: string;
  rollNumber: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  section: 'A' | 'B' | 'C' | 'D' | 'Other';
  eventId: string;
  eventTitle: string;
  ticketTier: string;
  ticketPrice: number;
  paymentStatus: 'free_confirmed' | 'paid' | 'pending';
  paymentId?: string;
  registeredAt: string;
  attended: boolean;
  checkInTime?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  eventId?: string;
  title: string;
  message: string;
  type: 'reminder' | 'update' | 'announcement' | 'urgent';
  createdAt: string;
  targetRole?: 'all' | 'students' | 'admin';
  isRead?: boolean;
}

export interface AnalyticsData {
  totalRegistrations: number;
  firstYearCount: number;
  secondYearCount: number;
  thirdYearCount: number;
  fourthYearCount: number;
  todayRegistrations: number;
  totalRevenue: number;
  sectionBreakdown: {
    A: number;
    B: number;
    C: number;
    D: number;
    Other: number;
  };
  eventBreakdown: {
    eventId: string;
    title: string;
    count: number;
    capacity: number;
  }[];
  attendanceRate: number;
  dailyRegistrations: {
    date: string;
    rawDate?: string;
    count: number;
    cumulative?: number;
    byEvent?: Record<string, number>;
  }[];
}

export interface WorkerNodeMetrics {
  nodeId: string;
  status: 'healthy' | 'busy' | 'rebalancing';
  activeConnections: number;
  requestsHandled: number;
  cpuUsage: number;
  memoryUsage: number;
  avgLatencyMs: number;
  lastHeartbeat: string;
}

export interface LoadBalancerMetrics {
  totalRequestsHandled: number;
  requestsPerSecond: number;
  averageLatencyMs: number;
  activeConcurrentUsers: number;
  clusterHealth: 'optimal' | 'high_load' | 'critical';
  algorithm: 'Round Robin with Weighted Least Connections';
  nodes: WorkerNodeMetrics[];
  p99LatencyMs: number;
  errorRate: number;
}

export interface EventQrInfo {
  eventId: string;
  title: string;
  category: EventCategory;
  dates: string;
  venue: string;
  token: string;
  capacity: number;
  registeredCount: number;
  attendedCount: number;
  recentCheckins: StudentRegistration[];
}

export interface VenueCheckInResult {
  success: boolean;
  alreadyCheckedIn?: boolean;
  newlyCheckedIn?: boolean;
  message: string;
  student: StudentRegistration;
  checkInTime: string;
  event: {
    id: string;
    title: string;
    venue: string;
    dates: string;
  };
}

export * from './types/index';
