import { extractPDFTextFromUrl } from '../shared/pdf-parser';

export async function extractPDFText(
  url: string
): Promise<{ text: string; pageCount: number }> {
  return extractPDFTextFromUrl(url);
}
