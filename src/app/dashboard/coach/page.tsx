import ChatClient from '@/components/coach/chat-client';

export default function CoachPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
        <h1 className="font-headline text-3xl md:text-4xl text-foreground mb-2">
            AI Coach
        </h1>
        <p className="text-muted-foreground mb-6 text-lg">
            Your personal guide for journaling and well-being.
        </p>
        <ChatClient />
    </div>
  );
}
