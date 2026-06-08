import { useState } from 'react';
import type { ChatMessage, ExtractedDocument, AppSettings } from '../lib/types';
import { streamChat } from '../lib/claude';
import { chunkDocument } from '../lib/chunker';

export function useChat(document: ExtractedDocument | null, settings: AppSettings | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(userText: string) {
    if (!document || !settings?.apiKey || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const priorMessages = messages;
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    try {
      const chunked = chunkDocument(document.rawText);
      const stream = streamChat(
        settings.apiKey,
        chunked,
        document.title,
        priorMessages,
        userText
      );

      for await (const token of stream) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id ? { ...m, content: m.content + token } : m
          )
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Check settings.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsg.id ? { ...m, content: `**Error:** ${message}` } : m
        )
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsg.id ? { ...m, isStreaming: false } : m))
      );
      setIsLoading(false);
    }
  }

  return { messages, isLoading, sendMessage, setMessages };
}
