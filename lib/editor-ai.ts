import { generateAIText } from './api';
import { extractPlainText } from './blog-editor';
import { WritingTone } from './ui';

export interface IdeaSuggestion {
  title: string;
  angle: string;
}

const ANTI_CLICHE_RULE =
  'Write in crisp, direct English. Avoid corporate buzzwords, filler openers, and clichés like "delve", "unleash", "seamless", "tapestry", "revolutionize", "in today\'s fast-paced world", or "game-changing".';

export async function generateBlogIdeas(topic: string, tone: WritingTone): Promise<IdeaSuggestion[]> {
  const prompt = topic.trim()
    ? `Suggest 5 specific blog post ideas about "${topic.trim()}" suited for a ${tone} voice.`
    : `Suggest 5 fresh, practical blog post ideas about software engineering, writing, or independent product building suited for a ${tone} voice.`;

  const raw = await generateAIText({
    systemInstruction: `You are an editorial strategist. ${ANTI_CLICHE_RULE} Return ONLY a numbered list of 5 ideas. Format each line strictly as: "1. Title — One-sentence angle".`,
    messages: [{ role: 'user', content: prompt }],
  });

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: IdeaSuggestion[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^\d+[.)]\s*/, '').trim();
    if (!cleaned) continue;
    const sepMatch = cleaned.match(/^(.+?)\s+[—\-–:]\s+(.+)$/);
    if (sepMatch) {
      parsed.push({ title: sepMatch[1].replace(/^["'*]+|["'*]+$/g, '').trim(), angle: sepMatch[2].trim() });
    } else {
      parsed.push({ title: cleaned.replace(/^["'*]+|["'*]+$/g, '').trim(), angle: '' });
    }
    if (parsed.length >= 5) break;
  }

  return parsed.length > 0 ? parsed : [{ title: raw.slice(0, 100), angle: '' }];
}

export async function suggestSeoTitles(title: string, bodyHtml: string, tone: WritingTone): Promise<string[]> {
  const excerpt = extractPlainText(bodyHtml).slice(0, 1400);
  const prompt = [
    title.trim() ? `Current headline: ${title.trim()}` : 'Current headline: (none yet)',
    excerpt ? `Draft excerpt:\n${excerpt}` : 'Draft excerpt: (empty draft)',
    `Tone: ${tone}`,
    'Suggest 5 clear, search-friendly blog headlines under 68 characters each.',
  ].join('\n\n');

  const raw = await generateAIText({
    systemInstruction: `You are a senior copy editor. ${ANTI_CLICHE_RULE} Return ONLY a numbered list of 5 headlines, one per line, without quotes or commentary.`,
    messages: [{ role: 'user', content: prompt }],
  });

  return raw
    .split('\n')
    .map((line) => line.replace(/^\d+[.)]\s*/, '').replace(/^["'*]+|["'*]+$/g, '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function rewriteDraftSelection(
  selectionText: string,
  tone: WritingTone,
  instruction?: string
): Promise<string> {
  const target = selectionText.trim();
  if (!target) {
    throw new Error('Highlight a paragraph or sentence in the editor first.');
  }

  return generateAIText({
    systemInstruction: `You are a thoughtful line editor. Rewrite the provided passage in a ${tone} tone. ${ANTI_CLICHE_RULE} Preserve the original facts and intent. Return only the rewritten passage in clean Markdown (no preamble).`,
    messages: [
      {
        role: 'user',
        content: instruction?.trim()
          ? `Instruction: ${instruction.trim()}\n\nPassage:\n${target}`
          : `Rewrite this passage:\n\n${target}`,
      },
    ],
  });
}

export async function expandSectionText(
  seedText: string,
  title: string,
  tone: WritingTone
): Promise<string> {
  const target = seedText.trim();
  if (!target) {
    throw new Error('Select a heading, bullet, or short note in the editor to expand.');
  }

  return generateAIText({
    systemInstruction: `You are an experienced essayist. Expand the provided point into 2–3 clear, concrete paragraphs in a ${tone} tone. ${ANTI_CLICHE_RULE} Use Markdown subheadings or lists only if helpful. Return only the expanded section.`,
    messages: [
      {
        role: 'user',
        content: `Article title: ${title.trim() || 'Untitled'}\n\nPoint to expand:\n${target}`,
      },
    ],
  });
}

export async function generateFullBlogDraft(params: {
  topic: string;
  title?: string;
  tone: WritingTone;
}): Promise<{ title: string; markdownBody: string }> {
  const topic = params.topic.trim() || params.title?.trim();
  if (!topic) {
    throw new Error('Enter a topic or working headline to generate a full draft.');
  }

  const raw = await generateAIText({
    systemInstruction: `You are an independent writer. Write a complete, well-structured blog post (around 600–850 words) in a ${params.tone} tone. ${ANTI_CLICHE_RULE}
Format strictly as:
TITLE: <clear headline>

<Markdown body with ## headings, concrete examples, short paragraphs, and a brief closing section>`,
    messages: [
      {
        role: 'user',
        content: `Topic: ${topic}${params.title?.trim() ? `\nPreferred headline: ${params.title.trim()}` : ''}`,
      },
    ],
  });

  const titleMatch = raw.match(/^TITLE:\s*(.+)$/m);
  const parsedTitle = titleMatch ? titleMatch[1].trim() : params.title?.trim() || topic;
  const markdownBody = raw.replace(/^TITLE:\s*.+\n*/m, '').trim();

  return {
    title: parsedTitle,
    markdownBody,
  };
}

export async function runCustomPrompt(params: {
  promptInstruction: string;
  target: 'selection' | 'draft';
  selectedText: string;
  topicInput: string;
  title: string;
  bodyHtml: string;
  tone: WritingTone;
}): Promise<string> {
  const instruction = params.promptInstruction.trim();
  if (!instruction) {
    throw new Error('Prompt instruction cannot be empty.');
  }

  const contextText =
    params.target === 'draft'
      ? extractPlainText(params.bodyHtml).slice(0, 4500)
      : params.selectedText.trim() || params.topicInput.trim() || extractPlainText(params.bodyHtml).slice(0, 2000);

  if (!contextText && !params.title.trim()) {
    throw new Error(
      params.target === 'selection'
        ? 'Select text in the editor or enter a topic note first.'
        : 'Add a headline or draft content before running this prompt.'
    );
  }

  return generateAIText({
    systemInstruction: `You are an editorial assistant writing in a ${params.tone} tone. ${ANTI_CLICHE_RULE} Follow the user's custom prompt accurately and return clean Markdown ready to insert into the blog post.`,
    messages: [
      {
        role: 'user',
        content: [
          `Custom instruction: ${instruction}`,
          `Headline: ${params.title.trim() || 'Untitled'}`,
          contextText ? `Content:\n${contextText}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
  });
}
