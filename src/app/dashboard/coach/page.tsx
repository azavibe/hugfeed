'use client';
import { useUser } from '@clerk/nextjs';

import ChatClient from '@/components/coach/chat-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CoachPage() {
  const { user } = useUser();
  const router = useRouter();

  // If user is a guest (not logged in), show the paywall/gate
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <Gem className="w-12 h-12 mx-auto text-primary" />
            <CardTitle className="font-headline text-3xl mt-4">
              Unlock Your AI Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              To access personalized insights and guidance from your AI Coach,
              please sign up or log in.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/')}>Sign Up / Login</Button>
              <Link href="/pricing">
                <Button variant="outline">View Plans</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in, show the chat client
  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* <h1 className="font-headline text-3xl md:text-4xl text-foreground mb-2">
        AI Coach
      </h1> */}
      <p className="text-muted-foreground mb-6 text-lg">
        Your personal guide for journaling and well-being.
      </p>
      <ChatClient />
    </div>
  );
}
