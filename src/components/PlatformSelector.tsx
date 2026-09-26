import React from 'react';
import type { Platform } from '../types';
import { Smartphone, TabletSmartphone, Globe } from 'lucide-react';

interface PlatformSelectorProps {
  selected: Platform;
  onChange: (platform: Platform) => void;
}

const platforms: { value: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'ios',
    label: 'iOS',
    icon: <Smartphone className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    value: 'android',
    label: 'Android',
    icon: <TabletSmartphone className="w-4 h-4" />,
    color: 'from-emerald-500 to-green-400',
  },
  {
    value: 'web',
    label: 'Web',
    icon: <Globe className="w-4 h-4" />,
    color: 'from-violet-500 to-purple-400',
  },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Platform Seçimi">
      {platforms.map((p) => {
        const isActive = selected === p.value;
        return (
          <button
            key={p.value}
            id={`platform-tab-${p.value}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(p.value)}
            className={`
              relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-300 select-none cursor-pointer
              ${
                isActive
                  ? `bg-gradient-to-r ${p.color} text-white shadow-lg shadow-brand-500/20 scale-[1.02]`
                  : 'bg-surface-700/40 text-slate-400 hover:bg-surface-600/60 hover:text-slate-200'
              }
            `}
          >
            {p.icon}
            {p.label}
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-white/60" />
            )}
          </button>
        );
      })}
    </div>
  );
};
