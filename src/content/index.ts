import { detectDocumentType } from './detector';
import { extractHTMLText } from './extractor';
import { extractGoogleDocText } from './google-doc-extractor';
import type { DocumentType } from '../sidepanel/lib/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function extractDocumentText(
  type: DocumentType
): Promise<{ rawText: string; pageCount?: number }> {
  if (type === 'pdf') {
    try {
      const { extractPDFText } = await import('./pdf-extractor');
      const result = await extractPDFText(window.location.href);
      return { rawText: result.text, pageCount: result.pageCount };
    } catch (err) {
      console.warn('DocuMind: PDF extraction failed', err);
      return { rawText: '' };
    }
  }

  if (type === 'google-doc') {
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const text = extractGoogleDocText();
      if (text.length >= 100) return { rawText: text };
      await sleep(500);
    }
    const fallback = extractHTMLText();
    return { rawText: fallback };
  }

  return { rawText: extractHTMLText() };
}

function getDocumentTitle(): string {
  if (window.location.protocol === 'file:') {
    const path = decodeURIComponent(window.location.pathname);
    const fileName = path.split(/[/\\]/).pop() || '';
    return fileName.replace(/\.[^.]+$/, '') || fileName || 'Untitled Document';
  }
  return (
    document.querySelector('.docs-title-input')?.textContent?.trim() ||
    document.title.replace(/ - Google Docs$/, '').trim() ||
    'Untitled Document'
  );
}

async function extractAndSend() {
  const type = detectDocumentType();
  if (type === 'unknown') return null;

  const { rawText, pageCount } = await extractDocumentText(type);
  if (!rawText || rawText.length < 100) return null;

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const title = getDocumentTitle();

  const payload = {
    type,
    source: 'tab' as const,
    title,
    url: window.location.href,
    rawText,
    pageCount,
    wordCount,
    language: document.documentElement.lang || 'en',
    extractedAt: Date.now(),
  };

  chrome.runtime.sendMessage({ type: 'DOCUMENT_EXTRACTED', payload });
  return payload;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REQUEST_EXTRACTION') {
    extractAndSend().then((payload) => sendResponse({ payload }));
    return true;
  }
});

const win = window as Window & { __documindLoaded?: boolean };
if (!win.__documindLoaded) {
  win.__documindLoaded = true;
  extractAndSend();
}
