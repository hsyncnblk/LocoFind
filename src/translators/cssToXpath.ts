interface CssToken {
  type: 'tag' | 'id' | 'class' | 'attr' | 'pseudo' | 'combinator';
  value: string;
  operator?: string;
  attrValue?: string;
}

function tokenizeCss(selector: string): CssToken[][] {
  const groups: CssToken[][] = [[]];
  let current = groups[0];
  let i = 0;
  const s = selector.trim();

  while (i < s.length) {
    if (/\s/.test(s[i]) && s[i] !== ' ') {
      i++;
      continue;
    }

    if (s[i] === '>') {
      current.push({ type: 'combinator', value: '>' });
      i++;
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }

    if (s[i] === '+') {
      current.push({ type: 'combinator', value: '+' });
      i++;
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }

    if (s[i] === '~') {
      current.push({ type: 'combinator', value: '~' });
      i++;
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }

    if (s[i] === ' ') {
      i++;
      while (i < s.length && s[i] === ' ') i++;
      if (i < s.length && !'>+~'.includes(s[i])) {
        current.push({ type: 'combinator', value: ' ' });
      }
      continue;
    }

    if (s[i] === '#') {
      i++;
      let val = '';
      while (i < s.length && /[a-zA-Z0-9_-]/.test(s[i])) {
        val += s[i];
        i++;
      }
      current.push({ type: 'id', value: val });
      continue;
    }

    if (s[i] === '.') {
      i++;
      let val = '';
      while (i < s.length && /[a-zA-Z0-9_-]/.test(s[i])) {
        val += s[i];
        i++;
      }
      current.push({ type: 'class', value: val });
      continue;
    }

    if (s[i] === '[') {
      i++;
      let attr = '';
      let operator = '';
      let attrValue = '';

      while (i < s.length && s[i] !== ']' && !'~^$*|='.includes(s[i])) {
        attr += s[i];
        i++;
      }
      attr = attr.trim();

      if (i < s.length && s[i] !== ']') {
        while (i < s.length && s[i] !== ']' && s[i] !== "'" && s[i] !== '"') {
          operator += s[i];
          i++;
        }
        operator = operator.trim();

        if (i < s.length && (s[i] === "'" || s[i] === '"')) {
          const quote = s[i];
          i++;
          while (i < s.length && s[i] !== quote) {
            attrValue += s[i];
            i++;
          }
          i++;
        } else {
          while (i < s.length && s[i] !== ']') {
            attrValue += s[i];
            i++;
          }
          attrValue = attrValue.trim();
        }
      }

      if (s[i] === ']') i++;

      current.push({ type: 'attr', value: attr, operator, attrValue });
      continue;
    }

    if (s[i] === ':') {
      i++;
      let val = '';
      while (i < s.length && /[a-zA-Z0-9_(-)]/.test(s[i])) {
        val += s[i];
        i++;
        if (val.endsWith('(')) {
          while (i < s.length && s[i] !== ')') {
            val += s[i];
            i++;
          }
          if (s[i] === ')') {
            val += ')';
            i++;
          }
        }
      }
      current.push({ type: 'pseudo', value: val });
      continue;
    }

    if (/[a-zA-Z*]/.test(s[i])) {
      let val = '';
      while (i < s.length && /[a-zA-Z0-9_-]/.test(s[i])) {
        val += s[i];
        i++;
      }
      current.push({ type: 'tag', value: val });
      continue;
    }

    if (s[i] === ',') {
      groups.push([]);
      current = groups[groups.length - 1];
      i++;
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }

    i++;
  }

  return groups;
}

function attrToXPath(attr: string, operator: string, value: string): string {
  if (!operator) return `@${attr}`;

  switch (operator) {
    case '=':
      return `@${attr}='${value}'`;
    case '~=':
      return `contains(concat(' ', @${attr}, ' '), ' ${value} ')`;
    case '^=':
      return `starts-with(@${attr}, '${value}')`;
    case '$=':
      return `substring(@${attr}, string-length(@${attr}) - string-length('${value}') + 1) = '${value}'`;
    case '*=':
      return `contains(@${attr}, '${value}')`;
    case '|=':
      return `@${attr}='${value}' or starts-with(@${attr}, '${value}-')`;
    default:
      return `@${attr}='${value}'`;
  }
}

function pseudoToXPath(pseudo: string): string {
  if (pseudo === 'first-child') return '1';
  if (pseudo === 'last-child') return 'last()';

  const nthMatch = pseudo.match(/nth-child\((\d+)\)/);
  if (nthMatch) return nthMatch[1];

  return '';
}

function groupToXPath(tokens: CssToken[]): string {
  if (tokens.length === 0) return '//*';

  let xpath = '';
  let currentTag = '*';
  let predicates: string[] = [];
  let pendingCombinator = '//';

  for (const token of tokens) {
    switch (token.type) {
      case 'tag':
        currentTag = token.value;
        break;

      case 'id':
        predicates.push(`@id='${token.value}'`);
        break;

      case 'class':
        predicates.push(`contains(@class, '${token.value}')`);
        break;

      case 'attr':
        predicates.push(attrToXPath(token.value, token.operator || '', token.attrValue || ''));
        break;

      case 'pseudo': {
        const xp = pseudoToXPath(token.value);
        if (xp) predicates.push(xp);
        break;
      }

      case 'combinator': {
        xpath += pendingCombinator + currentTag;
        if (predicates.length > 0) {
          xpath += `[${predicates.join(' and ')}]`;
        }
        predicates = [];
        currentTag = '*';

        switch (token.value) {
          case '>':
            pendingCombinator = '/';
            break;
          case ' ':
            pendingCombinator = '//';
            break;
          case '+':
            pendingCombinator = '/following-sibling::';
            break;
          case '~':
            pendingCombinator = '/following-sibling::';
            break;
        }
        break;
      }
    }
  }

  xpath += pendingCombinator + currentTag;
  if (predicates.length > 0) {
    xpath += `[${predicates.join(' and ')}]`;
  }

  return xpath;
}

export function cssToXPath(selector: string): { xpath: string; error?: string } {
  try {
    const groups = tokenizeCss(selector);

    if (groups.length === 0 || groups[0].length === 0) {
      return { xpath: '', error: 'Boş CSS seçicisi.' };
    }

    const xpath = groupToXPath(groups[0]);

    return { xpath };
  } catch (err) {
    return {
      xpath: '',
      error: `CSS parse hatası: ${(err as Error).message}`,
    };
  }
}
