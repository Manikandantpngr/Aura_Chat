'use server';
/**
 * @fileOverview A Genkit flow for handling chat conversations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatRequestSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  message: z.string(),
  model: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export async function streamChat(
  request: ChatRequest
): Promise<ReadableStream<string>> {
  const history = request.history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    content: [{text: msg.content}],
  }));

  const systemPrompt = `You are a helpful and friendly AI assistant.
Format your responses using markdown where appropriate, including:
- Headings
- Bold and italic text
- Lists (bulleted or numbered)
- Code blocks for code snippets`;

  const {stream} = ai.generateStream({
    model: request.model || 'googleai/gemini-2.5-flash',
    system: systemPrompt,
    history,
    prompt: request.message,
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });

  return readableStream;
}
