import React, { useState } from 'react';
import type { Platform } from '../types';
import type { FoundElement, LocatorCandidate } from '../utils/locatorGenerator';
import { Copy, Check, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, Sparkles, Code, Layers, Eye, EyeOff } from 'lucide-react';

interface GeneratedLocatorCardProps {
  platform: Platform;
  foundElements: FoundElement[];
  executionTimeMs: number;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200
        ${copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-surface-700/60 text-slate-500 hover:text-slate-300 border border-white/[0.06] hover:border-white/[0.12]'}
      `}
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
      {copied ? 'OK' : 'Kopyala'}
    </button>
  );
}

function LocatorRow({ candidate, isBest }: { candidate: LocatorCandidate; isBest: boolean }) {
  return (
    <div className={`
      flex flex-col gap-2 p-3 rounded-lg border transition-all
      ${isBest
        ? 'bg-emerald-500/[0.06] border-emerald-500/20'
        : 'bg-surface-800/40 border-white/[0.04] hover:border-white/[0.08]'}
    `}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isBest ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <Layers className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          )}
          <span className={`text-xs font-semibold ${isBest ? 'text-emerald-400' : 'text-slate-400'}`}>
            {candidate.label}
          </span>
          {isBest && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Önerilen
            </span>
          )}
          <span className={`
            px-1.5 py-0.5 rounded text-[9px] font-medium border
            ${candidate.isUnique
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
              : candidate.matchCount === 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/15'}
          `}>
            {candidate.matchCount === 1 ? '✓ Tekil' : candidate.matchCount === 0 ? '✕ Yok' : `${candidate.matchCount} eşleşme`}
          </span>
        </div>
        <CopyButton text={candidate.value} />
      </div>

      <div className="flex items-start gap-2">
        <Code className="w-3 h-3 text-brand-400/50 mt-1 flex-shrink-0" />
        <code className="text-[11px] font-mono text-brand-300 break-all leading-relaxed">
          {candidate.appiumCommand}
        </code>
      </div>

      <div className="flex items-start gap-2">
        <Sparkles className="w-3 h-3 text-violet-400/50 mt-0.5 flex-shrink-0" />
        <code className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
          {candidate.value}
        </code>
      </div>
    </div>
  );
}

function ElementResult({ found, platform, index }: { found: FoundElement; platform: Platform; index: number }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const { element, bestLocator, alternatives, selfVerified } = found;

  const visibleAlternatives = alternatives.filter(a => a.matchCount > 0);

  return (
    <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className={`
        px-5 py-4 border-b flex items-center justify-between
        ${selfVerified
          ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/15'
          : 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/15'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
            ${selfVerified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}
          `}>
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">{element.tagName}</span>
              {element.text && (
                <span className="text-xs text-slate-500 truncate max-w-[300px]">"{element.text}"</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {selfVerified ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  Doğrulandı — Tekil eşleşme
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-amber-400">
                  <ShieldAlert className="w-3 h-3" />
                  Tekil locator bulunamadı — en yakın öneriler
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {element.visible ? (
            <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-emerald-400" /> Görünür</span>
          ) : (
            <span className="flex items-center gap-1"><EyeOff className="w-3 h-3 text-rose-400" /> Gizli</span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(element.attributes).slice(0, 8).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-700/50 text-[10px] border border-white/[0.04]">
              <span className="text-slate-500">{key}:</span>
              <span className="text-slate-300 font-mono truncate max-w-[200px]">{val}</span>
            </span>
          ))}
        </div>

        {bestLocator && (
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">En İyi Locator</p>
            <LocatorRow candidate={bestLocator} isBest={true} />
          </div>
        )}

        {visibleAlternatives.length > 0 && (
          <div>
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors mb-2"
            >
              {showAlternatives ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAlternatives ? 'Alternatifleri Gizle' : `${visibleAlternatives.length} Alternatif Locator`}
            </button>
            {showAlternatives && (
              <div className="flex flex-col gap-2 animate-fade-in">
                {visibleAlternatives.map((alt, i) => (
                  <LocatorRow key={i} candidate={alt} isBest={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const GeneratedLocatorCard: React.FC<GeneratedLocatorCardProps> = ({
  platform,
  foundElements,
  executionTimeMs,
}) => {
  if (foundElements.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/10">
          <ShieldAlert className="w-8 h-8 text-rose-400/60" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">Element Bulunamadı</h3>
        <p className="text-sm text-slate-500">
          Arama teriminizle eşleşen bir element bulunamadı. Farklı bir metin veya öznitelik deneyin.
        </p>
        <p className="text-[11px] text-slate-600 mt-3">
          Süre: {executionTimeMs.toFixed(1)} ms
        </p>
      </div>
    );
  }

  const verifiedCount = foundElements.filter(f => f.selfVerified).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card px-5 py-3 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-semibold text-slate-200">{foundElements.length}</span> element bulundu
          </div>
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">{verifiedCount}</span> tekil locator doğrulandı
          </div>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">{executionTimeMs.toFixed(1)} ms</span>
      </div>

      {foundElements.map((found, i) => (
        <ElementResult key={i} found={found} platform={platform} index={i} />
      ))}
    </div>
  );
};
