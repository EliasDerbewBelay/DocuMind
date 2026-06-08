import { motion } from 'framer-motion';
import { FileSearch, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  hasApiKey: boolean;
  isScanning: boolean;
  onOpenSettings: () => void;
  onRescan: () => void;
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
  onOpenSettings,
  onRescan,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center h-full px-6 text-center"
    >
      <motion.div variants={fadeUp}>
        <FileSearch size={64} className="text-text-muted mb-4 mx-auto" strokeWidth={1.5} />
      </motion.div>

      <motion.h2 variants={fadeUp} className="font-display text-xl text-text-primary mb-2">
        {isScanning ? 'Scanning page...' : 'No document detected'}
      </motion.h2>

      <motion.p variants={fadeUp} className="text-text-muted text-xs max-w-[260px] mb-6">
        {isScanning
          ? 'Reading text from the current tab. This may take a few seconds on Google Docs.'
          : hasApiKey
            ? 'Make sure a PDF, article, or Google Doc is open in this tab, then rescan.'
            : 'Navigate to a PDF, article, or Google Doc. You will also need an API key.'}
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-col gap-3 items-center">
        <button
          onClick={onRescan}
          disabled={isScanning}
          className="flex items-center gap-2 text-sm text-accent hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning...' : 'Rescan current tab'}
        </button>

        {!hasApiKey && (
          <button
            onClick={onOpenSettings}
            className="text-accent text-sm hover:text-white transition-colors"
          >
            Set API key to get started →
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
