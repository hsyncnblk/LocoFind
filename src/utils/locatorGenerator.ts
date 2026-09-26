import type { Platform, LocatorStrategy, MatchedElement } from '../types';
import { evaluateXPath, generateXPath } from '../parsers/xpathEvaluator';

export interface LocatorCandidate {
  strategy: LocatorStrategy;
  value: string;
  resolvedXPath: string;
  matchCount: number;
  priority: number;
  label: string;
  appiumCommand: string;
  isUnique: boolean;
}

export interface GenerationResult {
  searchTerm: string;
  foundElements: FoundElement[];
  executionTimeMs: number;
}

export interface FoundElement {
  element: MatchedElement;
  domElement: Element;
  bestLocator: LocatorCandidate | null;
  alternatives: LocatorCandidate[];
  selfVerified: boolean;
}

function getAllElements(doc: Document): Element[] {
  const elements: Element[] = [];
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    elements.push(walker.currentNode as Element);
  }
  return elements;
}

function getElementAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
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
  const attrs = getElementAttributes(element);
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
    attrs['displayed'] === 'false'
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

export function findElementsByHint(doc: Document, hint: string): { element: MatchedElement; domElement: Element }[] {
  const allElements = getAllElements(doc);
  const lowerHint = hint.toLowerCase().trim();
  const results: { element: MatchedElement; domElement: Element; score: number }[] = [];

  for (const el of allElements) {
    const attrs = getElementAttributes(el);
    const directText = getDirectText(el);
    let score = 0;

    for (const [, val] of Object.entries(attrs)) {
      if (!val) continue;
      const lowerVal = val.toLowerCase();
      if (lowerVal === lowerHint) {
        score = Math.max(score, 100);
      } else if (lowerVal.includes(lowerHint)) {
        score = Math.max(score, 70);
      } else if (lowerHint.includes(lowerVal) && lowerVal.length > 2) {
        score = Math.max(score, 40);
      }
    }

    if (directText) {
      const lowerText = directText.toLowerCase();
      if (lowerText === lowerHint) {
        score = Math.max(score, 100);
      } else if (lowerText.includes(lowerHint)) {
        score = Math.max(score, 65);
      } else if (lowerHint.includes(lowerText) && lowerText.length > 2) {
        score = Math.max(score, 35);
      }
    }

    if (el.tagName.toLowerCase() === lowerHint) {
      score = Math.max(score, 30);
    }

    if (score > 0) {
      results.push({
        element: elementToMatchedElement(el, results.length),
        domElement: el,
        score,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 20).map((r, i) => {
    r.element.index = i;
    return { element: r.element, domElement: r.domElement };
  });
}

function countXPathMatches(doc: Document, xpath: string): number {
  try {
    const result = evaluateXPath(doc, xpath);
    return result.elements.length;
  } catch {
    return -1;
  }
}

function escapeXPathValue(val: string): string {
  if (!val.includes("'")) return `'${val}'`;
  if (!val.includes('"')) return `"${val}"`;
  const parts = val.split("'");
  return `concat('${parts.join("',\"'\",'")}')`;
}

function generateIOSCandidates(
  doc: Document,
  el: Element,
  attrs: Record<string, string>
): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];

  const name = attrs['name'] || '';
  const label = attrs['label'] || '';
  const identifier = attrs['identifier'] || '';
  const type = el.tagName;

  if (name) {
    const xpath = `//*[@name=${escapeXPathValue(name)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'accessibility-id',
      value: name,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 1,
      label: 'Accessibility ID (name)',
      appiumCommand: `AppiumBy.ACCESSIBILITY_ID, "${name}"`,
      isUnique: count === 1,
    });
  }

  if (label && label !== name) {
    const xpath = `//*[@label=${escapeXPathValue(label)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'accessibility-id',
      value: label,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 2,
      label: 'Accessibility ID (label)',
      appiumCommand: `AppiumBy.ACCESSIBILITY_ID, "${label}"`,
      isUnique: count === 1,
    });
  }

  if (identifier) {
    const xpath = `//*[@identifier=${escapeXPathValue(identifier)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'accessibility-id',
      value: identifier,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 1,
      label: 'Accessibility ID (identifier)',
      appiumCommand: `AppiumBy.ACCESSIBILITY_ID, "${identifier}"`,
      isUnique: count === 1,
    });
  }

  if (name && type) {
    const predValue = `type == '${type}' AND name == '${name}'`;
    const xpath = `//*[self::${type}][@name=${escapeXPathValue(name)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'predicate-string',
      value: predValue,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 3,
      label: 'iOS Predicate (type + name)',
      appiumCommand: `AppiumBy.IOS_PREDICATE, "${predValue}"`,
      isUnique: count === 1,
    });
  }

  if (label && type) {
    const predValue = `type == '${type}' AND label == '${label}'`;
    const xpath = `//*[self::${type}][@label=${escapeXPathValue(label)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'predicate-string',
      value: predValue,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 4,
      label: 'iOS Predicate (type + label)',
      appiumCommand: `AppiumBy.IOS_PREDICATE, "${predValue}"`,
      isUnique: count === 1,
    });
  }

  if (type.startsWith('XCUI') || type.startsWith('xcui')) {
    if (name) {
      const chainValue = `**/${type}[\`name == '${name}'\`]`;
      const xpath = `//*[self::${type}][@name=${escapeXPathValue(name)}]`;
      const count = countXPathMatches(doc, xpath);
      candidates.push({
        strategy: 'class-chain',
        value: chainValue,
        resolvedXPath: xpath,
        matchCount: count,
        priority: 5,
        label: 'iOS Class Chain',
        appiumCommand: `AppiumBy.IOS_CLASS_CHAIN, "${chainValue}"`,
        isUnique: count === 1,
      });
    }
  }

  return candidates;
}

