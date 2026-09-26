import type { ParseResult, ParseError } from '../types';

const XML_DECLARATION_REGEX = /^<\?xml[^?]*\?>/i;
const ENCODING_REGEX = /encoding=["']([^"']+)["']/i;

function preprocessXml(raw: string): { xml: string; warnings: ParseError[] } {
  const warnings: ParseError[] = [];
  let xml = raw.trim();

  if (xml.charCodeAt(0) === 0xfeff) {
    xml = xml.substring(1);
    warnings.push({ type: 'warning', message: 'BOM (Byte Order Mark) kaldırıldı.' });
  }

  const encodingMatch = xml.match(ENCODING_REGEX);
  if (encodingMatch && encodingMatch[1].toLowerCase() !== 'utf-8') {
    xml = xml.replace(ENCODING_REGEX, 'encoding="UTF-8"');
    warnings.push({
      type: 'warning',
      message: `Encoding "${encodingMatch[1]}" → "UTF-8" olarak düzeltildi.`,
    });
  }

  xml = xml.replace(XML_DECLARATION_REGEX, '').trim();

  xml = xml.replace(/<(br|hr|img|input|meta|link)(\s[^>]*)?\s*(?<!\/)>/gi, '<$1$2/>');

  xml = xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;');

  return { xml, warnings };
}

function extractParserErrors(doc: Document): ParseError[] {
  const errors: ParseError[] = [];
  const parsererror = doc.querySelector('parsererror');
  if (parsererror) {
    const text = parsererror.textContent || 'Bilinmeyen parse hatası';
    const lineMatch = text.match(/line\s+(\d+)/i);
    const colMatch = text.match(/column\s+(\d+)/i);
    errors.push({
      type: 'error',
      message: text.split('\n')[0].trim(),
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      column: colMatch ? parseInt(colMatch[1]) : undefined,
    });
  }
  return errors;
}

function countNodes(doc: Document): number {
  let count = 0;
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) count++;
  return count;
}

function wrapInRoot(xml: string): string {
  const trimmed = xml.trim();
  if (!trimmed.startsWith('<')) return `<__root__>${trimmed}</__root__>`;

  const tempDoc = new DOMParser().parseFromString(trimmed, 'text/xml');
  if (tempDoc.querySelector('parsererror')) {
    return `<__root__>${trimmed}</__root__>`;
  }
  return trimmed;
}

export function parseSource(rawSource: string): ParseResult {
  const startTime = performance.now();
  const allErrors: ParseError[] = [];

  if (!rawSource.trim()) {
    return {
      doc: null,
      errors: [{ type: 'error', message: 'Boş kaynak. Lütfen XML veya HTML içeriği girin.' }],
      nodeCount: 0,
      parseTimeMs: 0,
    };
  }

  const { xml: preprocessed, warnings } = preprocessXml(rawSource);
  allErrors.push(...warnings);

  try {
    const doc = new DOMParser().parseFromString(preprocessed, 'text/xml');
    const xmlErrors = extractParserErrors(doc);

    if (xmlErrors.length === 0) {
      const parseTimeMs = performance.now() - startTime;
      return {
        doc,
        errors: allErrors,
        nodeCount: countNodes(doc),
        parseTimeMs,
      };
    }
  } catch {
  }

  try {
    const wrapped = wrapInRoot(preprocessed);
    const doc = new DOMParser().parseFromString(wrapped, 'text/xml');
    const xmlErrors = extractParserErrors(doc);

    if (xmlErrors.length === 0) {
      const parseTimeMs = performance.now() - startTime;
      allErrors.push({
        type: 'warning',
        message: 'XML birden fazla kök elemana sahip, sarmalayıcı eklendi.',
      });
      return {
        doc,
        errors: allErrors,
        nodeCount: countNodes(doc),
        parseTimeMs,
      };
    }
  } catch {
  }

  try {
    const doc = new DOMParser().parseFromString(preprocessed, 'text/html');
    const parseTimeMs = performance.now() - startTime;
    const nodeCount = countNodes(doc);

    if (nodeCount > 0) {
      allErrors.push({
        type: 'warning',
        message: 'XML olarak parse edilemedi, HTML modunda parse edildi. Bazı öznitelikler küçük harfe dönüştürülmüş olabilir.',
      });
      return {
        doc,
        errors: allErrors,
        nodeCount,
        parseTimeMs,
      };
    }
  } catch {
  }

  const parseTimeMs = performance.now() - startTime;
  allErrors.push({
    type: 'error',
    message: 'Kaynak parse edilemedi. Lütfen XML/HTML formatını kontrol edin.',
  });

  return {
    doc: null,
    errors: allErrors,
    nodeCount: 0,
    parseTimeMs,
  };
}
