
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mic, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { aiCoachCalendarIntegration } from '@/ai/flows/ai-coach-calendar-flow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Message } from '@/lib/types';


export function DashboardChat({ selectedDate }: { selectedDate: Date }) {
    const { addTasks, userProfile, calendarData } = useAppContext();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
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
        if (textToSend.trim() === '' || isThinking) return;

        setInput('');
        setIsThinking(true);

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
                userMessage: textToSend,
                calendarContext: recentCalendarData.length > 0 ? JSON.stringify(recentCalendarData) : undefined
            });

            // If AI generated tasks, add them to calendar
            if (result.tasksToAdd && result.tasksToAdd.length > 0) {
                addTasks(result.tasksToAdd, selectedDate);
                toast({
                    title: "Tasks Added!",
                    description: `${result.tasksToAdd.length} task(s) have been added to your calendar for ${format(selectedDate, 'PPP')}.`,
                });
            }

        } catch (error) {
            console.error('Dashboard chat error:', error);
            toast({ 
                title: "AI Error", 
                description: "Could not get a response from the assistant.", 
                variant: "destructive" 
            });
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
        </div>
    );
}