function generateAndroidCandidates(
  doc: Document,
  el: Element,
  attrs: Record<string, string>
): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];

  const resourceId = attrs['resource-id'] || '';
  const contentDesc = attrs['content-desc'] || '';
  const text = attrs['text'] || '';

  if (resourceId) {
    const xpath = `//*[@resource-id=${escapeXPathValue(resourceId)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'resource-id',
      value: resourceId,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 1,
      label: 'Resource ID',
      appiumCommand: `AppiumBy.ID, "${resourceId}"`,
      isUnique: count === 1,
    });

    if (resourceId.includes(':id/') && count > 1) {
      const shortId = resourceId.split(':id/')[1];
      if (shortId && text) {
        const combinedXpath = `//*[@resource-id=${escapeXPathValue(resourceId)} and @text=${escapeXPathValue(text)}]`;
        const combinedCount = countXPathMatches(doc, combinedXpath);
        candidates.push({
          strategy: 'xpath',
          value: combinedXpath,
          resolvedXPath: combinedXpath,
          matchCount: combinedCount,
          priority: 2,
          label: 'XPath (ID + Text)',
          appiumCommand: `AppiumBy.XPATH, "${combinedXpath}"`,
          isUnique: combinedCount === 1,
        });
      }
    }
  }

  if (contentDesc) {
    const xpath = `//*[@content-desc=${escapeXPathValue(contentDesc)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'accessibility-id',
      value: contentDesc,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 2,
      label: 'Content Description',
      appiumCommand: `AppiumBy.ACCESSIBILITY_ID, "${contentDesc}"`,
      isUnique: count === 1,
    });
  }

  if (text) {
    const xpath = `//*[@text=${escapeXPathValue(text)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'text',
      value: text,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 3,
      label: 'Text',
      appiumCommand: `AppiumBy.XPATH, "//*[@text='${text}']"`,
      isUnique: count === 1,
    });
  }

  return candidates;
}

