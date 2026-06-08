import { motion } from 'framer-motion';

interface TagListProps {
  topics: string[];
}

export default function TagList({ topics }: TagListProps) {
  if (!topics.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {topics.map((topic, i) => (
        <motion.span
          key={topic}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-accent/10 text-accent border border-accent/20 text-[10px] px-2 py-0.5 rounded"
        >
          {topic}
        </motion.span>
      ))}
    </div>
  );
}
