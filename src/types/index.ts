export type Platform = 'ios' | 'android' | 'web';

export type IOSStrategy = 'xpath' | 'accessibility-id' | 'predicate-string' | 'class-chain';
export type AndroidStrategy = 'xpath' | 'resource-id' | 'accessibility-id' | 'text';
export type WebStrategy = 'xpath' | 'css-selector' | 'id' | 'name' | 'class-name';

export type LocatorStrategy = IOSStrategy | AndroidStrategy | WebStrategy;

export interface StrategyOption {
  value: LocatorStrategy;
  label: string;
  description: string;
}

export interface ParseError {
  type: 'error' | 'warning';
  message: string;
  line?: number;
  column?: number;
}

export interface ParseResult {
  doc: Document | null;
  errors: ParseError[];
  nodeCount: number;
  parseTimeMs: number;
}

export type MatchStatus = 'unique' | 'multiple' | 'not-found' | 'error';

export interface ElementAttributes {
  [key: string]: string;
}

export interface MatchedElement {
  index: number;
  tagName: string;
  text: string;
  attributes: ElementAttributes;
  visible: boolean;
  clickable: boolean;
  enabled: boolean;
  xpath: string;
  depth: number;
  parentTag: string;
  childCount: number;
}

export interface LocatorResult {
  status: MatchStatus;
  matchCount: number;
  elements: MatchedElement[];
  resolvedXPath: string;
  executionTimeMs: number;
  differentiatorHints: DifferentiatorHint[];
  errorMessage?: string;
}

export interface DifferentiatorHint {
  attribute: string;
  elementIndex: number;
  value: string;
  suggestion: string;
}

export interface DomTreeNode {
  id: string;
  tagName: string;
  attributes: ElementAttributes;
  children: DomTreeNode[];
  depth: number;
  isMatched: boolean;
  textContent: string;
}

export interface AppState {
  platform: Platform;
  strategy: LocatorStrategy;
  locatorValue: string;
  xmlSource: string;
  fileName: string | null;
  parseResult: ParseResult | null;
  locatorResult: LocatorResult | null;
  isProcessing: boolean;
}
