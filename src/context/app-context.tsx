
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CalendarDay, JournalEntry, Message, Task, Mood } from '@/lib/types';
import { generateMockCalendarData } from '@/lib/data';
import { isSameDay, startOfDay } from 'date-fns';
import { useUser } from '@/firebase/auth/use-user';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const initialMessages: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI wellness coach. How are you feeling today? Feel free to share what's on your mind, or upload an image that represents your current state."
    }
];

interface AppContextType {
  calendarData: CalendarDay[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  updateTaskCompletion: (taskId: string, completed: boolean) => void;
  addTask: (task: Omit<Task, 'id'>, date: Date) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const db = useFirestore(); // Use the initialized firestore instance from context
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Firestore utility functions
  const getUserData = async (userId: string) => {
      if (!db) return { calendarData: null, messages: null };
      const userDocRef = doc(db, 'users', userId);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Dates need to be re-hydrated from Firestore Timestamps or strings
            const calendarData = data.calendarData?.map((day: any) => ({
                ...day,
                date: day.date.toDate(),
                journalEntry: day.journalEntry ? { ...day.journalEntry, date: day.journalEntry.date.toDate() } : null,
                mood: day.mood || null,
            })) || [];
            const messages = data.messages || initialMessages;
            return { calendarData, messages };
        }
      } catch (error) {
        console.error("Error getting user data from Firestore:", error);
      }
      return { calendarData: null, messages: null };
  };

  const setUserData = async (userId: string, data: { calendarData: CalendarDay[], messages: Message[] }) => {
      if (!db) return;
      const userDocRef = doc(db, 'users', userId);
      try {
        // Sanitize data before sending to Firestore
        const sanitizedCalendarData = data.calendarData.map(day => ({
            ...day,
            mood: day.mood || null,
            journalEntry: day.journalEntry || null,
        }));
        
        const sanitizedMessages = data.messages.map(message => ({
            ...message,
            image: message.image || null,
            suggestions: message.suggestions || null,
        }));

        await setDoc(userDocRef, { calendarData: sanitizedCalendarData, messages: sanitizedMessages }, { merge: true });
      } catch(error) {
        console.error("Error setting user data in Firestore:", error);
      }
  };


  // Load data based on user auth state
  useEffect(() => {
    const loadData = async () => {
        setIsDataLoading(true);
        if (user && db) {
            // Logged-in user: fetch from Firestore
            const { calendarData: firestoreCalendar, messages: firestoreMessages } = await getUserData(user.uid);
            setCalendarData(firestoreCalendar || generateMockCalendarData());
            setMessages(firestoreMessages || initialMessages);
        } else if (!user) {
            // Guest user: fetch from localStorage
            try {
                const storedCalendarData = localStorage.getItem('calendarData');
                const storedMessages = localStorage.getItem('chatMessages');
                
                if (storedCalendarData) {
                    const parsedData = JSON.parse(storedCalendarData).map((day: any) => ({
                        ...day,
                        date: new Date(day.date),
                        journalEntry: day.journalEntry ? { ...day.journalEntry, date: new Date(day.journalEntry.date) } : undefined,
                    }));
                    setCalendarData(parsedData);
                } else {
                    setCalendarData(generateMockCalendarData());
                }
                
                if (storedMessages) {
                    setMessages(JSON.parse(storedMessages));
                } else {
                    setMessages(initialMessages);
                }
            } catch (error) {
                console.error("Failed to load guest data from localStorage", error);
                setCalendarData(generateMockCalendarData());
                setMessages(initialMessages);
            }
        }
        setIsDataLoading(false);
        setIsInitialLoad(false);
    };
    loadData();
  }, [user, db]);

  // Save data when it changes
  useEffect(() => {
    if (isInitialLoad || isDataLoading) return;
    
    const saveData = async () => {
        if (user) {
            // Logged-in user: save to Firestore
            await setUserData(user.uid, { calendarData, messages });
        } else {
            // Guest user: save to localStorage
            try {
                localStorage.setItem('calendarData', JSON.stringify(calendarData));
                localStorage.setItem('chatMessages', JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save guest data to localStorage", error);
            }
        }
    };

    // Debounce saving to avoid too many writes
    const handler = setTimeout(() => {
        saveData();
    }, 1000);

    return () => {
        clearTimeout(handler);
    };

  }, [calendarData, messages, user, isInitialLoad, isDataLoading]);

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'date'> & { date: Date, mood: Mood }) => {
    setCalendarData(prevData => {
      const dayIndex = prevData.findIndex(day => isSameDay(day.date, entry.date));
      if (dayIndex === -1) return prevData;

      const newData = [...prevData];
      const newEntry: JournalEntry = {
        id: `journal-${Date.now()}`,
        ...entry,
      };
      
      newData[dayIndex] = {
        ...newData[dayIndex],
        journalEntry: newEntry,
        mood: entry.mood,
      };
      
      return newData;
    });
  };

  const updateTaskCompletion = (taskId: string, completed: boolean) => {
    setCalendarData(prevData => {
      return prevData.map(day => {
        const taskIndex = day.tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
          const newTasks = [...day.tasks];
          newTasks[taskIndex] = { ...newTasks[taskIndex], completed };
          return { ...day, tasks: newTasks };
        }
        return day;
      });
    });
  };

  const addTask = (task: Omit<Task, 'id'>, date: Date) => {
    setCalendarData(prevData => {
        const targetDate = startOfDay(date);
        const dayIndex = prevData.findIndex(day => isSameDay(day.date, targetDate));
        
        const newTask: Task = {
            id: `task-${Date.now()}`,
            ...task,
        };

        if (dayIndex !== -1) {
            const newData = [...prevData];
            newData[dayIndex].tasks.push(newTask);
            return newData;
        } else {
            // If no data for this day exists, create it
            const newDay: CalendarDay = {
                date: targetDate,
                tasks: [newTask],
                mood: undefined,
                journalEntry: undefined,
            };
            return [...prevData, newDay].sort((a,b) => b.date.getTime() - a.date.getTime());
        }
    });
  };

  return (
    <AppContext.Provider value={{ calendarData, messages, setMessages, addJournalEntry, updateTaskCompletion, addTask, isDataLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppStateProvider');
  }
  return context;
};
