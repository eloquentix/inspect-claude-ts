export interface FrontmatterResult {
  meta: Record<string, string>;
  body: string;
}

/**
 * Extracts YAML frontmatter key-value pairs and the body content after
 * the closing "---" delimiter. If no frontmatter is found, meta is empty
 * and body contains the entire input.
 */
export function parseFull(text: string): FrontmatterResult {
  const lines = text.split('\n');
  const meta: Record<string, string> = {};

  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { meta, body: text.trim() };
  }

  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      i++;
      break;
    }
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      // Strip surrounding quotes
      if (val.length >= 2 && (val[0] === '"' || val[0] === "'") && val[val.length - 1] === val[0]) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }

  const body = lines.slice(i).join('\n').trim();
  return { meta, body };
}

/**
 * Extracts YAML frontmatter key-value pairs from text.
 */
export function parse(text: string): Record<string, string> {
  return parseFull(text).meta;
}
