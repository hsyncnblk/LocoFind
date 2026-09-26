import { useState, useCallback, useRef } from 'react';
import type { Platform, LocatorStrategy, ParseResult, LocatorResult, MatchStatus } from './types';
import { parseSource, evaluateXPath } from './parsers';
import { resolveLocator } from './translators';
import { getDefaultStrategy, generateDifferentiatorHints } from './utils/helpers';
import { useTheme } from './hooks/useTheme';
import { PlatformSelector } from './components/PlatformSelector';
import { InputPanel } from './components/InputPanel';
import { LocatorInput } from './components/LocatorInput';
import { ResultCard } from './components/ResultCard';
import { ElementTable } from './components/ElementTable';
import { DomTreeViewer } from './components/DomTreeViewer';
import { CodeSnippet } from './components/CodeSnippet';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthorBadge } from './components/AuthorBadge';
import { Search, Zap, Shield, Activity } from 'lucide-react';

function App() {
  const { isDark, toggleTheme } = useTheme();

  const [platform, setPlatform] = useState<Platform>('android');
  const [strategy, setStrategy] = useState<LocatorStrategy>(getDefaultStrategy('ios'));
  const [locatorValue, setLocatorValue] = useState('');
  const [xmlSource, setXmlSource] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [locatorResult, setLocatorResult] = useState<LocatorResult | null>(null);

  const parsedDocRef = useRef<{ source: string; result: ParseResult } | null>(null);

  const handlePlatformChange = useCallback(
    (newPlatform: Platform) => {
      setPlatform(newPlatform);
      setStrategy(getDefaultStrategy(newPlatform));
      setLocatorResult(null);
    },
    []
  );

  const handleSourceChange = useCallback((source: string, name?: string) => {
    setXmlSource(source);
    if (name !== undefined) setFileName(name || null);
    setLocatorResult(null);

    if (source.trim()) {
      const result = parseSource(source);
      setParseResult(result);
      parsedDocRef.current = { source, result };
    } else {
      setParseResult(null);
      parsedDocRef.current = null;
    }
  }, []);

  const handleVerify = useCallback(() => {
    if (!xmlSource.trim() || !locatorValue.trim()) return;

    setIsProcessing(true);

    requestAnimationFrame(() => {
      const startTime = performance.now();

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
          setLocatorResult({
            status: 'error',
            matchCount: 0,
            elements: [],
            resolvedXPath: '',
            executionTimeMs: performance.now() - startTime,
            differentiatorHints: [],
            errorMessage: 'XML/HTML parse edilemedi. Lütfen kaynağı kontrol edin.',
          });
          setIsProcessing(false);
          return;
        }

        const resolved = resolveLocator(platform, strategy, locatorValue);

        if (resolved.error) {
          setLocatorResult({
            status: 'error',
            matchCount: 0,
            elements: [],
            resolvedXPath: resolved.xpath,
            executionTimeMs: performance.now() - startTime,
            differentiatorHints: [],
            errorMessage: resolved.error,
          });
          setIsProcessing(false);
          return;
        }

        const evalResult = evaluateXPath(doc, resolved.xpath);

        if (evalResult.error) {
          setLocatorResult({
            status: 'error',
            matchCount: 0,
            elements: [],
            resolvedXPath: resolved.xpath,
            executionTimeMs: performance.now() - startTime,
            differentiatorHints: [],
            errorMessage: evalResult.error,
          });
          setIsProcessing(false);
          return;
        }

        const elements = evalResult.elements;
        const executionTimeMs = performance.now() - startTime;

        let status: MatchStatus;
        if (elements.length === 0) status = 'not-found';
        else if (elements.length === 1) status = 'unique';
        else status = 'multiple';

        const hints = generateDifferentiatorHints(elements);

        setLocatorResult({
          status,
          matchCount: elements.length,
          elements,
          resolvedXPath: resolved.xpath,
          executionTimeMs,
          differentiatorHints: hints,
        });
      } catch (err) {
        setLocatorResult({
          status: 'error',
          matchCount: 0,
          elements: [],
          resolvedXPath: '',
          executionTimeMs: performance.now() - startTime,
          differentiatorHints: [],
          errorMessage: `Beklenmeyen hata: ${(err as Error).message}`,
        });
      }

      setIsProcessing(false);
    });
  }, [xmlSource, locatorValue, platform, strategy]);

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
                  Verifier v1.0
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
          />
          <LocatorInput
            platform={platform}
            strategy={strategy}
            locatorValue={locatorValue}
            isProcessing={isProcessing}
            onStrategyChange={setStrategy}
            onValueChange={setLocatorValue}
            onVerify={handleVerify}
            hasSource={!!xmlSource.trim() && (parseResult?.nodeCount ?? 0) > 0}
          />
        </div>

        {locatorResult && (
          <div className="flex flex-col gap-5">
            <ResultCard result={locatorResult} resolvedXPath={locatorResult.resolvedXPath} />

            {locatorResult.status === 'unique' && (
              <CodeSnippet
                platform={platform}
                strategy={strategy}
                locatorValue={locatorValue}
                resolvedXPath={locatorResult.resolvedXPath}
              />
            )}

            {locatorResult.elements.length > 0 && (
              <ElementTable
                platform={platform}
                elements={locatorResult.elements}
                hints={locatorResult.differentiatorHints}
              />
            )}

            {parseResult?.doc && locatorResult.elements.length > 0 && (
              <DomTreeViewer doc={parseResult.doc} matchedElements={locatorResult.elements} />
            )}
          </div>
        )}

        {!locatorResult && !xmlSource && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/10 flex items-center justify-center mb-6 border border-brand-500/10">
              <Search className="w-9 h-9 text-brand-400/60" />
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">
              Locator Doğrulamaya Başlayın
            </h2>
            <p className="text-sm text-slate-500 text-center max-w-md mb-8">
              XML/HTML sayfa hiyerarşisini yükleyin, platform seçin ve locator ifadenizi doğrulayın.
              BrowserStack kuyruğunda beklemeye son!
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-slate-400">Anlık Doğrulama</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-slate-400">Flaky Test Tespiti</span>
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
