import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Save,
  Eye,
  Sliders,
  Type,
  Move,
  CheckCircle2,
  Users,
  Sparkles,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { CertificateTemplate, TemplateFieldConfig, Participant } from '../../types';
import { templatesService } from '../../api/templates';
import { participantsService } from '../../api/participants';
import { settingsService } from '../../api/settings';
import { SystemSettings } from '../../types';
import { CertificatePreviewCanvas } from '../../components/common/CertificatePreviewCanvas';
import { useNotifications } from '../../context/NotificationContext';

const AVAILABLE_FIELD_TYPES: Array<{
  fieldKey: TemplateFieldConfig['fieldKey'];
  label: string;
  placeholder: string;
}> = [
  { fieldKey: 'NAME', label: 'Participant Name', placeholder: '{{NAME}}' },
  { fieldKey: 'EMAIL', label: 'Student Email', placeholder: '{{EMAIL}}' },
  { fieldKey: 'STUDENT_ID', label: 'Student Identifier', placeholder: '{{STUDENT_ID}}' },
  { fieldKey: 'ROLL_NO', label: 'Academic Roll Number', placeholder: '{{ROLL_NO}}' },
  { fieldKey: 'EVENT_NAME', label: 'Official Event Title', placeholder: '{{EVENT_NAME}}' },
  { fieldKey: 'DATE', label: 'Issuance Date', placeholder: '{{DATE}}' },
  { fieldKey: 'CERTIFICATE_ID', label: 'Unique Verifiable ID', placeholder: '{{CERTIFICATE_ID}}' },
];

