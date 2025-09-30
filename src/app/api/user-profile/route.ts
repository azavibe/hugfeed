import { NextRequest } from 'next/server';
import { getUserProfile, setUserProfile } from '@/lib/neon-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response('Missing id', { status: 400 });
  }
  const profile = await getUserProfile(id);
  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.name) {
    return new Response('Missing id or name', { status: 400 });
  }
  await setUserProfile(body);
  return new Response('Profile updated', { status: 200 });
}