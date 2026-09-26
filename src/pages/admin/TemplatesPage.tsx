import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  UploadCloud,
  FileCheck,
  Eye,
  Sliders,
  CheckCircle,
  Trash2,
  Calendar,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { CertificateTemplate } from '../../types';
import { templatesService } from '../../api/templates';
import { Modal } from '../../components/common/Modal';
import { CertificatePreviewCanvas } from '../../components/common/CertificatePreviewCanvas';
import { useNotifications } from '../../context/NotificationContext';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const loadTemplates = async () => {
    setIsLoading(true);
    const res = await templatesService.getTemplates();
    setTemplates(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSetActive = async (id: string) => {
    const res = await templatesService.setActiveTemplate(id);
    if (res.success) {
      showToast('success', 'Active Template Updated', res.message || 'Template set as active.');
      loadTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this certificate template?')) {
      const res = await templatesService.deleteTemplate(id);
      if (res.success) {
        showToast('info', 'Template Removed', 'Template successfully deleted.');
        loadTemplates();
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Design Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Certificate Templates</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage vector designs, dynamic field mappings, and active credential themes.
          </p>
        </div>

        <Link
          to="/admin/templates/upload"
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Template</span>
        </Link>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className={`rounded-3xl bg-white dark:bg-slate-900 border transition-all overflow-hidden flex flex-col justify-between shadow-sm ${
              tpl.active
                ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {/* Visual Canvas Thumbnail Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 relative group cursor-pointer"
                 onClick={() => setPreviewTemplate(tpl)}>
              <div className="w-full transform group-hover:scale-[1.01] transition-transform">
                <CertificatePreviewCanvas template={tpl} />
              </div>

              {tpl.active && (
                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-purple-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active Template</span>
                </div>
              )}
            </div>

            {/* Template Card Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {tpl.name}
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {tpl.fileType}
                  </span>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Uploaded {new Date(tpl.uploadedAt).toLocaleDateString()}</span>
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>{tpl.fields.length} Dynamic Fields Configured</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors"
                    title="Preview with sample recipient"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/admin/templates/editor')}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors"
                    title="Visual Field Editor"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                  {!tpl.active && (
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {tpl.active ? (
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>In Use</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetActive(tpl.id)}
                    className="px-3.5 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs font-semibold transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Template Preview: ${previewTemplate.name}`}
          subtitle="Preview using real imported participant data"
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <CertificatePreviewCanvas template={previewTemplate} />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setPreviewTemplate(null);
                  navigate('/admin/templates/editor');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open in Visual Field Editor</span>
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
