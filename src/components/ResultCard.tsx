import React from 'react';
import type { LocatorResult } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Clock, Hash, Layers } from 'lucide-react';
import { formatTime } from '../utils/helpers';

interface ResultCardProps {
  result: LocatorResult;
  resolvedXPath: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, resolvedXPath }) => {
  const { status, matchCount, executionTimeMs } = result;

  const statusConfig = {
    unique: {
      icon: <CheckCircle className="w-7 h-7" />,
      title: 'Tekil Element Bulundu!',
      subtitle: 'Test otomasyonu için güvenli. Bu locator direkt kullanılabilir.',
      badge: <span className="badge-success">✓ Unique</span>,
      gradient: 'from-emerald-500/20 to-green-500/10',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      pulseClass: 'pulse-success',
      dotColor: 'bg-emerald-400',
    },
    multiple: {
      icon: <AlertTriangle className="w-7 h-7" />,
      title: `${matchCount} Element Eşleşti!`,
      subtitle: 'Flaky test riski! Locator\'ı daraltmak için aşağıdaki önerileri inceleyin.',
      badge: <span className="badge-warning">⚠ Conflict</span>,
      gradient: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      pulseClass: 'pulse-warning',
      dotColor: 'bg-amber-400',
    },
    'not-found': {
      icon: <XCircle className="w-7 h-7" />,
      title: 'Element Bulunamadı',
      subtitle: 'Hiyerarşiyi kontrol edin veya locator ifadesini düzenleyin.',
      badge: <span className="badge-danger">✕ Not Found</span>,
      gradient: 'from-rose-500/20 to-red-500/10',
      borderColor: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      pulseClass: 'pulse-danger',
      dotColor: 'bg-rose-400',
    },
    error: {
      icon: <XCircle className="w-7 h-7" />,
      title: 'Hata Oluştu',
      subtitle: result.errorMessage || 'Locator ifadesi geçersiz olabilir.',
      badge: <span className="badge-danger">✕ Error</span>,
      gradient: 'from-rose-500/20 to-red-500/10',
      borderColor: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      pulseClass: 'pulse-danger',
      dotColor: 'bg-rose-400',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className={`bg-gradient-to-r ${config.gradient} px-6 py-5 border-b ${config.borderColor}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative mt-0.5">
              <div className={`w-3 h-3 rounded-full ${config.dotColor} ${config.pulseClass}`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-100">{config.title}</h3>
                {config.badge}
              </div>
              <p className="text-sm text-slate-400">{config.subtitle}</p>
            </div>
          </div>
          <div className={`${config.iconColor} flex-shrink-0 opacity-60`}>{config.icon}</div>
        </div>
      </div>

      <div className="px-6 py-4 flex items-center gap-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 text-xs">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Eşleşme:</span>
          <span className="font-semibold text-slate-200">{matchCount}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Süre:</span>
          <span className="font-semibold text-slate-200">{formatTime(executionTimeMs)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">XPath:</span>
        </div>
      </div>

      <div className="px-6 py-3">
        <div className="code-block text-xs text-brand-300 break-all">
          {resolvedXPath}
        </div>
      </div>
    </div>
  );
};
