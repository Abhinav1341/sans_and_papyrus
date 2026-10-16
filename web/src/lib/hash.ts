// FNV-1a (32-bit) over UTF-8 bytes. tools/voices/generate.py uses the same function, so a line's
// audio file name can be worked out from its voice and text alone.
export function fnv1a(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Splits a caption into the words that get highlighted while it is spoken. */
export function captionWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}
