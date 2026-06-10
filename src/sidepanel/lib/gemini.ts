import type { ChatMessage } from './types';

const MODEL = 'gemini-2.0-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const RATE_LIMIT_MESSAGE =
  'Gemini rate limit reached. Please wait a moment and try again.';

const MAX_ATTEMPTS = 4;
const INITIAL_BACKOFF_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(stream = false): string {
  const action = stream ? 'streamGenerateContent' : 'generateContent';
  const params = stream ? '?alt=sse' : '';
  return `${BASE}/${MODEL}:${action}${params}`;
}

function getHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
}

function isRateLimited(status: number, message?: string): boolean {
  if (status === 429) return true;
  const lower = message?.toLowerCase() ?? '';
  return (
    lower.includes('resource exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota')
  );
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let delay = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, init);

    if (response.status !== 429) {
      return response;
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(delay);
      delay *= 2;
      continue;
    }

    throw new Error(RATE_LIMIT_MESSAGE);
  }

  throw new Error(RATE_LIMIT_MESSAGE);
}

async function parseApiError(response: Response): Promise<string> {
  let message: string | undefined;

  try {
    const data = await response.json();
    message = data?.error?.message ?? data?.message ?? data?.[0]?.error?.message;
    if (message) {
      if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('apikey')) {
        return 'Invalid Gemini API key. Get one free at aistudio.google.com/apikey';
      }
      if (isRateLimited(response.status, message)) {
        return RATE_LIMIT_MESSAGE;
      }
      return message;
    }
  } catch {
    // response body wasn't JSON
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
    return 'Invalid Gemini API key. Get one free at aistudio.google.com/apikey';
  }
  if (response.status === 429) {
    return RATE_LIMIT_MESSAGE;
  }
  return `Gemini API error (${response.status})`;
}

async function geminiRequest(url: string, apiKey: string, body: object): Promise<Response> {
  return fetchWithRetry(url, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify(body),
  });
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

function extractText(data: GeminiResponse): string {
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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

function toGeminiRole(role: 'user' | 'assistant'): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

export function isValidGeminiKey(key: string): boolean {
  return key.startsWith('AIza') || key.startsWith('AQ.');
}

export async function validateApiKey(
  apiKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await geminiRequest(buildUrl(), apiKey, {
      contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: OK' }] }],
      generationConfig: { maxOutputTokens: 16 },
    });

    if (response.ok) return { ok: true };
    return { ok: false, error: await parseApiError(response) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : RATE_LIMIT_MESSAGE,
    };
  }
}

export async function generateSummary(
  apiKey: string,
  documentText: string,
  documentTitle: string
): Promise<string> {
  const response = await geminiRequest(buildUrl(), apiKey, {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(documentText, documentTitle) }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze this document and respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
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
      },
    ],
    generationConfig: { maxOutputTokens: 800 },
  });

  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return extractText(data);
}

export async function* streamChat(
  apiKey: string,
  documentText: string,
  documentTitle: string,
  messages: ChatMessage[],
  userMessage: string
): AsyncGenerator<string> {
  const history = [
    ...messages.map((m) => ({
      role: toGeminiRole(m.role),
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const response = await geminiRequest(buildUrl(true), apiKey, {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(documentText, documentTitle) }],
    },
    contents: history,
    generationConfig: { maxOutputTokens: 1000 },
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emittedLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '');
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const text = extractText(parsed);
        if (text.length > emittedLength) {
          yield text.slice(emittedLength);
          emittedLength = text.length;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}
