import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  Code,
} from 'lucide-react';
import { templatesService } from '../../api/templates';
import { useNotifications } from '../../context/NotificationContext';
import { CertificatePreviewCanvas } from '../../components/common/CertificatePreviewCanvas';
import { CertificateTemplate } from '../../types';

export const TemplateUploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<CertificateTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '')) {
      showToast('error', 'Unsupported Format', 'Please upload a PDF, PNG, JPG, or JPEG template.');
      return;
    }
    setSelectedFile(file);
    if (!templateName) {
      setTemplateName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await templatesService.uploadTemplate(selectedFile, templateName);
      if (res.success) {
        setCreatedTemplate(res.data);
        showToast('success', 'Template Created', 'Template registered. You can now map dynamic fields.');
      }
    } catch {
      showToast('error', 'Upload Error', 'Failed to upload certificate template.');
    } finally {
      setIsUploading(false);
    }
  };

  const placeholders = [
    { tag: '{{NAME}}', label: 'Participant Name', critical: true },
    { tag: '{{EMAIL}}', label: 'Student Email' },
    { tag: '{{STUDENT_ID}}', label: 'Student Identifier' },
    { tag: '{{ROLL_NO}}', label: 'Academic Roll Number' },
    { tag: '{{EVENT_NAME}}', label: 'Official Event Title' },
    { tag: '{{DATE}}', label: 'Issuance Date' },
    { tag: '{{CERTIFICATE_ID}}', label: 'Unique Verifiable ID' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/admin/templates"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-purple-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Templates</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Upload Certificate Template</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload the certificate design that will be personalized for each participant.
        </p>
      </div>

      {!createdTemplate ? (
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {/* File Uploader */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
              dragActive
                ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-4 ring-purple-500/20'
                : selectedFile
                ? 'border-purple-400 bg-white dark:bg-slate-900'
                : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-white dark:bg-slate-900 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Click to browse or drag and drop your certificate design
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supported: PDF, PNG, JPG, JPEG (High resolution 300 DPI recommended)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Template Label */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Template Display Name</label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. PyCore_Certificate_Template.pdf"
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Upload & Open Editor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Success Screen with preview & CTA to editor */
        <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-purple-300 dark:border-purple-800 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Template Uploaded Successfully
              </span>
              <h2 className="text-xl font-bold mt-1">{createdTemplate.name}</h2>
            </div>
            <button
              onClick={() => navigate('/admin/templates/editor')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 flex items-center gap-2"
            >
              <span>Launch Field Editor →</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <CertificatePreviewCanvas template={createdTemplate} />
          </div>
        </div>
      )}

      {/* Dynamic Placeholder Guide */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-sm">Supported Dynamic Placeholders</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Dynamic tags are automatically recognized and positioned on the certificate layout. The most
          important field is <span className="font-mono font-bold text-purple-600">{'{{NAME}}'}</span>.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {placeholders.map((p) => (
            <div
              key={p.tag}
              className={`p-3 rounded-xl border text-xs ${
                p.critical
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                {p.tag}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.label}</p>
              {p.critical && (
                <span className="inline-block mt-1 text-[9px] uppercase font-bold text-purple-600 font-mono">
                  Primary Field
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
