
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mic, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { useUser } from '@/firebase/auth/use-user';
import { dashboardChat } from '@/ai/flows/dashboard-chat-flow';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Logo } from '../icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function DashboardChat({ selectedDate }: { selectedDate: Date }) {
    const { addTask, userProfile } = useAppContext();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setInput(transcript);
                if (event.results[0].isFinal) {
                    handleSend(transcript);
                }
            };

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                toast({ title: "Voice Error", description: `Could not recognize speech: ${event.error}`, variant: "destructive" });
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [toast]);

    const handleMicClick = () => {
        if (recognitionRef.current) {
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
        } else {
            toast({ title: "Unsupported", description: "Your browser does not support speech recognition.", variant: "destructive" });
        }
    };

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (textToSend.trim() === '') return;

        const userMessage: ChatMessage = { role: 'user', content: textToSend };
        setConversation(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        try {
            const result = await dashboardChat({
                userId: user?.uid || 'guest-user',
                userName: userProfile?.name || 'there',
                message: textToSend,
                preferredActivities: userProfile?.preferredActivities || [],
            });

            if (result.tasks && result.tasks.length > 0) {
                result.tasks.forEach(task => {
                    addTask({ content: task, completed: false }, selectedDate);
                });
                toast({
                    title: "Tasks Added!",
                    description: `${result.tasks.length} task(s) have been added to your calendar for ${format(selectedDate, 'PPP')}.`,
                });
            }

            const aiResponse: ChatMessage = { role: 'assistant', content: result.response };
            setConversation(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("Dashboard chat error:", error);
            const errorResponse: ChatMessage = { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." };
            setConversation(prev => [...prev, errorResponse]);
            toast({ title: "AI Error", description: "Could not get a response from the assistant.", variant: "destructive" });
        } finally {
            setIsThinking(false);
        }
    };
    
    return (
        <div className="space-y-4">
             <div className="relative">
                <Input 
                    placeholder="Ask, plan, or message..." 
                    className="pr-20 pl-4 py-6 text-lg"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isThinking && handleSend()}
                    disabled={isThinking || isListening}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                     <Button variant="ghost" size="icon" onClick={handleMicClick} disabled={isThinking}>
                        <Mic className={cn("w-5 h-5", isListening && "text-red-500 animate-pulse")} />
                    </Button>
                     <Button size="icon" onClick={() => handleSend()} disabled={isThinking}>
                        {isThinking ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            {conversation.length > 0 && (
                <div className="space-y-4">
                    {conversation.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                           {msg.role === 'assistant' && (
                                <Avatar className="w-8 h-8 border-2 border-primary">
                                    <div className="bg-primary w-full h-full flex items-center justify-center">
                                       <Logo className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                </Avatar>
                            )}
                             <div className={cn("max-w-md p-3 rounded-lg text-sm", { 'bg-primary text-primary-foreground': msg.role === 'user', 'bg-muted': msg.role === 'assistant' })}>
                                <p>{msg.content}</p>
                            </div>
                             {msg.role === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>{userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
