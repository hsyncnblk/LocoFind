import React, { useState } from 'react';
import type { Platform, LocatorStrategy } from '../types';
import type { CodeSnippets } from '../translators';
import { generateCodeSnippets } from '../translators';
import { Copy, Check, Code } from 'lucide-react';

interface CodeSnippetProps {
  platform: Platform;
  strategy: LocatorStrategy;
  locatorValue: string;
  resolvedXPath: string;
}

type Language = 'python' | 'java' | 'javascript';

const languageLabels: Record<Language, { label: string; color: string }> = {
  python: { label: 'Python', color: 'text-yellow-400' },
  java: { label: 'Java', color: 'text-orange-400' },
  javascript: { label: 'JavaScript', color: 'text-cyan-400' },
};

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
  platform,
  strategy,
  locatorValue,
  resolvedXPath,
}) => {
  const [activeLang, setActiveLang] = useState<Language>('python');
  const [copied, setCopied] = useState(false);

  const snippets: CodeSnippets = generateCodeSnippets(platform, strategy, locatorValue, resolvedXPath);

  const currentCode = snippets[activeLang];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Code className="w-4 h-4 text-brand-400" />
          Hazır Kod Parçası
        </h3>
        <div className="flex items-center gap-1">
          {(Object.keys(languageLabels) as Language[]).map((lang) => (
            <button
              key={lang}
              id={`code-lang-${lang}`}
              onClick={() => setActiveLang(lang)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${
                  activeLang === lang
                    ? `bg-surface-600/80 ${languageLabels[lang].color} border border-white/[0.08]`
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }
              `}
            >
              {languageLabels[lang].label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <pre className="px-6 py-4 font-mono text-sm text-slate-200 overflow-x-auto bg-surface-900/50 leading-relaxed">
          {currentCode}
        </pre>

        <button
          id="copy-code-btn"
          onClick={handleCopy}
          className={`
            absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200
            ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-surface-700/80 text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.12]'
            }
          `}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Kopyala
            </>
          )}
        </button>
      </div>
    </div>
  );
};
