import { useState, useEffect, useCallback } from 'react';
import type { ExtractedDocument } from '../lib/types';

export function useDocument() {
  const [document, setDocument] = useState<ExtractedDocument | null>(null);

  const handleDocumentReady = useCallback((doc: ExtractedDocument) => {
    setDocument(doc);
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_DOCUMENT' }, (res) => {
      if (res?.document) {
        setDocument(res.document);
      }
    });

    const listener = (msg: { type: string; payload: ExtractedDocument }) => {
      if (msg.type === 'DOCUMENT_READY') {
        setDocument(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return { document, setDocument, handleDocumentReady };
}