function generateWebCandidates(
  doc: Document,
  el: Element,
  attrs: Record<string, string>
): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];

  const id = attrs['id'] || '';
  const name = attrs['name'] || '';
  const className = attrs['class'] || '';
  const type = attrs['type'] || '';
  const tagName = el.tagName.toLowerCase();

  if (id) {
    const xpath = `//*[@id=${escapeXPathValue(id)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'id',
      value: id,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 1,
      label: 'HTML ID',
      appiumCommand: `By.ID, "${id}"`,
      isUnique: count === 1,
    });
  }

  if (name) {
    const xpath = `//*[@name=${escapeXPathValue(name)}]`;
    const count = countXPathMatches(doc, xpath);
    candidates.push({
      strategy: 'name',
      value: name,
      resolvedXPath: xpath,
      matchCount: count,
      priority: 2,
      label: 'HTML Name',
      appiumCommand: `By.NAME, "${name}"`,
      isUnique: count === 1,
    });
  }

  if (className) {
    const classes = className.split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      const mainClass = classes[0];
      const xpath = `//*[contains(@class, ${escapeXPathValue(mainClass)})]`;
      const count = countXPathMatches(doc, xpath);
      candidates.push({
        strategy: 'class-name',
        value: mainClass,
        resolvedXPath: xpath,
        matchCount: count,
        priority: 4,
        label: 'Class Name',
        appiumCommand: `By.CLASS_NAME, "${mainClass}"`,
        isUnique: count === 1,
      });

      if (id || name || type) {
        let cssSelector = tagName;
        if (id) cssSelector += `#${id}`;
        else if (classes.length > 0) cssSelector += `.${classes.join('.')}`;
        if (type) cssSelector += `[type="${type}"]`;
        const cssXpath = id
          ? `//${tagName}[@id=${escapeXPathValue(id)}]`
          : `//${tagName}[contains(@class, ${escapeXPathValue(mainClass)})]`;
        const cssCount = countXPathMatches(doc, cssXpath);
        candidates.push({
          strategy: 'css-selector',
          value: cssSelector,
          resolvedXPath: cssXpath,
          matchCount: cssCount,
          priority: 3,
          label: 'CSS Selector',
          appiumCommand: `By.CSS_SELECTOR, "${cssSelector}"`,
          isUnique: cssCount === 1,
        });
      }
    }
  }

  return candidates;
}

function generateParentContextLocator(
  doc: Document,
  el: Element,
  platform: Platform
): LocatorCandidate | null {
  const parent = el.parentElement;
  if (!parent || parent === doc.documentElement) return null;

  const parentAttrs = getElementAttributes(parent);
  const childTag = el.tagName;

  let parentIdentifier = '';
  let parentAttrName = '';

  if (platform === 'ios') {
    parentIdentifier = parentAttrs['name'] || parentAttrs['label'] || '';
    parentAttrName = parentAttrs['name'] ? 'name' : 'label';
  } else if (platform === 'android') {
    parentIdentifier = parentAttrs['resource-id'] || parentAttrs['content-desc'] || '';
    parentAttrName = parentAttrs['resource-id'] ? 'resource-id' : 'content-desc';
  } else {
    parentIdentifier = parentAttrs['id'] || parentAttrs['class'] || '';
    parentAttrName = parentAttrs['id'] ? 'id' : 'class';
  }

  if (!parentIdentifier) return null;

  let siblingIndex = 1;
  let sibling = el.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === childTag) siblingIndex++;
    sibling = sibling.previousElementSibling;
  }

  let sameTagCount = 0;
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].tagName === childTag) sameTagCount++;
  }

  const useParentContains = parentAttrName === 'class';
  const parentCondition = useParentContains
    ? `contains(@${parentAttrName}, ${escapeXPathValue(parentIdentifier.split(/\s+/)[0])})`
    : `@${parentAttrName}=${escapeXPathValue(parentIdentifier)}`;

  let xpath: string;
  if (sameTagCount === 1) {
    xpath = `//*[${parentCondition}]/${childTag}`;
  } else {
    xpath = `//*[${parentCondition}]/${childTag}[${siblingIndex}]`;
  }

  const count = countXPathMatches(doc, xpath);

  return {
    strategy: 'xpath',
    value: xpath,
    resolvedXPath: xpath,
    matchCount: count,
    priority: 8,
    label: 'XPath (Parent Context)',
    appiumCommand: `AppiumBy.XPATH, "${xpath}"`,
    isUnique: count === 1,
  };
}

