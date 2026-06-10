import type { DocumentType, ExtractedDocument } from './types';
import { extractPDFTextFromBuffer } from '../../shared/pdf-parser';
import { extractDocxText } from './docx-extractor';

export const MAX_FILE_SIZE = 20 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = new Set([
  '.pdf',
  '.txt',
  '.md',
  '.html',
  '.htm',
  '.docx',
]);

export class FileReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileReadError';
  }
}

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? '');
    reader.onerror = () => reject(new FileReadError('Failed to read file.'));
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new FileReadError('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function extractHTMLFromString(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const selectors = ['article', '[role="main"]', 'main', 'body'];
  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    if (el) {
      const text = (el as HTMLElement).innerText.trim();
      if (text.length > 100) return text;
    }
  }
  return doc.body?.innerText.trim() ?? '';
}

function resolveDocumentType(ext: string): DocumentType {
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'word';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.txt' || ext === '.md') return 'text';
  return 'unknown';
}

export function validateFile(file: File): void {
  const ext = getExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new FileReadError(
      `Unsupported file type "${ext || file.name}". Supported: PDF, TXT, MD, HTML, DOCX.`
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new FileReadError('File too large. Maximum size is 20 MB.');
  }
  if (file.size === 0) {
    throw new FileReadError('File is empty.');
  }
}

export async function readFileFromDisk(file: File): Promise<ExtractedDocument> {
  validateFile(file);

  const ext = getExtension(file.name);
  const type = resolveDocumentType(ext);
  let rawText = '';
  let pageCount: number | undefined;

  try {
    if (ext === '.pdf') {
      const buffer = await readAsArrayBuffer(file);
      const result = await extractPDFTextFromBuffer(buffer);
      rawText = result.text;
      pageCount = result.pageCount;
      if (!rawText.trim()) {
        throw new FileReadError(
          'This PDF has no extractable text. It may be a scanned image.'
        );
      }
    } else if (ext === '.docx') {
      const buffer = await readAsArrayBuffer(file);
      rawText = await extractDocxText(buffer);
      if (!rawText) {
        throw new FileReadError('Could not extract text from this Word document.');
      }
    } else if (ext === '.html' || ext === '.htm') {
      rawText = extractHTMLFromString(await readAsText(file));
    } else {
      rawText = (await readAsText(file)).trim();
    }
  } catch (err) {
    if (err instanceof FileReadError) throw err;
    if (ext === '.pdf') {
      throw new FileReadError('Failed to parse PDF. The file may be corrupted.');
    }
    if (ext === '.docx') {
      throw new FileReadError('Failed to parse DOCX. The file may be corrupted.');
    }
    throw new FileReadError('Failed to read file.');
  }

  if (!rawText || rawText.length < 100) {
    throw new FileReadError(
      'Not enough readable text in this file (minimum 100 characters).'
    );
  }

  const title = file.name.replace(/\.[^.]+$/, '') || file.name;
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  return {
    type,
    source: 'disk',
    title,
    url: `file://local/${encodeURIComponent(file.name)}`,
    rawText,
    pageCount,
    wordCount,
    language: 'en',
    extractedAt: Date.now(),
    fileName: file.name,
    fileSize: file.size,
  };
}
