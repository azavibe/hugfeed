export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.userId || !body.calendarData) {
    return new Response('Missing userId or calendarData', { status: 400 });
  }
  await setCalendarData(body.userId, body.calendarData);
  return new Response('Calendar updated', { status: 200 });
}
import { NextRequest } from 'next/server';
import { getCalendarData, setCalendarData } from '@/lib/neon-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response('Missing id', { status: 400 });
  }
  const calendar = await getCalendarData(id);
  return new Response(JSON.stringify(calendar), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
