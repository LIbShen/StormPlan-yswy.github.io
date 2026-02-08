import { AI_SYSTEM_INSTRUCTION } from '../constants';

const getBaseUrl = () => {
  const raw =
    (import.meta.env.VITE_NVIDIA_BASE_URL as string | undefined) || 'https://integrate.api.nvidia.com';
  return raw.replace(/\/+$/, '');
};

const getModel = () => {
  return (import.meta.env.VITE_NVIDIA_MODEL as string | undefined) || 'minimaxai/minimax-m2.1';
};

const getApiKey = () => {
  return (import.meta.env.VITE_NVIDIA_API_KEY as string | undefined) || '';
};

const baseUrlEnv = (import.meta.env.VITE_NVIDIA_BASE_URL as string | undefined) || '';
const useProxy = import.meta.env.DEV && (!baseUrlEnv || /integrate\.api\.nvidia\.com/i.test(baseUrlEnv));

const makeUrl = (path: string) => {
  if (useProxy) return `/nvidia${path}`;
  return `${getBaseUrl()}${path}`;
};

export const getAiRuntimeConfig = () => {
  const baseUrl = getBaseUrl();
  const model = getModel();
  return { baseUrl, model, useProxy };
};

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = useProxy ? getApiKey().trim() : '';
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(id);
  }
};

const postJson = async <T,>(path: string, body: unknown): Promise<T> => {
  const res = await fetchWithTimeout(
    makeUrl(path),
    {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
    },
    15000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }

  return (await res.json()) as T;
};

const sanitizeForKids = (text: string) => {
  let t = text;
  t = t.replace(/```(?:json)?/gi, '').replace(/```/g, '');
  t = t.replace(/^\s*#{1,6}\s+/gm, '');
  t = t.replace(/^\s*>\s?/gm, '');
  t = t.replace(/^\s*[-*+]\s+/gm, '');
  t = t.replace(/^\s*\d+\.\s+/gm, '');
  t = t.replace(/[*_~]/g, '');
  t = t.replace(/[\u200D\uFE0F]/g, '');
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  t = t.replace(/[★☆◆■▲▼▶◀●◎◇○□※]/g, '');
  t = t.replace(/[!?！？]{2,}/g, '！');
  t = t.replace(/[。．\.]{3,}/g, '。');
  t = t.replace(/[，,]{2,}/g, '，');
  t = t.replace(/[~～]{2,}/g, '～');
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.replace(/[ \t]{2,}/g, ' ');
  return t.trim();
};

const normalizeModelText = (text: string) => {
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/think>/gi, '');
  return sanitizeForKids(withoutThink);
};

export interface ChatSession {
  sendMessage: (args: { message: string }) => Promise<{ text: string }>;
}

export const createChatSession = (): ChatSession => {
  const model = getModel();
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: AI_SYSTEM_INSTRUCTION },
  ];

  return {
    sendMessage: async ({ message }) => {
      messages.push({ role: 'user', content: message });

      const data = await postJson<{
        choices?: Array<{ message?: { content?: string } }>;
      }>('/v1/chat/completions', {
        model,
        messages,
      });

      const text = normalizeModelText(data.choices?.[0]?.message?.content || '');
      if (!text) throw new Error('Empty response');

      messages.push({ role: 'assistant', content: text });
      return { text };
    },
  };
};

export interface PoemOriginal {
  title: string;
  author: string;
  lines: string[];
}

const extractJsonObject = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
};

export const generatePoemOriginal = async (title: string, contextHint?: string): Promise<PoemOriginal> => {
  const model = getModel();
  const data = await postJson<{
    choices?: Array<{ message?: { content?: string } }>;
  }>('/v1/chat/completions', {
    model,
    messages: [
      {
        role: 'system',
        content: '你是一个严谨的古诗文本输出器。你只输出 JSON，不输出任何解释或多余文本。',
      },
      {
        role: 'user',
        content: `请输出古诗《${title}》的“原文”和“作者”，不要解释，不要翻译。
如果《${title}》在小学语文（部编版）课文中存在常用版本，请优先输出课本常用版本。
如果标题包含“（其一/其二/节选）”等字样，请按标题要求输出对应版本（节选就只输出节选部分）。
${contextHint ? `补充线索：${contextHint}` : ''}
用严格 JSON 返回，格式如下：
{"title":"...","author":"...","lines":["...","..."]}
要求：lines 为按行分割的原文，不要空行，不要编号，不要额外字段。`,
      },
    ],
  });

  const text = normalizeModelText(data.choices?.[0]?.message?.content || '');
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    throw new Error("Invalid response format");
  }

  const parsed = JSON.parse(jsonText) as PoemOriginal;

  if (!parsed?.title || !parsed?.author || !Array.isArray(parsed?.lines)) {
    throw new Error("Invalid poem json");
  }

  const lines = parsed.lines.map(l => String(l).trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Empty poem lines");

  return {
    title: String(parsed.title).trim(),
    author: String(parsed.author).trim(),
    lines,
  };
};
