import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const MAX_PAGES = 50;

let workerInitialized = false;

function initWorker(): void {
  if (!workerInitialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      chrome.runtime.getURL('pdf.worker.min.js');
    workerInitialized = true;
  }
}

async function extractPages(
  pdf: PDFDocumentProxy
): Promise<{ text: string; pageCount: number }> {
  const pageCount = pdf.numPages;
  const textPages: string[] = [];

  for (let i = 1; i <= Math.min(pageCount, MAX_PAGES); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textPages.push(pageText);
  }

  return { text: textPages.join('\n\n'), pageCount };
}

async function fetchFileAsBuffer(url: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);
    if (response.ok) return response.arrayBuffer();
  } catch {
    // Content-script fetch may fail on file:// — try service worker
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'FETCH_FILE_BUFFER', url }, (response) => {
      if (chrome.runtime.lastError || !response?.buffer) {
        reject(
          new Error(
            'Could not read this local PDF. Use "Open file from computer" in the DocuMind panel, or enable "Allow access to file URLs" for this extension.'
          )
        );
        return;
      }
      resolve(response.buffer as ArrayBuffer);
    });
  });
}

function isLocalFileUrl(url: string): boolean {
  return url.startsWith('file://');
}

export async function extractPDFTextFromUrl(
  url: string
): Promise<{ text: string; pageCount: number }> {
  initWorker();

  if (isLocalFileUrl(url)) {
    const buffer = await fetchFileAsBuffer(url);
    return extractPDFTextFromBuffer(buffer);
  }

  const pdf = await pdfjsLib.getDocument(url).promise;
  return extractPages(pdf);
}

export async function extractPDFTextFromBuffer(
  buffer: ArrayBuffer
): Promise<{ text: string; pageCount: number }> {
  initWorker();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  return extractPages(pdf);
}
