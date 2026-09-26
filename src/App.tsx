import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LandingPage } from './pages/public/LandingPage';
import { VerificationPage } from './pages/public/VerificationPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ImportPage } from './pages/admin/ImportPage';
import { ImportPreviewPage } from './pages/admin/ImportPreviewPage';
import { TemplatesPage } from './pages/admin/TemplatesPage';
import { TemplateUploadPage } from './pages/admin/TemplateUploadPage';
import { TemplateEditorPage } from './pages/admin/TemplateEditorPage';
import { CertificatesListPage } from './pages/admin/CertificatesListPage';
import { CertificateDetailPage } from './pages/admin/CertificateDetailPage';
import { ParticipantsPage } from './pages/admin/ParticipantsPage';
import { EmailLogsPage } from './pages/admin/EmailLogsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<VerificationPage />} />
              <Route path="/verify/:certificateId" element={<VerificationPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="import" element={<ImportPage />} />
                <Route path="import/preview" element={<ImportPreviewPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="templates/upload" element={<TemplateUploadPage />} />
                <Route path="templates/editor" element={<TemplateEditorPage />} />
                <Route path="certificates" element={<CertificatesListPage />} />
                <Route path="certificates/pending" element={<CertificatesListPage forcedStatus="PENDING" />} />
                <Route path="certificates/approved" element={<CertificatesListPage forcedStatus="APPROVED" />} />
                <Route path="certificates/rejected" element={<CertificatesListPage forcedStatus="REJECTED" />} />
                <Route path="certificates/sent" element={<CertificatesListPage forcedStatus="SENT" />} />
                <Route path="certificates/failed" element={<CertificatesListPage forcedStatus="FAILED" />} />
                <Route path="certificates/:id" element={<CertificateDetailPage />} />
                <Route path="participants" element={<ParticipantsPage />} />
                <Route path="emails" element={<EmailLogsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
