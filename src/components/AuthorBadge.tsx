import React from 'react';
import { Code2, Sparkles } from 'lucide-react';

export const AuthorBadge: React.FC = () => {
  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full animate-border-glow shadow-sm hover:shadow-brand-500/25 transition-all duration-300 cursor-default select-none backdrop-blur-md"
      title="Bu platform Hüseyin Çinibulak tarafından tasarlanıp geliştirilmiştir."
    >
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-400 border border-brand-500/30 group-hover:scale-110 transition-transform">
        <Code2 className="w-3 h-3 text-brand-400" />
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          Developed by
        </span>
        <span className="font-bold tracking-tight animate-text-shimmer">
          Hüseyin Çinibulak
        </span>
      </div>

      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-brand-500/25 to-violet-500/25 text-brand-300 border border-brand-500/40 shadow-sm group-hover:border-brand-400/60 transition-colors">
        Creator
      </span>

      <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-45 group-hover:scale-125 transition-all duration-300 shrink-0" />
    </div>
  );
};
