import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
]);

const MAX_MESSAGES = 30;
const MAX_TEXT_CHARS = 48_000;

interface RequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Built-in Gemini API key is not configured on the server. Add GEMINI_API_KEY in Secrets or configure a BYOK provider in Settings.',
        },
        { status: 503 }
      );
    }

    let body: {
      messages?: unknown;
      systemInstruction?: unknown;
      model?: unknown;
    };
    try {
      body = (await req.json()) as {
        messages?: unknown;
        systemInstruction?: unknown;
        model?: unknown;
      };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const messages = Array.isArray(body?.messages)
      ? (body.messages.slice(0, MAX_MESSAGES) as RequestMessage[])
      : [];
    const systemInstruction =
      typeof body?.systemInstruction === 'string'
        ? body.systemInstruction.slice(0, MAX_TEXT_CHARS)
        : undefined;
    const requestedModel = typeof body?.model === 'string' ? body.model.trim() : '';
    const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : 'gemini-4-hydrogen';

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Prompt messages are required.' }, { status: 400 });
    }

    const totalChars = messages.reduce(
      (sum, m) => sum + (typeof m?.content === 'string' ? m.content.length : 0),
      0
    );
    if (totalChars > MAX_TEXT_CHARS * 2) {
      return NextResponse.json({ error: 'Prompt payload exceeds the maximum allowed size.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemParts: string[] = [];
    if (systemInstruction) {
      systemParts.push(systemInstruction);
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of messages) {
      if (!msg || typeof msg.content !== 'string') continue;
      if (msg.role === 'system') {
        systemParts.push(msg.content);
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'At least one user message is required.' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: systemParts.length > 0 ? { systemInstruction: systemParts.join('\n\n') } : undefined,
    });

    const text = response.text ?? '';
    return NextResponse.json({ text, model });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate AI response.';
    const status =
      message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')
        ? 401
        : message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
