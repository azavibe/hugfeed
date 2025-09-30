
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Paperclip, Send, Loader2, PlusCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/types';
import { mockUser } from '@/lib/data';
import { Logo } from '../icons';
import { useToast } from '@/hooks/use-toast';
import { aiCoachCalendarIntegration } from '@/ai/flows/ai-coach-calendar-flow';
import { useAppContext } from '@/context/app-context';
import { format } from 'date-fns';

export default function ChatClient() {
    const { messages, setMessages, addTask } = useAppContext();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(scrollToBottom, [messages]);
    
    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUri = e.target?.result as string;
                const newMessage: Message = { id: Date.now().toString(), role: 'user', content: 'Here is an image.', image: imageUri };
                setMessages(prev => [...prev, newMessage]);
                // Mock AI response to image
                setIsLoading(true);
                setTimeout(() => {
                    const aiResponse: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Thank you for sharing this image. It seems to evoke a sense of calm and introspection. How does this relate to your current feelings?' };
                    setMessages(prev => [...prev, aiResponse]);
                    setIsLoading(false);
                }, 1500);
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSend = async () => {
        if (input.trim() === '') return;
        
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await aiCoachCalendarIntegration({
                userId: 'mock-user-id',
                calendarData: "User had a productive day yesterday but felt overwhelmed three days ago.",
                query: input,
            });

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                suggestions: result.suggestedTasks,
            };

            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("AI coach error:", error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having a little trouble connecting right now. Please try again in a moment.",
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestionClick = (taskContent: string) => {
        const newTask = {
            id: `task-${Date.now()}`,
            content: taskContent,
            completed: false,
        };
        addTask(newTask, new Date());
        toast({
            title: "Task Added!",
            description: `"${taskContent}" has been added to your calendar for ${format(new Date(), 'PPP')}.`
        });
    }

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
                                <p className="text-sm">{message.content}</p>
                                {message.image && <img src={message.image} alt="User upload" className="mt-2 rounded-lg max-w-xs" />}
                                {message.suggestions && message.suggestions.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-xs font-semibold">Here are some suggestions for you:</p>
                                        {message.suggestions.map((task, index) => (
                                            <Button key={index} variant="secondary" size="sm" className="w-full justify-start" onClick={() => handleSuggestionClick(task)}>
                                                <PlusCircle className="w-4 h-4 mr-2"/>
                                                {task}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {message.role === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={mockUser.avatarUrl} />
                                    <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
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
                        placeholder="Type your message..."
                        className="pr-24"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                    />
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        <Button size="icon" onClick={handleSend} disabled={isLoading}>
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
