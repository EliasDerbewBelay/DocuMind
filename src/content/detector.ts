import type { DocumentType } from '../sidepanel/lib/types';

export function detectDocumentType(): DocumentType {
  const url = window.location.href;
  const contentType = document.contentType;

  if (url.endsWith('.pdf') || contentType === 'application/pdf') return 'pdf';
  if (url.includes('docs.google.com/document')) return 'google-doc';
  if (url.endsWith('.docx') || url.includes('word')) return 'word';
  if (document.body) return 'html';
  return 'unknown';
}
