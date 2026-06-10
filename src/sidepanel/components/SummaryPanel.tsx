import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { DocumentSummary, ExtractedDocument } from '../lib/types';
import StatsBar from './StatsBar';
import SummaryCard from './SummaryCard';

interface SummaryPanelProps {
  document: ExtractedDocument;
  summary: DocumentSummary | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onAskMore: () => void;
}

export default function SummaryPanel({
  document,
  summary,
  isGenerating,
  error,
  onGenerate,
  onAskMore,
}: SummaryPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <StatsBar document={document} summary={summary} />

      {summary ? (
        <SummaryCard summary={summary} onAskMore={onAskMore} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center py-8 px-4"
        >
          <p className="text-sm text-text-secondary mb-1">No summary yet</p>
          <p className="text-xs text-text-muted mb-4 max-w-[240px]">
            Summaries use API quota. Generate one only when you need it, or ask
            questions in Chat — that also only runs when you send a message.
          </p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isGenerating ? 'Generating...' : 'Generate summary'}
          </button>
          {error && (
            <p className="text-xs text-red-400 mt-3 leading-relaxed max-w-[260px]">
              {error}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
