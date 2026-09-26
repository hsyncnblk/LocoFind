import type { MatchedElement, ElementAttributes } from '../types';

export function generateXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index++;
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName;
    let hasNextSameTag = false;
    let nextSib = current.nextElementSibling;
    while (nextSib) {
      if (nextSib.tagName === current.tagName) {
        hasNextSameTag = true;
        break;
      }
      nextSib = nextSib.nextElementSibling;
    }

    if (index > 1 || hasNextSameTag) {
      parts.unshift(`${tagName}[${index}]`);
    } else {
      parts.unshift(tagName);
    }

    current = current.parentElement;
  }

  return '/' + parts.join('/');
}

function getAttributes(element: Element): ElementAttributes {
  const attrs: ElementAttributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

function getDirectText(element: Element): string {
  let text = '';
  for (let i = 0; i < element.childNodes.length; i++) {
    if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
      text += element.childNodes[i].textContent || '';
    }
  }
  return text.trim();
}

function getDepth(element: Element): number {
  let depth = 0;
  let parent = element.parentElement;
  while (parent) {
    depth++;
    parent = parent.parentElement;
  }
  return depth;
}

function elementToMatchedElement(element: Element, index: number): MatchedElement {
  const attrs = getAttributes(element);

  const text =
    attrs['text'] ||
    attrs['value'] ||
    attrs['label'] ||
    attrs['name'] ||
    attrs['content-desc'] ||
    getDirectText(element) ||
    '';

  const visible = !(
    attrs['visible'] === 'false' ||
    attrs['displayed'] === 'false' ||
    attrs['style']?.includes('display: none') ||
    attrs['style']?.includes('visibility: hidden')
  );

  const clickable =
    attrs['clickable'] === 'true' ||
    attrs['accessible'] === 'true' ||
    element.tagName.toLowerCase() === 'button' ||
    element.tagName.toLowerCase() === 'a';

  const enabled = attrs['enabled'] !== 'false' && attrs['disabled'] === undefined;

  return {
    index,
    tagName: element.tagName,
    text: text.substring(0, 200),
    attributes: attrs,
    visible,
    clickable,
    enabled,
    xpath: generateXPath(element),
    depth: getDepth(element),
    parentTag: element.parentElement?.tagName || '(root)',
    childCount: element.children.length,
  };
}

export function evaluateXPath(
  doc: Document,
  xpath: string
): { elements: MatchedElement[]; error?: string } {
  try {
    const nsResolver = doc.createNSResolver(doc.documentElement);

    const result = doc.evaluate(
      xpath,
      doc,
      nsResolver,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const elements: MatchedElement[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        elements.push(elementToMatchedElement(node as Element, i));
      }
    }

    return { elements };
  } catch {
    try {
      const result = doc.evaluate(
        xpath,
        doc,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      const elements: MatchedElement[] = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i);
        if (node && node.nodeType === Node.ELEMENT_NODE) {
          elements.push(elementToMatchedElement(node as Element, i));
        }
      }

      return { elements };
    } catch (innerErr) {
      return {
        elements: [],
        error: `XPath hatası: ${(innerErr as Error).message}`,
      };
    }
  }
}
