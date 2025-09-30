'use client';

import { useUser } from '@clerk/nextjs';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/types';
import { Logo } from '../icons';
import { useToast } from '@/hooks/use-toast';
import { aiCoachCalendarIntegration } from '@/ai/flows/ai-coach-calendar-flow';
import { useAppContext } from '@/context/app-context';
import { format } from 'date-fns';

export default function ChatClient() {
    const { messages, addMessage, addTasks, calendarData, userProfile } = useAppContext();
    const { user } = useUser();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    
    // Add initial welcome message if no messages exist
    useEffect(() => {
        if (messages.length === 0 && userProfile?.name) {
            addMessage({
                id: 'welcome',
                role: 'assistant',
                content: `Hello ${userProfile.name}! I'm your AI wellness coach. How can I help you today? I can help you plan your day, suggest wellness activities, or just chat about how you're feeling.`
            });
        }
    }, [messages.length, userProfile?.name, addMessage]);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        }
    };

    useEffect(scrollToBottom, [messages]);
    


    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;
        
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };
        
        // Add user message to chat
        addMessage(userMessage);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // Prepare calendar context
            const recentCalendarData = calendarData.slice(0, 7).map(d => ({
                date: format(d.date, 'MMM d'),
                mood: d.mood,
                tasks: d.tasks?.length || 0,
                journal: d.journalEntry?.title
            }));

            const result = await aiCoachCalendarIntegration({
                userId: user?.id || 'guest-user',
                userName: userProfile?.name || 'User',
                userMessage: currentInput,
                calendarContext: recentCalendarData.length > 0 ? JSON.stringify(recentCalendarData) : undefined
            });

            // If AI generated tasks, add them to calendar
            if (result.tasksToAdd && result.tasksToAdd.length > 0) {
                const today = new Date();
                addTasks(result.tasksToAdd, today);
                
                toast({
                    title: "Tasks Added!",
                    description: `${result.tasksToAdd.length} task(s) have been added to your calendar for today.`,
                });
            }

            // Add AI response to chat
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response
            };
            
            addMessage(aiResponse);

        } catch (error) {
            console.error('AI coach error:', error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment."
            };
            addMessage(errorResponse);
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <div className="flex flex-col h-full bg-card border rounded-lg">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                    {messages.map((message) => (
                        <div key={message.id} className={cn('flex items-start gap-3', { 'justify-end': message.role === 'user' })}>
                            {message.role === 'assistant' && (
                                <Avatar className="w-8 h-8 border-2 border-primary">
                                    <div className="bg-primary w-full h-full flex items-center justify-center">
                                       <Logo className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                </Avatar>
                            )}
                            <div className={cn("max-w-md p-3 rounded-lg", { 'bg-primary text-primary-foreground': message.role === 'user', 'bg-muted': message.role === 'assistant' })}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.imageUrl || undefined} />
                                    <AvatarFallback>{userProfile?.name?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                             <Avatar className="w-8 h-8 border-2 border-primary">
                                    <div className="bg-primary w-full h-full flex items-center justify-center">
                                       <Logo className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                </Avatar>
                            <div className="max-w-md p-3 rounded-lg bg-muted flex items-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <div className="relative">
                    <Input
                        placeholder="Ask me to plan your day, or just chat about how you're feeling..."
                        className="pr-12"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={isLoading}
                    />
                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                        <Button size="icon" onClick={handleSend} disabled={isLoading || input.trim() === ''}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
