import { OpenAIStream, StreamingTextResponse } from '@vercel/ai';
import OpenAI from 'openai';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set runtime to edge for better performance
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: messages.map((message) => ({
        content: message.content,
        role: message.role,
      })),
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Return a StreamingTextResponse, which can be consumed by the client
    return new StreamingTextResponse(stream);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }), 
      { status: 500 }
    );
  }
}