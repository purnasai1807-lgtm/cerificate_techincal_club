import {
  Participant,
  CertificateTemplate,
  Certificate,
  EmailLog,
  AuditLog,
  SystemSettings,
  AdminUser,
  AppNotification,
  DashboardStats,
} from '../types';

export const INITIAL_ADMIN: AdminUser = {
  id: 'usr_admin_01',
  name: 'Administrator',
  email: 'purnasai0718@portal.admin',
  username: 'purnasai0718',
  role: 'ADMIN',
  lastLogin: new Date().toISOString(),
};

export const INITIAL_SETTINGS: SystemSettings = {
  eventName: '',
  organizationName: '',
  certificateIdPrefix: 'CERT',
  issueDate: '',
  activeTemplateId: '',
  requireCheckIn: true,
  requireCheckOut: true,
  senderName: '',
  replyToAddress: '',
  emailSubject: '',
  emailBodyTemplate: '',
  mfaEnabled: true,
  sessionTimeoutMinutes: 30,
  dataEncryption: 'AES-256 (In-Transit & At-Rest)',
  backupSchedule: 'Automated Daily Snapshot',
};

// ZERO fake/placeholder records by default — strictly data-driven
export const INITIAL_PARTICIPANTS: Participant[] = [];
export const INITIAL_CERTIFICATES: Certificate[] = [];
export const INITIAL_EMAIL_LOGS: EmailLog[] = [];
export const INITIAL_TEMPLATES: CertificateTemplate[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_DASHBOARD_STATS: DashboardStats = {
  participants: 0,
  eligible: 0,
  ineligible: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  generated: 0,
  sent: 0,
  failed: 0,
};