function generateSiblingLocator(
  doc: Document,
  el: Element
): LocatorCandidate | null {
  const parent = el.parentElement;
  if (!parent) return null;

  const prevSibling = el.previousElementSibling;
  if (!prevSibling) return null;

  const prevAttrs = getElementAttributes(prevSibling);
  const identifier = prevAttrs['name'] || prevAttrs['label'] || prevAttrs['text'] ||
    prevAttrs['resource-id'] || prevAttrs['content-desc'] || prevAttrs['id'] || '';

  if (!identifier) return null;

  const attrName = prevAttrs['name'] ? 'name' :
    prevAttrs['label'] ? 'label' :
    prevAttrs['text'] ? 'text' :
    prevAttrs['resource-id'] ? 'resource-id' :
    prevAttrs['content-desc'] ? 'content-desc' :
    prevAttrs['id'] ? 'id' : '';

  if (!attrName) return null;

  const xpath = `//*[@${attrName}=${escapeXPathValue(identifier)}]/following-sibling::${el.tagName}[1]`;
  const count = countXPathMatches(doc, xpath);

  return {
    strategy: 'xpath',
    value: xpath,
    resolvedXPath: xpath,
    matchCount: count,
    priority: 9,
    label: 'XPath (Sibling)',
    appiumCommand: `AppiumBy.XPATH, "${xpath}"`,
    isUnique: count === 1,
  };
}

function generateGrandparentLocator(
  doc: Document,
  el: Element,
  platform: Platform
): LocatorCandidate | null {
  const parent = el.parentElement;
  if (!parent) return null;
  const grandparent = parent.parentElement;
  if (!grandparent || grandparent === doc.documentElement) return null;

  const gpAttrs = getElementAttributes(grandparent);
  let gpId = '';
  let gpAttrName = '';

  if (platform === 'ios') {
    gpId = gpAttrs['name'] || gpAttrs['label'] || '';
    gpAttrName = gpAttrs['name'] ? 'name' : 'label';
  } else if (platform === 'android') {
    gpId = gpAttrs['resource-id'] || gpAttrs['content-desc'] || '';
    gpAttrName = gpAttrs['resource-id'] ? 'resource-id' : 'content-desc';
  } else {
    gpId = gpAttrs['id'] || gpAttrs['name'] || '';
    gpAttrName = gpAttrs['id'] ? 'id' : 'name';
  }

  if (!gpId) return null;

  const xpath = `//*[@${gpAttrName}=${escapeXPathValue(gpId)}]//${el.tagName}`;
  const count = countXPathMatches(doc, xpath);

  if (count > 5) return null;

  return {
    strategy: 'xpath',
    value: xpath,
    resolvedXPath: xpath,
    matchCount: count,
    priority: 9,
    label: 'XPath (Grandparent Context)',
    appiumCommand: `AppiumBy.XPATH, "${xpath}"`,
    isUnique: count === 1,
  };
}

