import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');

export async function extractPDFText(
  url: string
): Promise<{ text: string; pageCount: number }> {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const pageCount = pdf.numPages;
  const textPages: string[] = [];

  for (let i = 1; i <= Math.min(pageCount, 50); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textPages.push(pageText);
  }

  return { text: textPages.join('\n\n'), pageCount };
}
