import { useState, useCallback, useRef } from 'react';
import type { Platform, ParseResult } from './types';
import { parseSource } from './parsers';
import type { GenerationResult } from './utils/locatorGenerator';
import { generateByLine } from './utils/locatorGenerator';
import { formatXmlOneLine } from './utils/xmlFormatter';
import { useTheme } from './hooks/useTheme';
import { PlatformSelector } from './components/PlatformSelector';
import { InputPanel } from './components/InputPanel';
import { LocatorInput } from './components/LocatorInput';
import { GeneratedLocatorCard } from './components/GeneratedLocatorCard';
import { ElementTable } from './components/ElementTable';
import { DomTreeViewer } from './components/DomTreeViewer';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthorBadge } from './components/AuthorBadge';
import { Search, Zap, Shield, Activity, ScanSearch } from 'lucide-react';

function App() {
  const { isDark, toggleTheme } = useTheme();

  const [platform, setPlatform] = useState<Platform>('ios');
  const [lineNumber, setLineNumber] = useState('');
  const [xmlSource, setXmlSource] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const parsedDocRef = useRef<{ source: string; result: ParseResult } | null>(null);

  const totalLines = xmlSource ? xmlSource.split('\n').length : 0;

  const handlePlatformChange = useCallback(
    (newPlatform: Platform) => {
      setPlatform(newPlatform);
      setGenerationResult(null);
    },
    []
  );

  const handleSourceChange = useCallback((source: string, name?: string) => {
    const formatted = source.trim() ? formatXmlOneLine(source) : '';
    setXmlSource(formatted);
    if (name !== undefined) setFileName(name || null);
    setGenerationResult(null);
    setHighlightLine(null);

    if (formatted) {
      const result = parseSource(formatted);
      setParseResult(result);
      parsedDocRef.current = { source: formatted, result };
    } else {
      setParseResult(null);
      parsedDocRef.current = null;
    }
  }, []);

  const handleLineNumberChange = useCallback((value: string) => {
    setLineNumber(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed >= 1) {
      setHighlightLine(parsed);
    } else {
      setHighlightLine(null);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    const parsed = parseInt(lineNumber);
    if (!xmlSource.trim() || isNaN(parsed) || parsed < 1 || parsed > totalLines) return;

    setIsProcessing(true);
    setHighlightLine(parsed);

    requestAnimationFrame(() => {
      try {
        let doc: Document | null = null;
        if (parsedDocRef.current?.source === xmlSource) {
          doc = parsedDocRef.current.result.doc;
        } else {
          const result = parseSource(xmlSource);
          setParseResult(result);
          parsedDocRef.current = { source: xmlSource, result };
          doc = result.doc;
        }

        if (!doc) {
          setGenerationResult({
            searchTerm: `Satır ${parsed}`,
            foundElements: [],
            executionTimeMs: 0,
          });
          setIsProcessing(false);
          return;
        }

        const result = generateByLine(doc, platform, xmlSource, parsed);
        setGenerationResult(result);
      } catch {
        setGenerationResult({
          searchTerm: `Satır ${parsed}`,
          foundElements: [],
          executionTimeMs: 0,
        });
      }

      setIsProcessing(false);
    });
  }, [xmlSource, lineNumber, platform, totalLines]);

  const matchedElements = generationResult?.foundElements.map(f => f.element) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Search className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-900" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 tracking-tight">
                  QA Locator Inspector
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  Verifier v2.0
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-white/[0.06]" />

            <PlatformSelector selected={platform} onChange={handlePlatformChange} />
          </div>

          <div className="flex items-center gap-3">
            {parseResult && parseResult.nodeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700/40 text-xs text-slate-400 border border-white/[0.04]">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span className="font-mono">{parseResult.nodeCount.toLocaleString()}</span>
                <span>node</span>
              </div>
            )}
            <AuthorBadge />
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <InputPanel
            xmlSource={xmlSource}
            fileName={fileName}
            onSourceChange={handleSourceChange}
            parseErrors={parseResult?.errors || []}
            nodeCount={parseResult?.nodeCount || 0}
            parseTimeMs={parseResult?.parseTimeMs || 0}
            highlightLine={highlightLine}
          />
          <LocatorInput
            platform={platform}
            lineNumber={lineNumber}
            isProcessing={isProcessing}
            onLineNumberChange={handleLineNumberChange}
            onGenerate={handleGenerate}
            hasSource={!!xmlSource.trim() && (parseResult?.nodeCount ?? 0) > 0}
            totalLines={totalLines}
          />
        </div>

        {generationResult && (
          <div className="flex flex-col gap-5">
            <GeneratedLocatorCard
              platform={platform}
              foundElements={generationResult.foundElements}
              executionTimeMs={generationResult.executionTimeMs}
            />

            {matchedElements.length > 0 && (
              <ElementTable
                platform={platform}
                elements={matchedElements}
                hints={[]}
              />
            )}

            {parseResult?.doc && matchedElements.length > 0 && (
              <DomTreeViewer doc={parseResult.doc} matchedElements={matchedElements} />
            )}
          </div>
        )}

        {!generationResult && !xmlSource && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/10 flex items-center justify-center mb-6 border border-brand-500/10">
              <ScanSearch className="w-9 h-9 text-brand-400/60" />
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">
              Akıllı Locator Üreticisi
            </h2>
            <p className="text-sm text-slate-500 text-center max-w-md mb-8">
              XML/HTML yükleyin, satır numarası girin — en iyi locator otomatik üretilsin ve doğrulansın.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-slate-400">Otomatik Üretim</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-slate-400">Kendini Doğrular</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-xs text-slate-400">3 Platform Desteği</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.04] py-4">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between text-[11px] text-slate-600">
          <span>QA Locator Inspector & Verifier — Internal Tool</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Tüm parser motorları aktif
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
