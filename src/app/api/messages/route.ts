import { NextRequest } from 'next/server';
import { getMessages, setMessages } from '@/lib/neon-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response('Missing id', { status: 400 });
    }
    const messages = await getMessages(id);
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.userId || !body.messages) {
      return new Response('Missing userId or messages', { status: 400 });
    }
    await setMessages(body.userId, body.messages);
    return new Response('Messages updated', { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
