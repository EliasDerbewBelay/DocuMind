import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}
    >
      <div
        className={`max-w-[90%] px-3 py-2 text-sm ${
          isUser
            ? 'bg-accent/20 border border-accent/20 text-white rounded-lg rounded-br-sm'
            : 'bg-white/[0.04] border border-white/[0.06] text-text-primary rounded-lg rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle animate-blink" />
            )}
          </div>
        )}
      </div>

      {!isUser && message.citation && (
        <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] border border-white/[0.04] rounded text-[10px] text-text-muted max-w-[90%]">
          <FileText size={10} />
          {message.citation.pageNumber ? (
            <span>Page {message.citation.pageNumber}</span>
          ) : (
            <span>Source found</span>
          )}
          {message.citation.excerpt && (
            <span className="truncate italic">— "{message.citation.excerpt}"</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
