import { predicateToXPath } from './iosPredicate';

interface ClassChainSegment {
  isDescendant: boolean;
  elementType: string;
  index?: number;
  predicate?: string;
}

function parseClassChain(classChain: string): ClassChainSegment[] {
  const segments: ClassChainSegment[] = [];
  const raw = classChain.trim();

  const parts: string[] = [];
  let current = '';
  let i = 0;

  while (i < raw.length) {
    if (raw[i] === '/' && raw[i - 1] !== '*') {
      if (current) parts.push(current);
      current = '';
      i++;
      continue;
    }
    current += raw[i];
    i++;
  }
  if (current) parts.push(current);

  for (const part of parts) {
    let segmentStr = part.trim();
    if (!segmentStr) continue;

    const isDescendant = segmentStr.startsWith('**') || (!raw.startsWith('/') && segments.length === 0);
    if (segmentStr.startsWith('**')) {
      segmentStr = segmentStr.replace(/^\*+\/?/, '');
    }

    if (!segmentStr) continue;

    let predicate: string | undefined;
    const predicateMatch = segmentStr.match(/\[`([^`]+)`\]/);
    if (predicateMatch) {
      predicate = predicateMatch[1];
      segmentStr = segmentStr.replace(predicateMatch[0], '');
    }

    let index: number | undefined;
    const indexMatch = segmentStr.match(/\[(\d+)\]/);
    if (indexMatch) {
      index = parseInt(indexMatch[1]);
      segmentStr = segmentStr.replace(indexMatch[0], '');
    }

    const elementType = segmentStr.trim();

    if (elementType || isDescendant) {
      segments.push({
        isDescendant,
        elementType: elementType || '*',
        index,
        predicate,
      });
    }
  }

  return segments;
}

function segmentToXPath(segment: ClassChainSegment): string {
  const axis = segment.isDescendant ? '//' : '/';
  let xpath = `${axis}${segment.elementType}`;

  const predicates: string[] = [];

  if (segment.predicate) {
    const result = predicateToXPath(segment.predicate);
    if (result.xpath) {
      const match = result.xpath.match(/\/\/\*\[(.+)\]/);
      if (match) {
        predicates.push(match[1]);
      }
    }
  }

  if (segment.index !== undefined) {
    predicates.push(`${segment.index}`);
  }

  if (predicates.length > 0) {
    xpath += `[${predicates.join(' and ')}]`;
  }

  return xpath;
}

export function classChainToXPath(classChain: string): { xpath: string; error?: string } {
  try {
    const segments = parseClassChain(classChain);

    if (segments.length === 0) {
      return { xpath: '', error: 'Boş class chain ifadesi.' };
    }

    let xpath = '';
    for (const segment of segments) {
      xpath += segmentToXPath(segment);
    }

    if (!xpath.startsWith('/')) {
      xpath = '/' + xpath;
    }

    return { xpath };
  } catch (err) {
    return {
      xpath: '',
      error: `Class chain parse hatası: ${(err as Error).message}`,
    };
  }
}
