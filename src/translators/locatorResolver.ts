import type { Platform, LocatorStrategy } from '../types';
import { predicateToXPath } from './iosPredicate';
import { classChainToXPath } from './iosClassChain';
import { cssToXPath } from './cssToXpath';

interface ResolveResult {
  xpath: string;
  error?: string;
  strategyNote?: string;
}

export function resolveLocator(
  platform: Platform,
  strategy: LocatorStrategy,
  value: string
): ResolveResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { xpath: '', error: 'Locator değeri boş.' };
  }

  if (platform === 'ios') {
    switch (strategy) {
      case 'xpath':
        return { xpath: trimmed };

      case 'accessibility-id':
        return {
          xpath: `//*[@name='${trimmed}' or @label='${trimmed}' or @identifier='${trimmed}']`,
          strategyNote: `Accessibility ID: name, label veya identifier özniteliklerinde "${trimmed}" aranıyor.`,
        };

      case 'predicate-string': {
        const result = predicateToXPath(trimmed);
        return {
          xpath: result.xpath,
          error: result.error,
          strategyNote: `iOS Predicate String XPath karşılığına çevrildi.`,
        };
      }

      case 'class-chain': {
        const result = classChainToXPath(trimmed);
        return {
          xpath: result.xpath,
          error: result.error,
          strategyNote: `iOS Class Chain XPath karşılığına çevrildi.`,
        };
      }

      default:
        return { xpath: '', error: `Desteklenmeyen iOS stratejisi: ${strategy}` };
    }
  }

  if (platform === 'android') {
    switch (strategy) {
      case 'xpath':
        return { xpath: trimmed };

      case 'resource-id': {
        const isFullId = trimmed.includes(':id/');
        if (isFullId) {
          return {
            xpath: `//*[@resource-id='${trimmed}']`,
            strategyNote: `Tam Resource ID ile eşleştiriliyor.`,
          };
        } else {
          return {
            xpath: `//*[contains(@resource-id, '${trimmed}') or @resource-id='${trimmed}']`,
            strategyNote: `Kısa Resource ID ile eşleştiriliyor (ends-with yaklaşımı).`,
          };
        }
      }

      case 'accessibility-id':
        return {
          xpath: `//*[@content-desc='${trimmed}']`,
          strategyNote: `Content Description ile eşleştiriliyor.`,
        };

      case 'text':
        if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
          const inner = trimmed.slice(1, -1);
          return {
            xpath: `//*[contains(@text, '${inner}')]`,
            strategyNote: `Metin kısmi eşleşme (contains) kullanılıyor.`,
          };
        }
        return {
          xpath: `//*[@text='${trimmed}']`,
          strategyNote: `Tam metin eşleşmesi. Kısmi eşleşme için *metin* formatını kullanın.`,
        };

      default:
        return { xpath: '', error: `Desteklenmeyen Android stratejisi: ${strategy}` };
    }
  }

  if (platform === 'web') {
    switch (strategy) {
      case 'xpath':
        return { xpath: trimmed };

      case 'css-selector': {
        const result = cssToXPath(trimmed);
        return {
          xpath: result.xpath,
          error: result.error,
          strategyNote: `CSS Selector XPath karşılığına çevrildi.`,
        };
      }

      case 'id':
        return {
          xpath: `//*[@id='${trimmed}']`,
          strategyNote: `HTML ID özniteliği ile eşleştiriliyor.`,
        };

      case 'name':
        return {
          xpath: `//*[@name='${trimmed}']`,
          strategyNote: `HTML name özniteliği ile eşleştiriliyor.`,
        };

      case 'class-name':
        return {
          xpath: `//*[contains(@class, '${trimmed}')]`,
          strategyNote: `CSS class adı ile eşleştiriliyor (contains).`,
        };

      default:
        return { xpath: '', error: `Desteklenmeyen Web stratejisi: ${strategy}` };
    }
  }

  return { xpath: '', error: `Desteklenmeyen platform: ${platform}` };
}
