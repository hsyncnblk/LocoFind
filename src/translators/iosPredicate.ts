interface PredicateToken {
  type: 'attribute' | 'operator' | 'value' | 'logical' | 'paren' | 'not';
  value: string;
}

const ATTRIBUTE_MAP: Record<string, string> = {
  type: '@type',
  name: '@name',
  label: '@label',
  value: '@value',
  identifier: '@identifier',
  enabled: '@enabled',
  visible: '@visible',
  accessible: '@accessible',
  'rect.x': '@x',
  'rect.y': '@y',
  'rect.width': '@width',
  'rect.height': '@height',
};

const COMPARISON_OPERATORS = ['==', '!=', '<', '>', '<=', '>='];
const STRING_OPERATORS = ['CONTAINS', 'BEGINSWITH', 'ENDSWITH', 'MATCHES', 'LIKE'];

function tokenize(predicate: string): PredicateToken[] {
  const tokens: PredicateToken[] = [];
  let i = 0;
  const s = predicate.trim();

  while (i < s.length) {
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }

    if (s[i] === '(' || s[i] === ')') {
      tokens.push({ type: 'paren', value: s[i] });
      i++;
      continue;
    }

    if (s[i] === "'" || s[i] === '"') {
      const quote = s[i];
      let val = '';
      i++;
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\') {
          i++;
          val += s[i] || '';
        } else {
          val += s[i];
        }
        i++;
      }
      i++;
      tokens.push({ type: 'value', value: val });
      continue;
    }

    if (i + 1 < s.length && COMPARISON_OPERATORS.includes(s.substring(i, i + 2))) {
      tokens.push({ type: 'operator', value: s.substring(i, i + 2) });
      i += 2;
      continue;
    }
    if (s[i] === '<' || s[i] === '>') {
      tokens.push({ type: 'operator', value: s[i] });
      i++;
      continue;
    }

    let word = '';
    while (i < s.length && /[a-zA-Z0-9_.]/.test(s[i])) {
      word += s[i];
      i++;
    }

    if (word) {
      const upper = word.toUpperCase();
      if (upper === 'AND' || upper === 'OR') {
        tokens.push({ type: 'logical', value: upper });
      } else if (upper === 'NOT') {
        tokens.push({ type: 'not', value: 'NOT' });
      } else if (STRING_OPERATORS.includes(upper)) {
        tokens.push({ type: 'operator', value: upper });
      } else if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'value', value: upper.toLowerCase() });
      } else {
        tokens.push({ type: 'attribute', value: word.toLowerCase() });
      }
      continue;
    }

    i++;
  }

  return tokens;
}

function conditionToXPath(attribute: string, operator: string, value: string): string {
  const attr = ATTRIBUTE_MAP[attribute] || `@${attribute}`;

  switch (operator.toUpperCase()) {
    case '==':
      return `${attr}='${value}'`;
    case '!=':
      return `${attr}!='${value}'`;
    case 'CONTAINS':
      return `contains(${attr}, '${value}')`;
    case 'BEGINSWITH':
      return `starts-with(${attr}, '${value}')`;
    case 'ENDSWITH':
      return `substring(${attr}, string-length(${attr}) - string-length('${value}') + 1) = '${value}'`;
    case 'MATCHES':
    case 'LIKE':
      return `contains(${attr}, '${value}')`;
    case '<':
      return `${attr} < '${value}'`;
    case '>':
      return `${attr} > '${value}'`;
    case '<=':
      return `${attr} <= '${value}'`;
    case '>=':
      return `${attr} >= '${value}'`;
    default:
      return `${attr}='${value}'`;
  }
}

export function predicateToXPath(predicate: string): { xpath: string; error?: string } {
  try {
    const tokens = tokenize(predicate);
    if (tokens.length === 0) {
      return { xpath: '', error: 'Boş predicate ifadesi.' };
    }

    const parts: string[] = [];
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'logical') {
        parts.push(token.value === 'AND' ? ' and ' : ' or ');
        i++;
        continue;
      }

      if (token.type === 'not') {
        parts.push('not(');
        i++;
        if (i < tokens.length && tokens[i].type === 'attribute') {
          const attr = tokens[i].value;
          i++;
          const op = i < tokens.length ? tokens[i].value : '==';
          i++;
          const val = i < tokens.length ? tokens[i].value : '';
          i++;
          parts.push(conditionToXPath(attr, op, val) + ')');
        }
        continue;
      }

      if (token.type === 'paren') {
        parts.push(token.value === '(' ? '(' : ')');
        i++;
        continue;
      }

      if (token.type === 'attribute') {
        const attr = token.value;
        i++;
        if (i < tokens.length && tokens[i].type === 'operator') {
          const op = tokens[i].value;
          i++;
          if (i < tokens.length && tokens[i].type === 'value') {
            const val = tokens[i].value;
            i++;
            parts.push(conditionToXPath(attr, op, val));
            continue;
          }
        }
        const mappedAttr = ATTRIBUTE_MAP[attr] || `@${attr}`;
        parts.push(mappedAttr);
        continue;
      }

      i++;
    }

    const predicateExpr = parts.join('');
    const xpath = `//*[${predicateExpr}]`;

    return { xpath };
  } catch (err) {
    return {
      xpath: '',
      error: `Predicate parse hatası: ${(err as Error).message}`,
    };
  }
}
