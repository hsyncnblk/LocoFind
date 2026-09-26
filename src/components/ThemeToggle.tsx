import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onToggle}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-700/40 hover:bg-surface-600/60 border border-white/[0.06] transition-all duration-300 group"
      aria-label={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`absolute inset-0 w-4 h-4 text-amber-400 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
    </button>
  );
};
