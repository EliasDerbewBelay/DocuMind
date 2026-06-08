const MAX_CHARS = 80000;

export function chunkDocument(text: string): string {
  if (text.length <= MAX_CHARS) return text;

  const halfMax = MAX_CHARS / 2;
  const beginning = text.slice(0, halfMax);
  const ending = text.slice(-halfMax);
  return `${beginning}\n\n[... middle section omitted for length ...]\n\n${ending}`;
}