function generateAncestorDescendantLocator(
  doc: Document,
  el: Element,
  platform: Platform
): LocatorCandidate | null {
  let ancestor: Element | null = el.parentElement;
  let depth = 0;
  const maxDepth = 5;

  while (ancestor && ancestor !== doc.documentElement && depth < maxDepth) {
    const aAttrs = getElementAttributes(ancestor);
    let aId = '';
    let aAttrName = '';

    if (platform === 'ios') {
      aId = aAttrs['name'] || aAttrs['label'] || aAttrs['identifier'] || '';
      aAttrName = aAttrs['name'] ? 'name' : aAttrs['label'] ? 'label' : 'identifier';
    } else if (platform === 'android') {
      aId = aAttrs['resource-id'] || aAttrs['content-desc'] || '';
      aAttrName = aAttrs['resource-id'] ? 'resource-id' : 'content-desc';
    } else {
      aId = aAttrs['id'] || aAttrs['name'] || '';
      aAttrName = aAttrs['id'] ? 'id' : 'name';
    }

    if (aId) {
      const xpath = `//*[@${aAttrName}=${escapeXPathValue(aId)}]/descendant::${el.tagName}`;
      const count = countXPathMatches(doc, xpath);

      if (count === 1) {
        return {
          strategy: 'xpath',
          value: xpath,
          resolvedXPath: xpath,
          matchCount: count,
          priority: 7 + depth,
          label: `XPath (Ancestor → ${el.tagName})`,
          appiumCommand: `AppiumBy.XPATH, "${xpath}"`,
          isUnique: true,
        };
      }

      const elAttrs = getElementAttributes(el);
      const elId = elAttrs['name'] || elAttrs['label'] || elAttrs['text'] ||
        elAttrs['resource-id'] || elAttrs['content-desc'] || elAttrs['id'] || '';

      if (elId && count > 1) {
        const elAttrName = elAttrs['name'] ? 'name' : elAttrs['label'] ? 'label' :
          elAttrs['text'] ? 'text' : elAttrs['resource-id'] ? 'resource-id' :
          elAttrs['content-desc'] ? 'content-desc' : 'id';
        const refinedXpath = `//*[@${aAttrName}=${escapeXPathValue(aId)}]/descendant::${el.tagName}[@${elAttrName}=${escapeXPathValue(elId)}]`;
        const refinedCount = countXPathMatches(doc, refinedXpath);

        if (refinedCount >= 1 && refinedCount <= 3) {
          return {
            strategy: 'xpath',
            value: refinedXpath,
            resolvedXPath: refinedXpath,
            matchCount: refinedCount,
            priority: 6 + depth,
            label: `XPath (Ancestor + Attribute)`,
            appiumCommand: `AppiumBy.XPATH, "${refinedXpath}"`,
            isUnique: refinedCount === 1,
          };
        }
      }
    }

    ancestor = ancestor.parentElement;
    depth++;
  }

  return null;
}

function generateTagIndexLocator(
  doc: Document,
  el: Element
): LocatorCandidate | null {
  const parent = el.parentElement;
  if (!parent) return null;

  let index = 1;
  let sibling = el.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === el.tagName) index++;
    sibling = sibling.previousElementSibling;
  }

  let sameTagTotal = 0;
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].tagName === el.tagName) sameTagTotal++;
  }

  if (sameTagTotal <= 1) return null;

  const xpath = `//${el.tagName}[${index}]`;
  const count = countXPathMatches(doc, xpath);

  return {
    strategy: 'xpath',
    value: xpath,
    resolvedXPath: xpath,
    matchCount: count,
    priority: 10,
    label: `XPath (Tag Index [${index}/${sameTagTotal}])`,
    appiumCommand: `AppiumBy.XPATH, "${xpath}"`,
    isUnique: count === 1,
  };
}

export function generateLocatorsForElement(
  doc: Document,
  platform: Platform,
  el: Element
): { best: LocatorCandidate | null; alternatives: LocatorCandidate[] } {
  const attrs = getElementAttributes(el);

  let candidates: LocatorCandidate[] = [];

  if (platform === 'ios') {
    candidates = generateIOSCandidates(doc, el, attrs);
  } else if (platform === 'android') {
    candidates = generateAndroidCandidates(doc, el, attrs);
  } else {
    candidates = generateWebCandidates(doc, el, attrs);
  }

  const parentCandidate = generateParentContextLocator(doc, el, platform);
  if (parentCandidate) candidates.push(parentCandidate);

  const siblingCandidate = generateSiblingLocator(doc, el);
  if (siblingCandidate) candidates.push(siblingCandidate);

  const grandparentCandidate = generateGrandparentLocator(doc, el, platform);
  if (grandparentCandidate) candidates.push(grandparentCandidate);

  const ancestorCandidate = generateAncestorDescendantLocator(doc, el, platform);
  if (ancestorCandidate) candidates.push(ancestorCandidate);

  const tagIndexCandidate = generateTagIndexLocator(doc, el);
  if (tagIndexCandidate) candidates.push(tagIndexCandidate);

  candidates = candidates.filter(c => c.matchCount >= 0);

  candidates.sort((a, b) => {
    if (a.isUnique && !b.isUnique) return -1;
    if (!a.isUnique && b.isUnique) return 1;
    if (a.isUnique && b.isUnique) return a.priority - b.priority;
    if (a.matchCount !== b.matchCount) return a.matchCount - b.matchCount;
    return a.priority - b.priority;
  });

  const best = candidates.find(c => c.isUnique) || candidates[0] || null;
  const alternatives = candidates.filter(c => c !== best);

  return { best, alternatives };
}

