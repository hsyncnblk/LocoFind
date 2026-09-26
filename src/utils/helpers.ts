import type { Platform, LocatorStrategy, StrategyOption, MatchedElement, DifferentiatorHint } from '../types';

export function getStrategiesForPlatform(platform: Platform): StrategyOption[] {
  switch (platform) {
    case 'ios':
      return [
        { value: 'xpath', label: 'XPath', description: 'Standart XPath 1.0 ifadesi' },
        { value: 'accessibility-id', label: 'Accessibility ID', description: 'name, label veya identifier özniteliği' },
        { value: 'predicate-string', label: 'iOS Predicate String', description: "type == '...' AND name == '...'" },
        { value: 'class-chain', label: 'iOS Class Chain', description: '**/XCUIElementType... kalıpları' },
      ];
    case 'android':
      return [
        { value: 'xpath', label: 'XPath', description: 'Standart XPath 1.0 ifadesi' },
        { value: 'resource-id', label: 'Resource ID', description: 'com.app:id/element veya kısa ID' },
        { value: 'accessibility-id', label: 'Content Description', description: 'content-desc özniteliği' },
        { value: 'text', label: 'Text', description: 'Metin ile eşleşme (*text* = contains)' },
      ];
    case 'web':
      return [
        { value: 'xpath', label: 'XPath', description: 'Standart XPath 1.0 ifadesi' },
        { value: 'css-selector', label: 'CSS Selector', description: 'CSS seçici ifadesi' },
        { value: 'id', label: 'ID', description: 'HTML id özniteliği' },
        { value: 'name', label: 'Name', description: 'HTML name özniteliği' },
        { value: 'class-name', label: 'Class Name', description: 'CSS class adı' },
      ];
  }
}

export function getDefaultStrategy(platform: Platform): LocatorStrategy {
  switch (platform) {
    case 'ios': return 'accessibility-id';
    case 'android': return 'resource-id';
    case 'web': return 'css-selector';
  }
}

export function getAttributeColumnsForPlatform(
  platform: Platform
): { key: string; label: string }[] {
  switch (platform) {
    case 'ios':
      return [
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Name' },
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
        { key: 'identifier', label: 'Identifier' },
        { key: 'visible', label: 'Visible' },
        { key: 'enabled', label: 'Enabled' },
        { key: 'accessible', label: 'Accessible' },
      ];
    case 'android':
      return [
        { key: 'class', label: 'Class' },
        { key: 'resource-id', label: 'Resource ID' },
        { key: 'content-desc', label: 'Content Desc' },
        { key: 'text', label: 'Text' },
        { key: 'clickable', label: 'Clickable' },
        { key: 'enabled', label: 'Enabled' },
        { key: 'displayed', label: 'Displayed' },
        { key: 'focusable', label: 'Focusable' },
      ];
    case 'web':
      return [
        { key: 'id', label: 'ID' },
        { key: 'class', label: 'Class' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'href', label: 'Href' },
        { key: 'value', label: 'Value' },
        { key: 'placeholder', label: 'Placeholder' },
        { key: 'role', label: 'Role' },
      ];
  }
}

export function generateDifferentiatorHints(
  elements: MatchedElement[]
): DifferentiatorHint[] {
  if (elements.length <= 1) return [];

  const hints: DifferentiatorHint[] = [];

  const allKeys = new Set<string>();
  elements.forEach((el) => {
    Object.keys(el.attributes).forEach((k) => allKeys.add(k));
  });

  for (const key of allKeys) {
    const values = elements.map((el) => el.attributes[key] || '');
    const uniqueValues = new Set(values.filter((v) => v !== ''));

    if (uniqueValues.size > 1 && uniqueValues.size <= elements.length) {
      const valueCounts: Record<string, number[]> = {};
      values.forEach((v, idx) => {
        if (v) {
          if (!valueCounts[v]) valueCounts[v] = [];
          valueCounts[v].push(idx);
        }
      });

      for (const [val, indices] of Object.entries(valueCounts)) {
        if (indices.length === 1) {
          hints.push({
            attribute: key,
            elementIndex: indices[0],
            value: val,
            suggestion: `${indices[0] + 1}. elementin "${key}" özniteliği "${val.substring(0, 60)}" olarak farklılaşıyor. Bu özniteliği kullanarak locator'ı daraltabilirsiniz.`,
          });
        }
      }
    }
  }

  const texts = elements.map((el) => el.text);
  const uniqueTexts = new Set(texts.filter((t) => t !== ''));
  if (uniqueTexts.size > 1) {
    const textCounts: Record<string, number[]> = {};
    texts.forEach((t, idx) => {
      if (t) {
        if (!textCounts[t]) textCounts[t] = [];
        textCounts[t].push(idx);
      }
    });

    for (const [text, indices] of Object.entries(textCounts)) {
      if (indices.length === 1) {
        hints.push({
          attribute: 'text/value',
          elementIndex: indices[0],
          value: text,
          suggestion: `${indices[0] + 1}. elementin metin içeriği "${text.substring(0, 60)}" olarak farklılaşıyor.`,
        });
      }
    }
  }

  hints.sort((a, b) => a.elementIndex - b.elementIndex);

  return hints.slice(0, 10);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(ms: number): string {
  if (ms < 1) return `< 1 ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}
