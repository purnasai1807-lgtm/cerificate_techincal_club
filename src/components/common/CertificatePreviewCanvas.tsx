import React, { useEffect, useRef, useState } from 'react';
import { CertificateTemplate, TemplateFieldConfig } from '../../types';
import { Award, ShieldCheck, QrCode } from 'lucide-react';
import { API_BASE_URL, getAuthToken } from '../../api/client';

interface CertificatePreviewCanvasProps {
  template: CertificateTemplate;
  sampleData?: {
    name?: string;
    email?: string;
    studentId?: string;
    rollNumber?: string;
    eventName?: string;
    date?: string;
    certificateId?: string;
  };
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  onFieldPositionChange?: (fieldId: string, xPercent: number, yPercent: number) => void;
  interactive?: boolean;
}

export const CertificatePreviewCanvas: React.FC<CertificatePreviewCanvasProps> = ({
  template,
  sampleData = {},
  selectedFieldId = null,
  onSelectField,
  onFieldPositionChange,
  interactive = false,
}) => {
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ fieldId: string; pointerId: number } | null>(null);
  const rawPreviewUrl = (template as CertificateTemplate & { previewUrl?: string }).previewUrl || template.fileUrl || '';
  const fileType = String(template.fileType || '').toLowerCase();

  const resolvePreviewUrl = (value: string) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/api/v1') && /^https?:\/\//i.test(API_BASE_URL)) {
      return `${API_BASE_URL}${value.slice('/api/v1'.length)}`;
    }
    if (value.startsWith('/')) return value;
    return new URL(value, window.location.origin).toString();
  };

  const uploadedPreviewUrl = resolvePreviewUrl(rawPreviewUrl);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    if (!uploadedPreviewUrl) {
      setPreviewBlobUrl(null);
      return;
    }

    const token = getAuthToken();
    const fetchPreview = async () => {
      try {
        const response = await fetch(uploadedPreviewUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error(`Preview request failed: ${response.status}`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!isCancelled) {
          setPreviewBlobUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (!isCancelled) setPreviewBlobUrl(null);
      }
    };

    fetchPreview();

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [uploadedPreviewUrl, template.uploadedAt]);

  if (previewBlobUrl && !interactive) {
    if (['png', 'jpg', 'jpeg'].includes(fileType)) {
      return (
        <div className="relative w-full aspect-[1.414/1] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img src={previewBlobUrl} alt={template.name} className="h-full w-full object-contain" />
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="relative w-full aspect-[1.414/1] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <embed src={previewBlobUrl} type="application/pdf" className="h-full w-full" />
        </div>
      );
    }
  }

  const getFieldValue = (field: TemplateFieldConfig): string => {
    switch (field.fieldKey) {
      case 'NAME':
        return sampleData.name || '';
      case 'EVENT_NAME':
        return sampleData.eventName || '';
      case 'CERTIFICATE_ID':
        return sampleData.certificateId || '';
      case 'DATE':
        return sampleData.date || '';
      case 'ROLL_NO':
        return sampleData.rollNumber ? `Roll No: ${sampleData.rollNumber}` : '';
      case 'STUDENT_ID':
        return sampleData.studentId ? `Student ID: ${sampleData.studentId}` : '';
      case 'EMAIL':
        return sampleData.email || '';
      default:
        return field.placeholder;
    }
  };

  const updateDraggedPosition = (fieldId: string, clientX: number, clientY: number) => {
    if (!canvasRef.current || !onFieldPositionChange) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onFieldPositionChange(fieldId, Number(x.toFixed(2)), Number(y.toFixed(2)));
  };

  return (
    <div ref={canvasRef} className="relative w-full aspect-[1.414/1] bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-300 select-none">
      {previewBlobUrl && ['png', 'jpg', 'jpeg'].includes(fileType) && (
        <img
          src={previewBlobUrl}
          alt={template.name}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        />
      )}

      {!previewBlobUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-slate-400 pointer-events-none">
          <div>
            <p className="text-sm font-semibold">No uploaded certificate preview</p>
            <p className="text-xs mt-1">Upload a real template to preview the certificate background.</p>
          </div>
        </div>
      )}

      {/* Dynamic Fields Layer */}
      {template.fields
        .filter((f) => f.visible)
        .map((field) => {
          const isSelected = selectedFieldId === field.id;
          const val = getFieldValue(field);

          return (
            <div
              key={field.id}
              onPointerDown={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onSelectField?.(field.id);
                if (onFieldPositionChange) {
                  dragRef.current = { fieldId: field.id, pointerId: e.pointerId };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={(e) => {
                if (!interactive || !dragRef.current || dragRef.current.fieldId !== field.id || dragRef.current.pointerId !== e.pointerId) return;
                e.preventDefault();
                updateDraggedPosition(field.id, e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                if (dragRef.current?.pointerId === e.pointerId) {
                  dragRef.current = null;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              }}
              onPointerCancel={() => { dragRef.current = null; }}
              onClick={(e) => {
                if (interactive) {
                  e.stopPropagation();
                  onSelectField?.(field.id);
                }
              }}
              style={{
                position: 'absolute',
                left: `${field.xPercent}%`,
                top: `${field.yPercent}%`,
                transform:
                  field.textAlign === 'center'
                    ? 'translate(-50%, -50%)'
                    : field.textAlign === 'right'
                    ? 'translate(-100%, -50%)'
                    : 'translate(0, -50%)',
                fontSize: `${field.fontSize * 0.75}px`,
                fontWeight: field.fontWeight,
                fontFamily: field.fontFamily,
                color: field.color,
                textAlign: field.textAlign,
                cursor: interactive ? 'grab' : 'default',
                touchAction: interactive ? 'none' : undefined,
              }}
              className={`transition-all ${
                interactive
                  ? 'hover:ring-2 hover:ring-purple-400 hover:ring-offset-2 p-1 rounded'
                  : ''
              } ${
                isSelected
                  ? 'ring-2 ring-purple-600 ring-offset-2 bg-purple-50/50 shadow-sm'
                  : ''
              }`}
            >
              {val}
              {interactive && isSelected && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-1 py-0.2 bg-purple-600 text-[9px] font-sans text-white rounded shadow uppercase">
                  {field.placeholder}
                </span>
              )}
            </div>
          );
        })}



    </div>
  );
};
