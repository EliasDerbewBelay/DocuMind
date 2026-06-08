import type { ChatMessage } from './types';

const BASE_URL = 'https://api.anthropic.com/v1/messages';

function getHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    // Required when calling the API from a browser / Chrome extension
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    const msg: string | undefined = data?.error?.message ?? data?.message;
    if (msg) {
      if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('balance')) {
        return 'No credits on your Anthropic account. Go to console.anthropic.com → Billing → Add funds.';
      }
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('authentication')) {
        return 'Invalid API key. Copy the full key from console.anthropic.com → API keys.';
      }
      return msg;
    }
  } catch {
    // response body wasn't JSON
  }

  if (response.status === 401) {
    return 'Invalid API key. Copy the full key from console.anthropic.com → API keys.';
  }
  if (response.status === 402 || response.status === 403) {
    return 'Access denied. Add credits at console.anthropic.com → Billing (your balance is $0.00).';
  }
  if (response.status === 429) {
    return 'Rate limit reached. Wait a moment and try again.';
  }
  return `Claude API error (${response.status})`;
}

export async function validateApiKey(
  apiKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Say OK' }],
    }),
  });

  if (response.ok) return { ok: true };
  return { ok: false, error: await parseApiError(response) };
}

function buildSystemPrompt(documentText: string, documentTitle: string): string {
  const truncated = documentText.slice(0, 80000);
  return `You are DocuMind, an expert AI assistant helping users understand documents.

You have been given the full text of a document titled: "${documentTitle}"

DOCUMENT CONTENT:
---
${truncated}
---

RULES:
1. Answer ONLY based on the document above. Do not use outside knowledge.
2. When referencing specific information, cite it clearly with a brief excerpt from the document.
3. If something is not in the document, say so honestly.
4. Be concise and clear. Use plain language.
5. Format responses with markdown when helpful (bullet points, bold key terms).
6. If the user asks in Amharic, respond in Amharic.
7. When citing sources, include the relevant quote in your response.`;
}

export async function generateSummary(
  apiKey: string,
  documentText: string,
  documentTitle: string
): Promise<string> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: buildSystemPrompt(documentText, documentTitle),
      messages: [
        {
          role: 'user',
          content: `Analyze this document and respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "tldr": "2-3 sentence plain-English summary of the document",
  "topics": ["topic1", "topic2", "topic3"],
  "documentType": "Research paper",
  "readingTimeMinutes": 12,
  "keyHighlights": [
    "First important finding or point",
    "Second important point",
    "Third important point"
  ]
}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.content[0].text;
}

export async function* streamChat(
  apiKey: string,
  documentText: string,
  documentTitle: string,
  messages: ChatMessage[],
  userMessage: string
): AsyncGenerator<string> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      stream: true,
      system: buildSystemPrompt(documentText, documentTitle),
      messages: [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          yield parsed.delta.text;
        }
      } catch {
        // skip malformed SSE chunks
      }
    }
  }
}
