import { useState, useCallback } from 'react';
import type { DocumentSummary, ExtractedDocument } from '../lib/types';
import { generateSummary } from '../lib/gemini';
import { chunkDocument } from '../lib/chunker';

export function useSummary() {
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (doc: ExtractedDocument, apiKey: string) => {
      setIsLoading(true);
      setError(null);
      setSummary(null);

      try {
        const chunked = chunkDocument(doc.rawText);
        const rawJson = await generateSummary(apiKey, chunked, doc.title);
        const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim()) as DocumentSummary;
        setSummary(parsed);
        return parsed;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Summary failed';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return { summary, isLoading, error, generate, reset, setSummary };
}
