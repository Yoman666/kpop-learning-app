export type LyricToken =
  | { kind: "word"; text: string }
  | { kind: "text"; text: string };

const TOKEN_RE = /(\s+)|([\uAC00-\uD7A3]+)|([^\s\uAC00-\uD7A3]+)/g;

/** Split a lyric line into clickable Korean/English tokens and plain separators. */
export function tokenizeKoreanLine(line: string): LyricToken[] {
  const tokens: LyricToken[] = [];
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(line)) !== null) {
    const chunk = match[0];
    if (!chunk) continue;
    if (/^\s+$/.test(chunk)) {
      tokens.push({ kind: "text", text: chunk });
      continue;
    }
    if (/^[\uAC00-\uD7A3]+$/.test(chunk)) {
      tokens.push({ kind: "word", text: chunk });
      continue;
    }
    if (/[\uAC00-\uD7A3]/.test(chunk)) {
      const parts = chunk.split(/([\uAC00-\uD7A3]+)/).filter(Boolean);
      for (const part of parts) {
        if (/^[\uAC00-\uD7A3]+$/.test(part)) {
          tokens.push({ kind: "word", text: part });
        } else {
          tokens.push({ kind: "text", text: part });
        }
      }
      continue;
    }
    tokens.push({ kind: "word", text: chunk });
  }
  return tokens;
}
