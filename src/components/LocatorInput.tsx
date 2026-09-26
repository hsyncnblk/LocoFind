import React from 'react';
import type { Platform, LocatorStrategy, StrategyOption } from '../types';
import { getStrategiesForPlatform } from '../utils/helpers';
import { Search, Crosshair, Zap } from 'lucide-react';

interface LocatorInputProps {
  platform: Platform;
  strategy: LocatorStrategy;
  locatorValue: string;
  isProcessing: boolean;
  onStrategyChange: (strategy: LocatorStrategy) => void;
  onValueChange: (value: string) => void;
  onVerify: () => void;
  hasSource: boolean;
}

const strategyPlaceholders: Record<string, string> = {
  xpath: "//android.widget.Button[@resource-id='login_btn']",
  'accessibility-id': 'Login Button',
  'predicate-string': "type == 'XCUIElementTypeButton' AND name == 'Login'",
  'class-chain': "**/XCUIElementTypeButton[`name == 'Login'`]",
  'resource-id': 'com.app:id/btn_login',
  text: 'Giriş Yap',
  'css-selector': 'button.submit-btn[type="submit"]',
  id: 'login-form',
  name: 'username',
  'class-name': 'btn-primary',
};

export const LocatorInput: React.FC<LocatorInputProps> = ({
  platform,
  strategy,
  locatorValue,
  isProcessing,
  onStrategyChange,
  onValueChange,
  onVerify,
  hasSource,
}) => {
  const strategies: StrategyOption[] = getStrategiesForPlatform(platform);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onVerify();
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15">
          <Crosshair className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Locator Stratejisi</h2>
          <p className="text-xs text-slate-500">Doğrulamak istediğiniz locator ifadesini girin</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {strategies.map((s) => (
          <button
            key={s.value}
            id={`strategy-${s.value}`}
            onClick={() => onStrategyChange(s.value)}
            title={s.description}
            className={`
              tab-pill text-xs
              ${strategy === s.value ? 'tab-pill-active' : 'tab-pill-inactive'}
            `}
          >
            {s.label}
          </button>
        ))}
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
          placeholder={strategyPlaceholders[strategy] || 'Locator ifadesini girin...'}
          className="input-field pl-10 pr-4 font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="text-[11px] text-slate-500 -mt-1 px-1">
        {strategies.find((s) => s.value === strategy)?.description}
        <span className="ml-2 text-slate-600">|</span>
        <span className="ml-2 text-brand-400/60">Ctrl+Enter ile doğrula</span>
      </div>

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
