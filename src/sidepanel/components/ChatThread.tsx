import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage, ExtractedDocument } from '../lib/types';
import ChatMessageComponent from './ChatMessage';

interface ChatThreadProps {
  messages: ChatMessage[];
  document: ExtractedDocument;
  onExampleClick?: (question: string) => void;
}

function getExampleQuestions(document: ExtractedDocument): string[] {
  switch (document.type) {
    case 'pdf':
      return [
        'What is the main argument?',
        'Summarize the methodology',
        'What are the conclusions?',
      ];
    case 'google-doc':
    case 'word':
      return [
        'What are the key obligations?',
        'Are there any deadlines?',
        'Summarize the main points',
      ];
    case 'html':
    default:
      return [
        'What is this article about?',
        "What is the author's main point?",
        'What are the key takeaways?',
      ];
  }
}

export default function ChatThread({
  messages,
  document,
  onExampleClick,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const examples = getExampleQuestions(document);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-text-muted text-sm mb-4 text-center"
        >
          Ask anything about this document
        </motion.p>
        <div className="flex flex-wrap gap-2 justify-center">
          {examples.map((q, i) => (
            <motion.button
              key={q}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onExampleClick?.(q)}
              className="text-xs px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-text-secondary hover:text-white hover:border-accent/30 transition-colors"
            >
              {q}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      {messages.map((msg) => (
        <ChatMessageComponent key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
