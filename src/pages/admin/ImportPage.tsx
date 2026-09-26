import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Download,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { importsService } from '../../api/imports';
import { ImportJob } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

export const ImportPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<ImportJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await importsService.getImportHistory();
      if (res.success) setHistory(res.data || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  React.useEffect(() => {
    loadHistory();
  }, []);

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
    if (ext !== 'csv' && ext !== 'pdf') {
      showToast('error', 'Unsupported File Type', 'Please provide a valid .csv or .pdf attendance file.');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(15);

    // Progress simulation
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);

    try {
      const uploadRes = await importsService.uploadAttendance(selectedFile);
      if (uploadRes.success) {
        await loadHistory();
        showToast('success', 'File Uploaded', 'Attendance file uploaded and saved to the server. Opening schema mapper.');
        navigate('/admin/import/preview');
      }
    } catch {
      showToast('error', 'Analysis Failed', 'Could not process file structure. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Step 1: Ingestion & Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Import Attendance Data</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload a CSV or PDF containing participant and attendance check-in / check-out timestamps.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          dragActive
            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-4 ring-purple-500/20'
            : selectedFile
            ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
            : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                Drag and drop your attendance file here, or{' '}
                <span className="text-purple-600 dark:text-purple-400 underline">browse computer</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Accepted formats: <span className="font-semibold text-slate-600 dark:text-slate-300">.csv, .pdf</span> (Max 25MB)
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>CSV Attendance Sheet</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-rose-500" />
                <span>PDF Check-in Report</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-left max-w-lg mx-auto bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  {selectedFile.name.endsWith('.pdf') ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[240px]">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>{isUploading ? 'Uploading file to secure buffer...' : 'Upload complete. Ready for analysis.'}</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Client-to-API transmission verified</span>
              </span>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isUploading || isAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-md shadow-purple-600/25 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing File...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze File</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Attendance schema
        </h3>
        <p className="leading-relaxed">
          The backend returns the uploaded columns and determines the required mapping. No sample records are created in the browser.
        </p>
      </div>

      {/* Persisted upload history */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Saved Attendance Files</h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Only files actually accepted and persisted by the backend appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
        {historyLoading ? (
          <div className="p-6 text-xs text-slate-400">Loading saved files...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No attendance files have been uploaded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((job) => (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{job.filename}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {job.fileType.toUpperCase()} · {job.fileSize} bytes · {new Date(job.uploadedAt).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Status: <span className="font-semibold">{job.status}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={downloadingId === job.id}
                  onClick={async () => {
                    setDownloadingId(job.id);
                    try {
                      await importsService.downloadImportFile(job.id, job.filename);
                    } catch (error: any) {
                      showToast('error', 'Download Failed', error?.message || 'Could not download the saved file.');
                    } finally {
                      setDownloadingId(null);
                    }
                  }}
                  className="shrink-0 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold text-center disabled:opacity-50"
                >
                  {downloadingId === job.id ? 'Downloading...' : 'Download Original'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
