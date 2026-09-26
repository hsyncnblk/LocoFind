import React, { useState, useMemo } from 'react';
import type { DomTreeNode, MatchedElement, ElementAttributes } from '../types';
import { ChevronRight, ChevronDown, Search, Hash } from 'lucide-react';
import { truncate } from '../utils/helpers';

interface DomTreeViewerProps {
  doc: Document | null;
  matchedElements: MatchedElement[];
}

function buildTree(
  node: Element,
  matchedXPaths: Set<string>,
  depth: number = 0,
  idCounter: { current: number } = { current: 0 }
): DomTreeNode {
  const attrs: ElementAttributes = {};
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    attrs[attr.name] = attr.value;
  }

  const id = `node-${idCounter.current++}`;
  const children: DomTreeNode[] = [];

  for (let i = 0; i < node.children.length; i++) {
    children.push(buildTree(node.children[i], matchedXPaths, depth + 1, idCounter));
  }

  let isMatched = false;
  const nodeKey = `${node.tagName}|${attrs['resource-id'] || ''}|${attrs['name'] || ''}|${attrs['id'] || ''}`;
  for (const xpath of matchedXPaths) {
    if (xpath.includes(node.tagName)) {
      isMatched = matchedXPaths.has(nodeKey);
      break;
    }
  }

  let textContent = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
      textContent += node.childNodes[i].textContent || '';
    }
  }

  return {
    id,
    tagName: node.tagName,
    attributes: attrs,
    children,
    depth,
    isMatched,
    textContent: textContent.trim(),
  };
}

function markMatchedNodes(
  tree: DomTreeNode,
  matchedElements: MatchedElement[]
): DomTreeNode {
  function traverse(node: DomTreeNode): DomTreeNode {
    const isMatch = matchedElements.some(
      (me) =>
        me.tagName === node.tagName &&
        me.depth === node.depth &&
        JSON.stringify(me.attributes) === JSON.stringify(node.attributes)
    );

    const children = node.children.map(traverse);

    return {
      ...node,
      isMatched: isMatch,
      children,
    };
  }

  return traverse(tree);
}

function hasMatchedDescendant(node: DomTreeNode): boolean {
  if (node.isMatched) return true;
  return node.children.some(hasMatchedDescendant);
}

const TreeNode: React.FC<{
  node: DomTreeNode;
  filter: string;
  defaultExpanded: boolean;
}> = ({ node, filter, defaultExpanded }) => {
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded || node.isMatched || hasMatchedDescendant(node)
  );
  const hasChildren = node.children.length > 0;

  const matchesFilter =
    !filter ||
    node.tagName.toLowerCase().includes(filter.toLowerCase()) ||
    Object.values(node.attributes).some((v) => v.toLowerCase().includes(filter.toLowerCase()));

  const hasFilteredChildren = !filter || node.children.some((c) => matchesFilterRecursive(c, filter));

  if (filter && !matchesFilter && !hasFilteredChildren) return null;

  const keyAttrs = ['id', 'resource-id', 'name', 'class', 'content-desc', 'label', 'text', 'value'];
  const inlineAttrs = keyAttrs
    .filter((k) => node.attributes[k])
    .slice(0, 3)
    .map((k) => ({ key: k, value: node.attributes[k] }));

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-1 py-0.5 px-2 rounded cursor-pointer transition-colors text-xs
          ${node.isMatched ? 'bg-brand-500/15 border-l-2 border-brand-500' : 'hover:bg-white/[0.03]'}
        `}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-500" />
            )
          ) : (
            <span className="w-1 h-1 rounded-full bg-slate-600" />
          )}
        </span>

        <span className={`font-mono ${node.isMatched ? 'text-brand-400 font-semibold' : 'text-cyan-400'}`}>
          {'<'}{node.tagName}
        </span>

        {inlineAttrs.map((attr) => (
          <span key={attr.key} className="font-mono">
            <span className="text-amber-400/70">{' '}{attr.key}</span>
            <span className="text-slate-500">=</span>
            <span className="text-emerald-400/70">"{truncate(attr.value, 20)}"</span>
          </span>
        ))}

        <span className={`font-mono ${node.isMatched ? 'text-brand-400' : 'text-cyan-400'}`}>
          {hasChildren ? '>' : ' />'}
        </span>

        {node.textContent && !hasChildren && (
          <span className="text-slate-400 ml-1 font-mono">
            {truncate(node.textContent, 30)}
          </span>
        )}

        {node.isMatched && (
          <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[9px] font-bold">
            MATCH
          </span>
        )}

        {hasChildren && !isExpanded && (
          <span className="ml-1 text-slate-600 text-[10px]">({node.children.length})</span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} filter={filter} defaultExpanded={false} />
          ))}
          <div
            className="text-xs font-mono text-cyan-400/40 py-0.5"
            style={{ paddingLeft: `${node.depth * 16 + 28}px` }}
          >
            {'</'}{node.tagName}{'>'}
          </div>
        </div>
      )}
    </div>
  );
};

function matchesFilterRecursive(node: DomTreeNode, filter: string): boolean {
  const matches =
    node.tagName.toLowerCase().includes(filter.toLowerCase()) ||
    Object.values(node.attributes).some((v) => v.toLowerCase().includes(filter.toLowerCase()));

  if (matches) return true;
  return node.children.some((c) => matchesFilterRecursive(c, filter));
}

export const DomTreeViewer: React.FC<DomTreeViewerProps> = ({ doc, matchedElements }) => {
  const [filter, setFilter] = useState('');

  const tree = useMemo(() => {
    if (!doc || !doc.documentElement) return null;

    const matchedXPaths = new Set(matchedElements.map((e) => {
      const key = `${e.tagName}|${e.attributes['resource-id'] || ''}|${e.attributes['name'] || ''}|${e.attributes['id'] || ''}`;
      return key;
    }));

    const rawTree = buildTree(doc.documentElement, matchedXPaths);
    return markMatchedNodes(rawTree, matchedElements);
  }, [doc, matchedElements]);

  if (!tree) return null;

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          DOM Ağacı Gezgini
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            id="dom-tree-filter"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrele..."
            className="input-field text-xs py-1.5 pl-7 pr-3 w-48"
          />
        </div>
      </div>

      <div className="px-6 py-2 border-b border-white/[0.04] flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" /> Toplam: {countNodes(tree)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brand-500" /> Eşleşen: {matchedElements.length}
        </span>
      </div>

      <div className="p-3 max-h-[500px] overflow-y-auto overflow-x-auto">
        <TreeNode node={tree} filter={filter} defaultExpanded={true} />
      </div>
    </div>
  );
};

function countNodes(node: DomTreeNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}
