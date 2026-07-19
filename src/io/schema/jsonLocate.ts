/**
 * JSON.parse error location and formatting.
 */
import type { JsonErrorLocation } from './types';

/** Extract a character offset from a JSON.parse SyntaxError message. */
export function extractJsonErrorOffset(message: string, sourceLength: number): number | null {
  const patterns = [/at position\s+(\d+)/i, /at offset\s+(\d+)/i, /column\s+(\d+)/i];
  for (const re of patterns) {
    const m = message.match(re);
    if (!m) continue;
    if (re.source.includes('column') && !/position|offset/i.test(message)) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 0) return Math.min(n, Math.max(0, sourceLength));
  }
  return null;
}

function offsetFromLineColumn(source: string, line: number, column: number): number {
  const lines = source.split(/\r?\n/);
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    if (i + 1 === line) {
      return offset + Math.max(0, Math.min(column - 1, lines[i].length));
    }
    offset += lines[i].length + 1;
  }
  return Math.max(0, source.length - 1);
}

/** Map a parse error + source string to line/column and a caret snippet. */
export function locateJsonError(source: string, err: unknown): JsonErrorLocation {
  const message = err instanceof Error ? err.message : String(err);
  const lines = source.split(/\r?\n/);

  let offset = extractJsonErrorOffset(message, source.length);
  const lc = message.match(/\(line\s+(\d+)\s+column\s+(\d+)\)/i);
  if (offset == null && lc) {
    offset = offsetFromLineColumn(source, Number(lc[1]), Number(lc[2]));
  }
  if (offset == null) {
    offset = Math.max(0, source.length - 1);
  }

  let line = 1;
  let column = 1;
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    const len = lines[i].length;
    const lineEnd = acc + len;
    if (offset <= lineEnd || i === lines.length - 1) {
      line = i + 1;
      column = Math.max(1, offset - acc + 1);
      break;
    }
    acc = lineEnd + 1;
  }

  const lineText = lines[line - 1] ?? '';
  const caretPad = Math.max(0, column - 1);
  const marker = `${' '.repeat(caretPad)}^`;
  const snippet = [`  ${line} | ${lineText}`, `  ${' '.repeat(String(line).length)} | ${marker}`].join('\n');

  return { offset, line, column, lineText, snippet };
}

/** Format a JSON.parse failure with line, column, reason, and a caret snippet. */
export function formatJsonParseError(source: string, err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const loc = locateJsonError(source, err);
  const reason = message
    .replace(/\s*in JSON at position \d+/i, '')
    .replace(/\s*\(line \d+ column \d+\)/i, '')
    .trim();
  return `JSON parse error at line ${loc.line}, column ${loc.column}: ${reason}\n` + loc.snippet;
}
