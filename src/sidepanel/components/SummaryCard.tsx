import { motion } from 'framer-motion';
import type { DocumentSummary } from '../lib/types';
import TagList from './TagList';

interface SummaryCardProps {
  summary: DocumentSummary;
  onAskMore: () => void;
}

const container = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const item = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export default function SummaryCard({ summary, onAskMore }: SummaryCardProps) {
  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      <motion.div variants={item}>
        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">
          {summary.documentType}
        </p>
        <blockquote className="font-display italic text-sm text-text-secondary leading-relaxed">
          "{summary.tldr}"
        </blockquote>
      </motion.div>

      <motion.div variants={item}>
        <h3 className="text-xs text-text-muted mb-2">Key highlights</h3>
        <ul className="space-y-1.5">
          {summary.keyHighlights.map((highlight) => (
            <li key={highlight} className="flex gap-2 text-xs text-text-primary">
              <span className="text-accent flex-shrink-0">•</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div variants={item}>
        <TagList topics={summary.topics} />
      </motion.div>

      <motion.button
        variants={item}
        onClick={onAskMore}
        className="text-accent text-sm hover:text-white transition-colors"
      >
        Ask questions →
      </motion.button>
    </motion.div>
  );
}