export const TemplateEditorPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [sampleParticipants, setSampleParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({ eventName: '', organizationName: '', certificateIdPrefix: 'CERT', issueDate: '', activeTemplateId: '', requireCheckIn: true, requireCheckOut: true, senderName: '', replyToAddress: '', emailSubject: '', emailBodyTemplate: '' });

  useEffect(() => {
    let isMounted = true;

    const loadEditorData = async () => {
      try {
        const res = await templatesService.getTemplates();
        if (!isMounted) return;
        const tpls = res.data || [];
        const active = tpls.find((t) => t.active) || tpls[0] || null;
        setTemplate(active);
        setSelectedFieldId(active?.fields[0]?.id || null);
      } catch {
        setTemplate(null);
      }

      const settingsRes = await settingsService.getSettings();
      if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);

      const parts = await participantsService.getParticipants({ limit: 100 });
      if (parts.success && parts.data) {
        setSampleParticipants(parts.data.items);
        setSelectedParticipantId(parts.data.items[0]?.id || '');
      }
    };

    loadEditorData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentField = template?.fields.find((f) => f.id === selectedFieldId) || null;
  const sampleParticipant = sampleParticipants.find((p) => p.id === selectedParticipantId) || sampleParticipants[0];
  const usedFieldKeys = new Set((template?.fields || []).map((f) => f.fieldKey));
  const addableFieldTypes = AVAILABLE_FIELD_TYPES.filter((f) => !usedFieldKeys.has(f.fieldKey));

  const handleAddField = (fieldKey: TemplateFieldConfig['fieldKey']) => {
    if (!template) return;
    const meta = AVAILABLE_FIELD_TYPES.find((f) => f.fieldKey === fieldKey);
    if (!meta) return;
    const newField: TemplateFieldConfig = {
      id: `fld_${fieldKey.toLowerCase()}_${Date.now().toString(36)}`,
      fieldKey: meta.fieldKey,
      label: meta.label,
      placeholder: meta.placeholder,
      xPercent: 50,
      yPercent: 50,
      fontSize: 24,
      fontWeight: 'semibold',
      fontFamily: 'Playfair Display',
      fontStyle: 'normal',
      color: '#111827',
      textAlign: 'center',
      visible: true,
    };
    setTemplate({ ...template, fields: [...template.fields, newField] });
    setSelectedFieldId(newField.id);
  };

  const handleRemoveField = (fieldId: string) => {
    if (!template) return;
    const updatedFields = template.fields.filter((f) => f.id !== fieldId);
    setTemplate({ ...template, fields: updatedFields });
    setSelectedFieldId((current) => (current === fieldId ? updatedFields[0]?.id || null : current));
  };

  const handleUpdateFieldProperty = <K extends keyof TemplateFieldConfig>(
    key: K,
    val: TemplateFieldConfig[K]
  ) => {
    if (!template || !selectedFieldId) return;
    const updatedFields = template.fields.map((f) => {
      if (f.id === selectedFieldId) {
        return { ...f, [key]: val };
      }
      return f;
    });
    setTemplate({ ...template, fields: updatedFields });
  };

  const handleSave = async () => {
    if (!template) return;
    if (!template.fields.some((f) => f.fieldKey === 'NAME')) {
      showToast('error', 'Participant Name is required', 'Add the Participant Name field, position it on the certificate, and save before sending certificates.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await templatesService.updateTemplateFields(template.id, template.fields);
      if (res.success) {
        showToast('success', 'Mapping Saved', 'Certificate layout and coordinates saved.');
      }
    } catch {
      showToast('error', 'Save Failed', 'Failed to save field mapping.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!template) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading editor studio...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/templates"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">{template.name}</h1>
              {template.active && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any placeholder on the canvas to configure coordinates, font scale, and styling.
            </p>
          </div>
        </div>

        {/* Sample Participant Selector + Save Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs text-slate-400">Preview with:</span>
            <select
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              className="text-xs font-semibold bg-transparent focus:outline-none text-slate-800 dark:text-slate-200"
            >
              {sampleParticipants.slice(0, 8).map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">
                  {p.name} ({p.rollNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Coordinates</span>
          </button>
        </div>
      </div>

      {/* 3-Column Editor Layout: Toolbox (Left), Canvas (Center), Properties (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Field Toolbox (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Field Toolbox
            </h3>
            <span className="text-[10px] text-purple-600 font-mono">
              {template.fields.length} Placeholders
            </span>
          </div>

          <div className="space-y-2">
            {template.fields.length === 0 && (
              <div className="py-4 text-center text-[11px] text-slate-400 leading-relaxed">
                No placeholders yet. Add one below to start mapping fields onto the certificate.
              </div>
            )}
            {template.fields.map((field) => {
              const isSelected = selectedFieldId === field.id;
              return (
                <div
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {field.label}
                      </span>
                      {field.fieldKey === 'NAME' && (
                        <span className="text-[9px] uppercase px-1 py-0.2 bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {field.placeholder}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={field.visible}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleUpdateFieldProperty('visible', e.target.checked);
                      }}
                      title="Toggle field visibility on certificate"
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveField(field.id);
                      }}
                      title="Remove this placeholder"
                      className="text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {addableFieldTypes.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Add Placeholder
              </label>
              <select
                value=""
                onChange={(e) => {
                  const key = e.target.value as TemplateFieldConfig['fieldKey'];
                  if (key) handleAddField(key);
                }}
                className="w-full px-3 py-2 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-xs font-semibold text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">+ Choose a field to add...</option>
                {addableFieldTypes.map((f) => (
                  <option key={f.fieldKey} value={f.fieldKey}>
                    {f.label} ({f.placeholder})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed">
            Selecting a placeholder highlights its boundary on the canvas. Adjust position sliders on the right.
          </div>
        </div>

        {/* CENTER: Interactive Certificate Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-slate-100 dark:bg-slate-950/80 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[420px]">
            <CertificatePreviewCanvas
              template={template}
              selectedFieldId={selectedFieldId}
              onSelectField={(id) => setSelectedFieldId(id)}
              onFieldPositionChange={(id, xPercent, yPercent) => {
                setTemplate((current) => {
                  if (!current) return current;
                  return {
                    ...current,
                    fields: current.fields.map((field) =>
                      field.id === id ? { ...field, xPercent, yPercent } : field
                    ),
                  };
                });
              }}
              interactive={true}
              sampleData={{
                name: sampleParticipant?.name || '',
                email: sampleParticipant?.email || '',
                studentId: sampleParticipant?.studentId || '',
                rollNumber: sampleParticipant?.rollNumber || '',
                eventName: settings?.eventName || '',
                date: settings?.issueDate || '',
                certificateId: sampleParticipant?.certificateId || '',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Click any text to activate coordinate handles</span>
            <span className="font-mono">Aspect Ratio: 1.414 : 1 (A4 Landscape)</span>
          </div>
        </div>

        {/* RIGHT: Field Properties Inspector (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Field Properties
            </h3>
            {currentField && (
              <span className="text-[10px] font-mono uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                {currentField.fieldKey}
              </span>
            )}
          </div>

          {currentField ? (
            <div className="space-y-4 text-xs">
              {/* Field Label */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Placeholder Label
                </label>
                <input
                  type="text"
                  value={currentField.label}
                  onChange={(e) => handleUpdateFieldProperty('label', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Coordinates X & Y */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-400">Position X (Horizontal)</span>
                  <span className="font-mono font-bold text-purple-600">{currentField.xPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="X coordinate percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentField.xPercent}
                    onChange={(e) => handleUpdateFieldProperty('xPercent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                  <input
                    aria-label="X coordinate slider"
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentField.xPercent}
                    onChange={(e) => handleUpdateFieldProperty('xPercent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="flex-1 accent-purple-600"
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] pt-2">
                  <span className="font-semibold text-slate-400">Position Y (Vertical)</span>
                  <span className="font-mono font-bold text-purple-600">{currentField.yPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Y coordinate percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentField.yPercent}
                    onChange={(e) => handleUpdateFieldProperty('yPercent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                  <input
                    aria-label="Y coordinate slider"
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentField.yPercent}
                    onChange={(e) => handleUpdateFieldProperty('yPercent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="flex-1 accent-purple-600"
                  />
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="font-semibold text-slate-400">Font Size (pt)</span>
                    <span className="font-mono font-bold">{currentField.fontSize}pt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Font size in points"
                      type="number"
                      min="1"
                      max="200"
                      step="1"
                      value={currentField.fontSize}
                      onChange={(e) => handleUpdateFieldProperty('fontSize', Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                    <input
                      aria-label="Font size slider"
                      type="range"
                      min="1"
                      max="200"
                      value={currentField.fontSize}
                      onChange={(e) => handleUpdateFieldProperty('fontSize', Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                      className="flex-1 accent-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Font Style
                  </label>
                  <select
                    value={currentField.fontFamily}
                    onChange={(e) =>
                      handleUpdateFieldProperty(
                        'fontFamily',
                        e.target.value as TemplateFieldConfig['fontFamily']
                      )
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="Cinzel">Cinzel (Formal Capital)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Clean)</option>
                    <option value="Inter">Inter (Clean Sans)</option>
                    <option value="Great Vibes">Great Vibes (Calligraphic Signature)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Font Weight / Style
                  </label>
                  <select
                    value={currentField.fontStyle || 'normal'}
                    onChange={(e) =>
                      handleUpdateFieldProperty(
                        'fontStyle',
                        e.target.value as TemplateFieldConfig['fontStyle']
                      )
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                    <option value="bold">Bold</option>
                    <option value="bold italic">Bold Italic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Font Weight
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['normal', 'medium', 'semibold', 'bold'] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleUpdateFieldProperty('fontWeight', w)}
                        className={`py-1 rounded-lg capitalize text-xs font-medium border ${
                          currentField.fontWeight === w
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Text Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateFieldProperty('textAlign', 'left')}
                      className={`p-1.5 rounded-lg flex items-center justify-center border ${
                        currentField.textAlign === 'left'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFieldProperty('textAlign', 'center')}
                      className={`p-1.5 rounded-lg flex items-center justify-center border ${
                        currentField.textAlign === 'center'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFieldProperty('textAlign', 'right')}
                      className={`p-1.5 rounded-lg flex items-center justify-center border ${
                        currentField.textAlign === 'right'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentField.color}
                      onChange={(e) => handleUpdateFieldProperty('color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={currentField.color}
                      onChange={(e) => handleUpdateFieldProperty('color', e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Select a field from the toolbox or canvas to inspect properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
