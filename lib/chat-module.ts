import { ChatCompletionMessage, generateAIText } from './api';
import { extractPlainText } from './blog-editor';
import { WritingTone } from './ui';

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export function createCoachMessage(role: 'user' | 'assistant', content: string): CoachMessage {
  const now = Date.now();
  return {
    id: `${role === 'user' ? 'u' : 'a'}-${now}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    createdAt: now,
  };
}

export async function sendCoachMessage(params: {
  history: CoachMessage[];
  userMessage: string;
  draftTitle: string;
  draftHtml: string;
  tone: WritingTone;
  wordCount: number;
}): Promise<string> {
  const draftText = extractPlainText(params.draftHtml).slice(0, 3500);

  const systemInstruction = [
    'You are a concise, practical writing coach inside Ghost Bloggr.',
    `Active writing tone: ${params.tone}. Current word count: ${params.wordCount}.`,
    `Current headline: ${params.draftTitle.trim() || '(Untitled draft)'}.`,
    draftText
      ? `Current draft excerpt:\n"""\n${draftText}\n"""`
      : 'The draft is currently empty.',
    'Give concrete, actionable editorial feedback or draft text the writer can paste straight into their post. Keep answers focused and clear without fluff.',
  ].join('\n\n');

  const recentHistory: ChatCompletionMessage[] = params.history
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  return generateAIText({
    systemInstruction,
    messages: [...recentHistory, { role: 'user', content: params.userMessage }],
  });
}
