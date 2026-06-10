import { useState, type RefObject, type ChangeEvent, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

const ACCEPT = '.pdf,.txt,.md,.html,.htm,.docx';

interface FileDropZoneProps {
  fileInputRef: RefObject<HTMLInputElement>;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
  onDrop: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  disabled?: boolean;
  error?: string | null;
  compact?: boolean;
}

export default function FileDropZone({
  fileInputRef,
  onInputChange,
  onOpenPicker,
  onDrop,
  onDragOver,
  disabled,
  error,
  compact,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    setIsDragging(false);
    onDrop(e);
  };

  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          className="hidden"
        />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[280px]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={onInputChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={onDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border border-dashed p-4 transition-colors ${
          isDragging
            ? 'border-accent/40 bg-accent/5'
            : 'border-white/[0.12] bg-white/[0.02]'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload size={20} className="text-text-muted mx-auto mb-2" />
        <p className="text-xs text-text-muted mb-3">
          Drag a file here, or
        </p>
        <button
          onClick={onOpenPicker}
          disabled={disabled}
          className="w-full py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          Open file from computer
        </button>
        <p className="text-[10px] text-text-muted mt-2">
          PDF, TXT, MD, HTML, DOCX · max 20 MB
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2 leading-relaxed">{error}</p>
      )}
    </motion.div>
  );
}
