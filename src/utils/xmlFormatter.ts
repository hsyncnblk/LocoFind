export function formatXmlOneLine(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  let result = '';
  let i = 0;
  let depth = 0;

  while (i < trimmed.length) {
    if (trimmed[i] === '<') {
      const end = trimmed.indexOf('>', i);
      if (end === -1) {
        result += trimmed.substring(i);
        break;
      }

      const tag = trimmed.substring(i, end + 1);
      const isClosing = tag.startsWith('</');
      const isSelfClosing = tag.endsWith('/>');
      const isDeclaration = tag.startsWith('<?') || tag.startsWith('<!');

      if (isClosing) depth = Math.max(0, depth - 1);

      const indent = '  '.repeat(depth);

      if (result.length > 0 && !result.endsWith('\n')) {
        result += '\n';
      }
      result += indent + tag;

      if (!isClosing && !isSelfClosing && !isDeclaration) {
        depth++;
      }

      i = end + 1;
    } else {
      const nextTag = trimmed.indexOf('<', i);
      const text = nextTag === -1
        ? trimmed.substring(i).trim()
        : trimmed.substring(i, nextTag).trim();

      if (text) {
        const indent = '  '.repeat(depth);
        if (result.length > 0 && !result.endsWith('\n')) {
          result += '\n';
        }
        result += indent + text;
      }

      i = nextTag === -1 ? trimmed.length : nextTag;
    }
  }

  return result;
}
