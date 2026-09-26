import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, FileCode, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

interface InputPanelProps {
  xmlSource: string;
  fileName: string | null;
  onSourceChange: (source: string, fileName?: string) => void;
  parseErrors: { type: string; message: string }[];
  nodeCount: number;
  parseTimeMs: number;
  highlightLine?: number | null;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  xmlSource,
  fileName,
  onSourceChange,
  parseErrors,
  nodeCount,
  parseTimeMs,
  highlightLine,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(true);

  const lines = xmlSource ? xmlSource.split('\n') : [];
  const lineCount = lines.length;

  useEffect(() => {
    if (xmlSource && showUpload) setShowUpload(false);
    if (!xmlSource && !showUpload) setShowUpload(true);
  }, [xmlSource, showUpload]);

  useEffect(() => {
    if (highlightLine && textareaRef.current && lineNumbersRef.current) {
      const lineHeight = 18;
      const scrollTo = (highlightLine - 1) * lineHeight - 80;
      textareaRef.current.scrollTop = Math.max(0, scrollTo);
      lineNumbersRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [highlightLine]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validExts = ['.xml', '.txt', '.html', '.htm'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!validExts.includes(ext)) {
        alert(`Desteklenmeyen dosya formatı. Kabul edilen: ${validExts.join(', ')}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onSourceChange(content, file.name);
      };
      reader.readAsText(file, 'UTF-8');
    },
    [onSourceChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const clearSource = useCallback(() => {
    onSourceChange('', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowUpload(true);
  }, [onSourceChange]);

  const warnings = parseErrors.filter((e) => e.type === 'warning');
  const errors = parseErrors.filter((e) => e.type === 'error');

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/15">
            <FileCode className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              XML / HTML Kaynağı
            </h2>
            <p className="text-xs text-slate-500">Sayfa hiyerarşisini yükleyin — satır numarasını sağda girin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {xmlSource && (
            <>
              <span className="text-[10px] text-slate-600 font-mono">
                {lineCount} satır · {formatFileSize(new Blob([xmlSource]).size)}
              </span>
              <button
                id="clear-source-btn"
                onClick={clearSource}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Temizle
              </button>
            </>
          )}
        </div>
      </div>

      {showUpload && !xmlSource && (
        <div
          id="file-drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed 
            cursor-pointer transition-all duration-200
            ${
              isDragOver
                ? 'border-brand-500/50 bg-brand-500/5 scale-[1.01]'
                : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
            }
          `}
        >
          <Upload
            className={`w-7 h-7 transition-colors ${isDragOver ? 'text-brand-400' : 'text-slate-500'}`}
          />
          <div className="text-center">
            <p className="text-sm text-slate-300 font-medium">
              {isDragOver ? 'Dosyayı bırakın' : 'Dosya sürükleyin veya tıklayın'}
            </p>
            <p className="text-xs text-slate-500 mt-1">.xml, .txt, .html desteklenir</p>
          </div>
          {fileName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-medium">
              <FileCode className="w-3.5 h-3.5" />
              {fileName}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.txt,.html,.htm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {xmlSource && (
        <div className="relative rounded-lg border border-white/[0.06] overflow-hidden bg-surface-900/60">
          {fileName && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] bg-surface-800/40">
              <FileCode className="w-3 h-3 text-brand-400" />
              <span className="text-[10px] text-slate-400 font-medium">{fileName}</span>
            </div>
          )}
          <div className="flex" style={{ height: '380px' }}>
            <div
              ref={lineNumbersRef}
              className="flex-shrink-0 overflow-hidden select-none border-r border-white/[0.04] bg-surface-800/30"
              style={{ width: '48px' }}
            >
              <div className="py-2">
                {lines.map((_, i) => {
                  const lineNum = i + 1;
                  const isHighlighted = highlightLine === lineNum;
                  return (
                    <div
                      key={lineNum}
                      className={`
                        px-2 text-right font-mono leading-[18px] text-[11px] transition-colors
                        ${isHighlighted
                          ? 'bg-brand-500/20 text-brand-400 font-bold'
                          : 'text-slate-600'}
                      `}
                    >
                      {lineNum}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <textarea
                ref={textareaRef}
                id="xml-source-input"
                value={xmlSource}
                onChange={(e) => onSourceChange(e.target.value)}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full bg-transparent text-slate-300 font-mono text-[11px] leading-[18px] py-2 px-3 resize-none outline-none border-none"
                spellCheck={false}
                style={{
                  lineHeight: '18px',
                }}
              />

              {highlightLine && highlightLine <= lineCount && (
                <div
                  className="absolute left-0 right-0 pointer-events-none bg-brand-500/[0.07] border-l-2 border-brand-500"
                  style={{
                    top: `${(highlightLine - 1) * 18 + 8}px`,
                    height: '18px',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {!xmlSource && !showUpload && (
        <div className="relative">
          <textarea
            id="xml-source-input"
            value={xmlSource}
            onChange={(e) => onSourceChange(e.target.value)}
            placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<hierarchy rotation="0">\n  <android.widget.FrameLayout ...>\n    ...\n  </android.widget.FrameLayout>\n</hierarchy>`}
            className="input-field font-mono text-xs leading-relaxed resize-none min-h-[220px] max-h-[400px]"
            spellCheck={false}
          />
        </div>
      )}

      {xmlSource && (
        <div className="flex flex-col gap-2">
          {nodeCount > 0 && errors.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <strong>{nodeCount.toLocaleString()}</strong> element parse edildi ({parseTimeMs.toFixed(1)} ms)
              </span>
            </div>
          )}

          {warnings.map((w, i) => (
            <div
              key={`warning-${i}`}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{w.message}</span>
            </div>
          ))}

          {errors.map((err, i) => (
            <div
              key={`error-${i}`}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs"
            >
              <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
