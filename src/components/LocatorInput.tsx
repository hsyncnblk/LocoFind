import React from 'react';
import type { Platform } from '../types';
import { Hash, Zap, ScanSearch } from 'lucide-react';

interface LocatorInputProps {
  platform: Platform;
  lineNumber: string;
  isProcessing: boolean;
  onLineNumberChange: (value: string) => void;
  onGenerate: () => void;
  hasSource: boolean;
  totalLines: number;
}

export const LocatorInput: React.FC<LocatorInputProps> = ({
  platform,
  lineNumber,
  isProcessing,
  onLineNumberChange,
  onGenerate,
  hasSource,
  totalLines,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  const parsedLine = parseInt(lineNumber);
  const isValidLine = !isNaN(parsedLine) && parsedLine >= 1 && parsedLine <= totalLines;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    onLineNumberChange(val);
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15">
          <ScanSearch className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Satır Numarası ile Locator Üret</h2>
          <p className="text-xs text-slate-500">Soldaki XML'de elementin satır numarasını girin</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <Hash className="w-4 h-4" />
        </div>
        <input
          id="locator-value-input"
          type="text"
          inputMode="numeric"
          value={lineNumber}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={hasSource ? `Satır numarası girin (1-${totalLines})` : 'Önce XML yükleyin...'}
          className="input-field pl-10 pr-4 text-lg font-mono font-bold tracking-wider"
          autoComplete="off"
          spellCheck={false}
          disabled={!hasSource}
        />
      </div>

      {lineNumber && hasSource && (
        <div className="text-[11px] px-1 -mt-1">
          {isValidLine ? (
            <span className="text-emerald-400">
              ✓ Satır {parsedLine} seçildi — Enter ile locator üret
            </span>
          ) : (
            <span className="text-rose-400">
              ✕ Geçersiz satır numarası (1-{totalLines} arası olmalı)
            </span>
          )}
        </div>
      )}

      {!lineNumber && hasSource && (
        <div className="text-[11px] text-slate-600 -mt-1 px-1">
          Soldaki XML'deki satır numarasını yazın → En iyi locator otomatik üretilecek
        </div>
      )}

      <button
        id="verify-locator-btn"
        onClick={onGenerate}
        disabled={!hasSource || !isValidLine || isProcessing}
        className="btn-primary w-full"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analiz Ediliyor...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Satır {lineNumber || '?'} için Locator Üret
          </>
        )}
      </button>

      {!hasSource && (
        <p className="text-[11px] text-slate-600 text-center -mt-2">
          Önce XML/HTML kaynağını yükleyin
        </p>
      )}
    </div>
  );
};
