import React from 'react';
import type { Platform } from '../types';
import type { DetectionResult } from '../utils/locatorDetector';
import { detectLocatorStrategy, getDetectionBadgeColor } from '../utils/locatorDetector';
import { Search, Zap, Sparkles, Brain } from 'lucide-react';

interface LocatorInputProps {
  platform: Platform;
  locatorValue: string;
  isProcessing: boolean;
  onValueChange: (value: string) => void;
  onVerify: () => void;
  hasSource: boolean;
}

const platformPlaceholders: Record<string, string> = {
  ios: "Örn: //XCUIElementTypeButton[@name='Login'] veya Login Button veya type == 'XCUIElementTypeButton'",
  android: "Örn: com.app:id/btn_login veya //android.widget.Button veya Giriş Yap",
  web: "Örn: #login-form veya .btn-primary veya //button[@type='submit']",
};

export const LocatorInput: React.FC<LocatorInputProps> = ({
  platform,
  locatorValue,
  isProcessing,
  onValueChange,
  onVerify,
  hasSource,
}) => {
  const detection: DetectionResult | null = locatorValue.trim()
    ? detectLocatorStrategy(platform, locatorValue)
    : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onVerify();
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Akıllı Locator Analizi</h2>
            <p className="text-xs text-slate-500">Locator yazın, strateji otomatik algılansın</p>
          </div>
        </div>
        {detection && (
          <div
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border
              transition-all duration-300 animate-fade-in
              ${getDetectionBadgeColor(detection.confidence)}
            `}
          >
            <Sparkles className="w-3 h-3" />
            {detection.label}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="locator-value-input"
          type="text"
          value={locatorValue}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={platformPlaceholders[platform] || 'Locator ifadesini girin...'}
          className="input-field pl-10 pr-4 font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {detection && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 -mt-1 px-1">
          <Sparkles className="w-3 h-3 text-brand-400/50 flex-shrink-0" />
          <span>{detection.reason}</span>
          <span className="ml-auto text-brand-400/60">Ctrl+Enter ile doğrula</span>
        </div>
      )}

      {!detection && (
        <div className="text-[11px] text-slate-600 -mt-1 px-1">
          Locator girin → strateji otomatik algılanacak
          <span className="ml-2 text-slate-700">|</span>
          <span className="ml-2 text-brand-400/60">Ctrl+Enter ile doğrula</span>
        </div>
      )}

      <button
        id="verify-locator-btn"
        onClick={onVerify}
        disabled={!hasSource || !locatorValue.trim() || isProcessing}
        className="btn-primary w-full"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Doğrulanıyor...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Locator'ı Doğrula
          </>
        )}
      </button>

      {(!hasSource || !locatorValue.trim()) && (
        <p className="text-[11px] text-slate-600 text-center -mt-2">
          {!hasSource
            ? 'Önce XML/HTML kaynağını yükleyin'
            : 'Locator ifadesini girin'}
        </p>
      )}
    </div>
  );
};
