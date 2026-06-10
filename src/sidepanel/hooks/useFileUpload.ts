import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import type { ExtractedDocument } from '../lib/types';
import { readFileFromDisk, FileReadError } from '../lib/file-reader';

interface UseFileUploadOptions {
  onDocumentReady: (doc: ExtractedDocument) => void;
  onReadingStart?: (fileName: string) => void;
  onError?: (message: string) => void;
}

export function useFileUpload({
  onDocumentReady,
  onReadingStart,
  onError,
}: UseFileUploadOptions) {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsReading(true);
      setError(null);
      onReadingStart?.(file.name);

      try {
        const doc = await readFileFromDisk(file);
        onDocumentReady(doc);
      } catch (err) {
        const message =
          err instanceof FileReadError
            ? err.message
            : 'Failed to read file. Please try again.';
        setError(message);
        onError?.(message);
      } finally {
        setIsReading(false);
      }
    },
    [onDocumentReady, onReadingStart, onError]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isReading,
    error,
    fileInputRef,
    handleFile,
    openFilePicker,
    handleInputChange,
    handleDrop,
    handleDragOver,
    clearError,
  };
}
