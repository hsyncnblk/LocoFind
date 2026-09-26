import React, { useState } from 'react';
import type { Platform, MatchedElement, DifferentiatorHint } from '../types';
import { getAttributeColumnsForPlatform, truncate } from '../utils/helpers';
import { Lightbulb, ChevronDown, ChevronUp, Eye, EyeOff, MousePointer } from 'lucide-react';

interface ElementTableProps {
  platform: Platform;
  elements: MatchedElement[];
  hints: DifferentiatorHint[];
}

export const ElementTable: React.FC<ElementTableProps> = ({ platform, elements, hints }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const columns = getAttributeColumnsForPlatform(platform);

  if (elements.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          Element Karşılaştırma Tablosu
          <span className="text-xs text-slate-500 font-normal ml-1">({elements.length} element)</span>
        </h3>
      </div>

      {hints.length > 0 && (
        <div className="px-6 py-3 border-b border-white/[0.04] bg-amber-500/5">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-amber-400">Ayırt Edici Öneriler</span>
          </div>
          <div className="flex flex-col gap-1.5 ml-6">
            {hints.map((hint, i) => (
              <p key={i} className="text-xs text-amber-300/80 leading-relaxed">
                💡 {hint.suggestion}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left text-slate-500 font-medium">#</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Tag</th>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-slate-500 font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Durum</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Detay</th>
            </tr>
          </thead>
          <tbody>
            {elements.map((el) => {
              const isExpanded = expandedRow === el.index;
              return (
                <React.Fragment key={el.index}>
                  <tr
                    className={`
                      border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer
                      ${isExpanded ? 'bg-white/[0.03]' : ''}
                    `}
                    onClick={() => setExpandedRow(isExpanded ? null : el.index)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">{el.index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 font-mono text-[11px]">
                        {truncate(el.tagName, 30)}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-slate-300 max-w-[180px]">
                        <span className="font-mono text-[11px]" title={el.attributes[col.key] || '-'}>
                          {truncate(el.attributes[col.key] || '-', 40)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {el.visible ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Eye className="w-3 h-3" /> Görünür
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500">
                            <EyeOff className="w-3 h-3" /> Gizli
                          </span>
                        )}
                        {el.clickable && (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <MousePointer className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-surface-800/50">
                      <td colSpan={columns.length + 4} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block mb-1">Tam XPath</span>
                            <code className="code-block text-[11px] text-cyan-300 block break-all">
                              {el.xpath}
                            </code>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-1">Hiyerarşi</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-400">Derinlik: <strong className="text-slate-200">{el.depth}</strong></span>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-400">Üst: <strong className="text-slate-200">{el.parentTag}</strong></span>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-400">Alt element: <strong className="text-slate-200">{el.childCount}</strong></span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block mb-1">Tüm Öznitelikler</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(el.attributes).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-700/80 text-[10px]"
                                  title={`${key}="${val}"`}
                                >
                                  <span className="text-brand-400">{key}</span>
                                  <span className="text-slate-500">=</span>
                                  <span className="text-slate-300 max-w-[120px] truncate">"{truncate(val, 30)}"</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          {el.text && (
                            <div className="col-span-2">
                              <span className="text-slate-500 block mb-1">Metin İçeriği</span>
                              <p className="text-slate-300 font-mono text-[11px]">{truncate(el.text, 200)}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
