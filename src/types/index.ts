export type EligibilityStatus = 'PENDING' | 'ELIGIBLE' | 'NOT_ELIGIBLE';

export type CertificateStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'GENERATING'
  | 'GENERATED'
  | 'EMAIL_QUEUED'
  | 'SENT'
  | 'FAILED';

export interface Participant {
  id: string;
  name: string;
  email: string;
  studentId: string;
  rollNumber: string;
  checkIn: string | null; // e.g. '09:15 AM' or null
  checkOut: string | null; // e.g. '04:30 PM' or null
  checkInTime?: string;
  checkOutTime?: string;
  department?: string;
  year?: string;
  eligibility: EligibilityStatus;
  eligibilityReason?: string;
  certificateStatus: CertificateStatus;
  certificateId?: string;
}

export interface TemplateFieldConfig {
  id: string;
  fieldKey: 'NAME' | 'EMAIL' | 'STUDENT_ID' | 'ROLL_NO' | 'EVENT_NAME' | 'DATE' | 'CERTIFICATE_ID';
  label: string;
  placeholder: string;
  xPercent: number; // 0 to 100 percentage from left
  yPercent: number; // 0 to 100 percentage from top
  fontSize: number; // in pt / px
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily: 'Cinzel' | 'Playfair Display' | 'Inter' | 'Plus Jakarta Sans' | 'Great Vibes';
  fontStyle?: 'normal' | 'italic' | 'bold' | 'bold italic';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  visible: boolean;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  fileUrl?: string;
  previewUrl?: string;
  fileType: 'pdf' | 'png' | 'jpg' | 'jpeg' | 'PDF' | 'PNG' | 'JPG' | 'JPEG';
  active: boolean;
  uploadedAt: string;
  usageCount: number;
  fields: TemplateFieldConfig[];
  previewThumbnail?: string;
}

export interface Certificate {
  id: string;
  certificateId: string; // e.g. "CERT-2026-001"
  participantId: string;
  participantName: string;
  participantEmail: string;
  participantRollNumber: string;
  participantStudentId: string;
  checkIn?: string | null;
  checkOut?: string | null;
  templateId: string;
  templateName?: string;
  status: CertificateStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  generatedAt?: string;
  sentAt?: string;
  certificateUrl?: string;
  emailDeliveryStatus?: 'QUEUED' | 'SENT' | 'FAILED';
  failureReason?: string;
  retryCount?: number;
  eventName: string;
  issueDate: string;
  createdAt?: string;
  sentToEmail?: string;
  participant?: Participant;
}

export type EmailDeliveryStatus = 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface EmailLog {
  id: string;
  certificateId: string;
  recipient: string;
  studentName: string;
  status: EmailDeliveryStatus;
  createdAt?: string;
  sentAt: string | null;
  attempts: number;
  error?: string;
  subject: string;
  body: string;
  attachmentFilename?: string;
}

export interface ImportJob {
  id: string;
  filename: string;
  fileType: 'csv' | 'pdf' | 'CSV' | 'PDF';
  fileSize: string;
  uploadedAt: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  missingNames: number;
  missingEmails: number;
  missingIds: number;
  missingRollNumbers: number;
  missingCheckIn: number;
  missingCheckOut: number;
  status: 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'VALIDATED' | 'COMPLETED' | 'IMPORTED' | 'FAILED';
  columns: string[];
  records: Participant[];
  rawRows?: Record<string, string>[];
}

export interface ColumnMapping {
  detectedColumn: string;
  sampleValue: string;
  mappedField: 'name' | 'email' | 'studentId' | 'rollNumber' | 'checkIn' | 'checkOut' | 'ignore';
}

export interface AuditLog {
  id: string;
  action:
    | 'FILE_UPLOADED'
    | 'FILE_PROCESSED'
    | 'TEMPLATE_UPLOADED'
    | 'TEMPLATE_UPDATED'
    | 'TEMPLATE_CHANGED'
    | 'PARTICIPANT_IMPORTED'
    | 'CERTIFICATE_APPROVED'
    | 'CERTIFICATE_REJECTED'
    | 'CERTIFICATE_GENERATED'
    | 'EMAIL_SENT'
    | 'EMAIL_FAILED'
    | 'SETTINGS_UPDATED';
  admin: string;
  record: string;
  date: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface SystemSettings {
  eventName: string;
  organizationName: string;
  certificateIdPrefix: string;
  issueDate: string;
  activeTemplateId: string;
  requireCheckIn: boolean;
  requireCheckOut: boolean;
  senderName: string;
  replyToAddress: string;
  emailSubject: string;
  emailBodyTemplate: string;
  mfaEnabled: boolean;
  sessionTimeoutMinutes: number;
  dataEncryption: 'AES-256 (In-Transit & At-Rest)';
  backupSchedule: 'Automated Daily Snapshot';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  avatarUrl?: string;
  lastLogin: string;
}

export interface DashboardStats {
  participants: number;
  eligible: number;
  ineligible: number;
  pending: number;
  approved: number;
  rejected: number;
  generated: number;
  sent: number;
  failed: number;
}

export interface BackgroundJob {
  jobId: string;
  type: 'CERTIFICATE_GENERATION' | 'EMAIL_DELIVERY' | 'BULK_APPROVAL' | 'BULK_DOWNLOAD';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number | null;
  certificateUrl?: string | null;
  downloadUrl?: string | null;
  total?: number;
  processed?: number;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
