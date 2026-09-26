import type { Platform, LocatorStrategy } from '../types';

export interface DetectionResult {
  strategy: LocatorStrategy;
  confidence: 'high' | 'medium' | 'low';
  label: string;
  reason: string;
}

function isXPath(value: string): boolean {
  if (value.startsWith('//') || value.startsWith('(//') || value.startsWith('./')) return true;
  if (value.startsWith('/') && value.includes('[')) return true;
  if (/^\/[a-zA-Z]/.test(value)) return true;
  if (/^\(\/\//.test(value)) return true;
  return false;
}

function isIOSPredicate(value: string): boolean {
  const predicatePatterns = [
    /\btype\s*==\s*/i,
    /\bname\s*==\s*/i,
    /\blabel\s*==\s*/i,
    /\bvalue\s*==\s*/i,
    /\bvisible\s*==\s*/i,
    /\benabled\s*==\s*/i,
    /\baccessible\s*==\s*/i,
    /\bBEGINSWITH\b/i,
    /\bENDSWITH\b/i,
    /\bCONTAINS\b/i,
    /\bMATCHES\b/i,
    /\bLIKE\b/i,
    /\bAND\b/,
    /\bOR\b/,
    /\bNOT\b/,
  ];

  const matchCount = predicatePatterns.filter((p) => p.test(value)).length;

  if (matchCount >= 2) return true;
  if (/^\s*type\s*==\s*['"]/.test(value)) return true;
  if (/^\s*name\s*==\s*['"]/.test(value)) return true;
  if (/^\s*label\s*==\s*['"]/.test(value)) return true;
  if (/^\s*value\s*(==|CONTAINS|BEGINSWITH)/i.test(value)) return true;
  return false;
}

function isIOSClassChain(value: string): boolean {
  if (value.includes('**/XCUI') || value.includes('**/xcui')) return true;
  if (/^\*\*\//.test(value)) return true;
  if (/^XCUI\w+/.test(value) && value.includes('[`')) return true;
  if (/^\/XCUI\w+/.test(value)) return true;
  return false;
}

function isResourceId(value: string): boolean {
  if (/^[a-z][a-z0-9_.]*:id\/[a-zA-Z0-9_]+$/.test(value)) return true;
  return false;
}

function isCssSelector(value: string): boolean {
  if (/^[.#]\w/.test(value)) return true;
  if (/\[[\w-]+[~|^$*]?=/.test(value) && !value.startsWith('/')) return true;
  if (/^[a-z]+\.[a-z]/i.test(value) && value.includes('.') && !value.includes(':id/')) return true;
  if (/^[a-z]+\s*>\s*[a-z]/i.test(value)) return true;
  if (/^[a-z]+:[a-z-]+/i.test(value) && !value.includes(':id/')) return true;
  if (/^[a-z]+\s+[a-z]+\s*[.#>~+]/i.test(value)) return true;
  return false;
}

export function detectLocatorStrategy(platform: Platform, value: string): DetectionResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      strategy: 'xpath',
      confidence: 'low',
      label: 'Bilinmiyor',
      reason: 'Boş girdi',
    };
  }

  if (isXPath(trimmed)) {
    return {
      strategy: 'xpath',
      confidence: 'high',
      label: 'XPath',
      reason: 'XPath ifadesi tespit edildi (// veya / ile başlıyor)',
    };
  }

  if (platform === 'ios') {
    return detectIOSStrategy(trimmed);
  }

  if (platform === 'android') {
    return detectAndroidStrategy(trimmed);
  }

  if (platform === 'web') {
    return detectWebStrategy(trimmed);
  }

  return {
    strategy: 'xpath',
    confidence: 'low',
    label: 'XPath (Varsayılan)',
    reason: 'Strateji belirlenemedi, XPath olarak değerlendirildi.',
  };
}

function detectIOSStrategy(value: string): DetectionResult {
  if (isIOSClassChain(value)) {
    return {
      strategy: 'class-chain',
      confidence: 'high',
      label: 'iOS Class Chain',
      reason: 'iOS Class Chain kalıbı tespit edildi (**/ ile başlıyor)',
    };
  }

  if (isIOSPredicate(value)) {
    return {
      strategy: 'predicate-string',
      confidence: 'high',
      label: 'iOS Predicate',
      reason: 'iOS NSPredicate ifadesi tespit edildi (type/name/label == ...)',
    };
  }

  return {
    strategy: 'accessibility-id',
    confidence: 'medium',
    label: 'Accessibility ID',
    reason: 'Düz metin olarak Accessibility ID (name/label/identifier) şeklinde aranacak',
  };
}

function detectAndroidStrategy(value: string): DetectionResult {
  if (isResourceId(value)) {
    return {
      strategy: 'resource-id',
      confidence: 'high',
      label: 'Resource ID',
      reason: 'Android Resource ID formatı tespit edildi (paket:id/eleman)',
    };
  }

  if (/^[a-zA-Z0-9_]+$/.test(value) && value.includes('_')) {
    return {
      strategy: 'resource-id',
      confidence: 'medium',
      label: 'Resource ID (Kısa)',
      reason: 'Kısa Resource ID olarak değerlendirildi (alt çizgi içeren tek kelime)',
    };
  }

  if (/^[a-zA-Z0-9_]+$/.test(value) && !value.includes(' ')) {
    return {
      strategy: 'resource-id',
      confidence: 'medium',
      label: 'Resource ID (Kısa)',
      reason: 'Kısa Resource ID olarak değerlendirildi (tek kelime, boşluksuz)',
    };
  }

  if (value.startsWith('*') && value.endsWith('*')) {
    return {
      strategy: 'text',
      confidence: 'high',
      label: 'Text (Contains)',
      reason: 'Kısmi metin eşleşmesi tespit edildi (*metin* formatı)',
    };
  }

  if (/\s/.test(value) || /[A-ZÇĞİÖŞÜ]/.test(value[0])) {
    return {
      strategy: 'text',
      confidence: 'medium',
      label: 'Text',
      reason: 'Metin içeriği olarak değerlendirildi (boşluk veya büyük harf ile başlıyor)',
    };
  }

  return {
    strategy: 'accessibility-id',
    confidence: 'medium',
    label: 'Content Description',
    reason: 'Content Description (accessibility-id) olarak aranacak',
  };
}

function detectWebStrategy(value: string): DetectionResult {
  if (isCssSelector(value)) {
    return {
      strategy: 'css-selector',
      confidence: 'high',
      label: 'CSS Selector',
      reason: 'CSS seçici ifadesi tespit edildi',
    };
  }

  if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value) && !value.includes(' ')) {
    return {
      strategy: 'id',
      confidence: 'medium',
      label: 'HTML ID',
      reason: 'HTML ID özniteliği olarak değerlendirildi (tek kelime, tire/alt çizgi içerebilir)',
    };
  }

  return {
    strategy: 'name',
    confidence: 'medium',
    label: 'Name',
    reason: 'HTML name özniteliği olarak değerlendirildi',
  };
}

export function getDetectionBadgeColor(confidence: DetectionResult['confidence']): string {
  switch (confidence) {
    case 'high':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    case 'medium':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    case 'low':
      return 'bg-red-500/15 text-red-400 border-red-500/20';
  }
}
