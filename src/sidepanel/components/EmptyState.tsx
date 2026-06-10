import { motion } from 'framer-motion';
import { FileSearch, RefreshCw, Settings } from 'lucide-react';
import FileDropZone from './FileDropZone';
import type { RefObject, ChangeEvent, DragEvent } from 'react';

interface EmptyStateProps {
  hasApiKey: boolean;
  isScanning: boolean;
  isReadingFile: boolean;
  fileError?: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onOpenSettings: () => void;
  onRescan: () => void;
  onOpenFilePicker: () => void;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (e: DragEvent) => void;
  onFileDragOver: (e: DragEvent) => void;
}

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function EmptyState({
  hasApiKey,
  isScanning,
  isReadingFile,
  fileError,
  fileInputRef,
  onOpenSettings,
  onRescan,
  onOpenFilePicker,
  onFileInputChange,
  onFileDrop,
  onFileDragOver,
}: EmptyStateProps) {
  const busy = isScanning || isReadingFile;

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-[10px] font-medium">
            DM
          </div>
          <span className="text-sm font-medium text-text-primary">DocuMind</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
          aria-label="Settings"
          title="Settings & API key"
        >
          <Settings size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center overflow-y-auto py-6">
        <motion.div variants={fadeUp}>
          <FileSearch size={64} className="text-text-muted mb-4 mx-auto" strokeWidth={1.5} />
        </motion.div>

        <motion.h2 variants={fadeUp} className="font-display text-xl text-text-primary mb-2">
          {busy ? 'Reading...' : 'No document detected'}
        </motion.h2>

        <motion.p variants={fadeUp} className="text-text-muted text-xs max-w-[260px] mb-6">
          {isReadingFile
            ? 'Parsing your file. This may take a few seconds for large PDFs.'
            : isScanning
              ? 'Reading text from the current tab. This may take a few seconds on Google Docs.'
              : hasApiKey
                ? 'Open a file from your computer, or scan the current browser tab.'
                : 'Open a file or navigate to a document, then add your API key in Settings.'}
        </motion.p>

        <motion.div variants={fadeUp} className="mb-6">
          <FileDropZone
            fileInputRef={fileInputRef}
            onInputChange={onFileInputChange}
            onOpenPicker={onOpenFilePicker}
            onDrop={onFileDrop}
            onDragOver={onFileDragOver}
            disabled={busy}
            error={fileError}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-3 items-center">
          <button
            onClick={onRescan}
            disabled={busy}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Scanning tab...' : 'Rescan current tab'}
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-sm text-accent hover:text-white transition-colors"
          >
            <Settings size={14} />
            {hasApiKey ? 'Change API key in Settings' : 'Set API key in Settings →'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