export function searchAndGenerate(
  doc: Document,
  platform: Platform,
  searchTerm: string
): GenerationResult {
  const startTime = performance.now();

  const matches = findElementsByHint(doc, searchTerm);

  const foundElements: FoundElement[] = matches.map(({ element, domElement }) => {
    const { best, alternatives } = generateLocatorsForElement(doc, platform, domElement);
    return {
      element,
      domElement,
      bestLocator: best,
      alternatives,
      selfVerified: best ? best.isUnique : false,
    };
  });

  return {
    searchTerm,
    foundElements,
    executionTimeMs: performance.now() - startTime,
  };
}

function parseLineForTags(line: string): { tagName: string; attrs: Record<string, string> }[] {
  const results: { tagName: string; attrs: Record<string, string> }[] = [];
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9_.:-]*)(\s[^>]*?)?\s*\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(line)) !== null) {
    const tagName = match[1];
    const attrString = match[2] || '';
    const attrs: Record<string, string> = {};

    const attrRegex = /([a-zA-Z][a-zA-Z0-9_:-]*)=["']([^"']*?)["']/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    results.push({ tagName, attrs });
  }

  return results;
}

function findDomElementByTagAndAttrs(
  doc: Document,
  tagName: string,
  attrs: Record<string, string>
): Element | null {
  const allElements = getAllElements(doc);

  let bestMatch: Element | null = null;
  let bestScore = 0;

  for (const el of allElements) {
    if (el.tagName !== tagName) continue;

    let score = 1;
    const elAttrs = getElementAttributes(el);
    const attrKeys = Object.keys(attrs);

    if (attrKeys.length === 0) {
      if (!bestMatch) {
        bestMatch = el;
        bestScore = 1;
      }
      continue;
    }

    let matchedAttrs = 0;
    for (const key of attrKeys) {
      if (elAttrs[key] === attrs[key]) {
        matchedAttrs++;
      }
    }

    score = matchedAttrs / attrKeys.length * 100;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = el;
    }

    if (score === 100) break;
  }

  return bestMatch;
}

export function generateByLine(
  doc: Document,
  platform: Platform,
  xmlSource: string,
  lineNumber: number
): GenerationResult {
  const startTime = performance.now();
  const lines = xmlSource.split('\n');

  if (lineNumber < 1 || lineNumber > lines.length) {
    return {
      searchTerm: `Satır ${lineNumber}`,
      foundElements: [],
      executionTimeMs: performance.now() - startTime,
    };
  }

  const targetLine = lines[lineNumber - 1];
  const tagsOnLine = parseLineForTags(targetLine);

  if (tagsOnLine.length === 0) {
    const searchRange = 3;
    for (let offset = 1; offset <= searchRange; offset++) {
      for (const dir of [-1, 1]) {
        const checkLine = lineNumber - 1 + (offset * dir);
        if (checkLine >= 0 && checkLine < lines.length) {
          const nearbyTags = parseLineForTags(lines[checkLine]);
          if (nearbyTags.length > 0) {
            tagsOnLine.push(...nearbyTags);
            break;
          }
        }
      }
      if (tagsOnLine.length > 0) break;
    }
  }

  if (tagsOnLine.length === 0) {
    return {
      searchTerm: `Satır ${lineNumber}`,
      foundElements: [],
      executionTimeMs: performance.now() - startTime,
    };
  }

  const foundElements: FoundElement[] = [];

  for (const tag of tagsOnLine) {
    const domEl = findDomElementByTagAndAttrs(doc, tag.tagName, tag.attrs);
    if (!domEl) continue;

    const element = elementToMatchedElement(domEl, foundElements.length);
    const { best, alternatives } = generateLocatorsForElement(doc, platform, domEl);

    foundElements.push({
      element,
      domElement: domEl,
      bestLocator: best,
      alternatives,
      selfVerified: best ? best.isUnique : false,
    });
  }

  return {
    searchTerm: `Satır ${lineNumber}`,
    foundElements,
    executionTimeMs: performance.now() - startTime,
  };
}

