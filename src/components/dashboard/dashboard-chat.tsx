
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mic, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { useUser } from '@/firebase/auth/use-user';
import { aiCoachCalendarIntegration } from '@/ai/flows/ai-coach-calendar-flow';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Logo } from '../icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Message } from '@/lib/types';


export function DashboardChat({ selectedDate }: { selectedDate: Date }) {
    const { addTask, userProfile, messages, setMessages, calendarData } = useAppContext();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Filter messages to show only the last 2, plus a welcome if it's the only one
    const conversation = messages.length <= 3 ? messages : messages.slice(messages.length - 2);


    useEffect(() => {
        // Ensure that 'window' is defined, i.e., we are on the client side.
        if (typeof window !== 'undefined') {
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

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        try {
            const calendarSummary = calendarData.slice(0, 7).map(d => ({
                date: format(d.date, 'PPP'),
                mood: d.mood,
                journal: d.journalEntry?.title
            }));

            const result = await aiCoachCalendarIntegration({
                userId: user?.uid || 'guest-user',
                userName: userProfile?.name || 'there',
                preferredActivities: userProfile?.preferredActivities || [],
                calendarData: JSON.stringify(calendarSummary),
                query: textToSend,
            });

            if (result.tasksToAdd && result.tasksToAdd.length > 0) {
                result.tasksToAdd.forEach(task => {
                    addTask({ content: task, completed: false }, selectedDate);
                });
                toast({
                    title: "Tasks Added!",
                    description: `${result.tasksToAdd.length} task(s) have been added to your calendar for ${format(selectedDate, 'PPP')}.`,
                });
            }

            const aiResponse: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: result.response,
                suggestions: result.suggestedTasks,
            };
            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("Dashboard chat error:", error);
            const errorResponse: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I'm having trouble connecting right now. Please try again." };
            setMessages(prev => [...prev, errorResponse]);
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
                    {conversation.map((msg) => (
                        <div key={msg.id} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                           {msg.role === 'assistant' && (
                                <Avatar className="w-8 h-8 border-2 border-primary">
                                    <div className="bg-primary w-full h-full flex items-center justify-center">
                                       <Logo className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                </Avatar>
                            )}
                             <div className={cn("max-w-md p-3 rounded-lg text-sm", { 'bg-primary text-primary-foreground': msg.role === 'user', 'bg-muted': msg.role === 'assistant' })}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                             </div>
                             {msg.role === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback>{userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isThinking && (
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
            )}
        </div>
    );
}
