import { motion } from 'framer-motion';

interface LoadingScreenProps {
  documentTitle?: string;
}

export default function LoadingScreen({ documentTitle }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full bg-brand-dark px-6"
    >
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-display text-sm font-medium mb-4">
        DM
      </div>

      {documentTitle && (
        <h2 className="font-display text-base text-text-primary text-center max-w-[80%] line-clamp-2 mb-6">
          {documentTitle}
        </h2>
      )}

      <div className="relative w-12 h-12 flex items-center justify-center mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-accent animate-pulse-ring" />
        <div className="w-3 h-3 rounded-full bg-accent" />
      </div>

      <p className="text-text-muted text-xs">Reading document...</p>
    </motion.div>
  );
}
