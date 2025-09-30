'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { CalendarDay, JournalEntry, Message, Task, Mood, UserProfile } from '@/lib/types';
import { generateMockCalendarData } from '@/lib/data';
import { isSameDay, startOfDay } from 'date-fns';
import { useUser } from '@/firebase/auth/use-user';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const initialMessages: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI wellness coach. How are you feeling today? You can talk to me, ask me to plan your day, or upload an image that represents your current state."
    }
];

const initialUserProfile: UserProfile = {
    name: 'Wellness Seeker',
    goals: [],
    preferredActivities: [],
};

interface AppContextType {
  calendarData: CalendarDay[];
  messages: Message[];
  userProfile: UserProfile | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addJournalEntry: (entry: { title: string; content: string; mood: Mood, date: Date }) => void;
  updateTaskCompletion: (taskId: string, completed: boolean) => void;
  addTask: (task: Omit<Task, 'id'>, date: Date) => void;
  updateUserProfile: (profile: UserProfile) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert Firestore timestamps to Date objects in deeply nested data
const convertTimestampsToDates = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestampsToDates);
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = convertTimestampsToDates(data[key]);
        }
        return newObj;
    }
    return data;
};

// Helper to convert Date objects to Firestore timestamps for saving
const convertDatesToTimestamps = (data: any): any => {
    if (data instanceof Date) {
        return Timestamp.fromDate(data);
    }
    if (Array.isArray(data)) {
        return data.map(convertDatesToTimestamps);
    }
    if (data !== null && typeof data === 'object' && !Array.isArray(data) && Object.prototype.toString.call(data) !== '[object Date]') {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = convertDatesToTimestamps(data[key]);
        }
        return newObj;
    }
    return data;
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const db = useFirestore();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveDataToFirestore = useCallback((data: { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => {
    if (user && db) {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, convertDatesToTimestamps(data));
            } catch (error) {
                console.error("Error saving state to Firestore:", error);
            }
        }, 1000); 
    }
  }, [user, db]);

  useEffect(() => {
    const loadData = async () => {
        setIsDataLoading(true);

        if (user && db) {
            const userDocRef = doc(db, 'users', user.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                
                if (docSnap.exists()) {
                    const data = convertTimestampsToDates(docSnap.data());
                    setCalendarData(data.calendarData || generateMockCalendarData());
                    setMessages(data.messages || initialMessages);
                    setUserProfile(data.userProfile || initialUserProfile);
                } else {
                    // If no document exists, create one with default data
                    const initialData = {
                        calendarData: generateMockCalendarData(),
                        messages: initialMessages,
                        userProfile: { ...initialUserProfile, name: user.displayName || 'Wellness Seeker' }
                    };
                    setCalendarData(initialData.calendarData);
                    setMessages(initialData.messages);
                    setUserProfile(initialData.userProfile);
                    await setDoc(userDocRef, convertDatesToTimestamps(initialData));
                }
            } catch (error) {
                 console.error("Error fetching user data from Firestore:", error);
                 // Fallback to mock data on error
                 setCalendarData(generateMockCalendarData());
                 setMessages(initialMessages);
                 setUserProfile(initialUserProfile);
            }
        } else {
            // Guest user: load from localStorage
            try {
                const storedCalendarData = localStorage.getItem('calendarData');
                const storedMessages = localStorage.getItem('chatMessages');
                const storedProfile = localStorage.getItem('userProfile');
                
                setCalendarData(storedCalendarData ? JSON.parse(storedCalendarData).map((day: any) => ({ ...day, date: new Date(day.date) })) : generateMockCalendarData());
                setMessages(storedMessages ? JSON.parse(storedMessages) : initialMessages);
                setUserProfile(storedProfile ? JSON.parse(storedProfile) : initialUserProfile);
            } catch (error) {
                console.error("Failed to load guest data from localStorage:", error);
                setCalendarData(generateMockCalendarData());
                setMessages(initialMessages);
                setUserProfile(initialUserProfile);
            }
        }
        setIsDataLoading(false);
    };

    loadData();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  }, [user, db]);

  const updateStateAndPersist = (newCalendarData: CalendarDay[], newMessages: Message[], newUserProfile: UserProfile | null) => {
    setCalendarData(newCalendarData);
    setMessages(newMessages);
    setUserProfile(newUserProfile);

    if (user) {
        saveDataToFirestore({ calendarData: newCalendarData, messages: newMessages, userProfile: newUserProfile });
    } else {
        localStorage.setItem('calendarData', JSON.stringify(newCalendarData));
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
        localStorage.setItem('userProfile', JSON.stringify(newUserProfile));
    }
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id'> & { date: Date, mood: Mood }) => {
    const newEntry: JournalEntry = { id: `journal-${Date.now()}`, ...entry };
    let dayFound = false;
    
    const newCalendarData = calendarData.map(day => {
        if (isSameDay(day.date, entry.date)) {
            dayFound = true;
            return { ...day, journalEntry: newEntry, mood: entry.mood };
        }
        return day;
    });

    if (!dayFound) {
        newCalendarData.push({
            date: startOfDay(entry.date),
            tasks: [],
            journalEntry: newEntry,
            mood: entry.mood,
        });
        newCalendarData.sort((a,b) => b.date.getTime() - a.date.getTime());
    }

    updateStateAndPersist(newCalendarData, messages, userProfile);
  };

  const updateTaskCompletion = (taskId: string, completed: boolean) => {
    const newCalendarData = calendarData.map(day => ({
        ...day,
        tasks: day.tasks.map(task => 
            task.id === taskId ? { ...task, completed } : task
        ),
    }));
    updateStateAndPersist(newCalendarData, messages, userProfile);
  };

  const addTask = (task: Omit<Task, 'id'>, date: Date) => {
    const targetDate = startOfDay(date);
    const newTask: Task = { id: `task-${Date.now()}`, ...task };
    let dayFound = false;

    let newCalendarData = calendarData.map(day => {
        if (isSameDay(day.date, targetDate)) {
            dayFound = true;
            return { ...day, tasks: [...day.tasks, newTask] };
        }
        return day;
    });

    if (!dayFound) {
        newCalendarData.push({
            date: targetDate,
            tasks: [newTask],
            mood: undefined,
            journalEntry: undefined,
        });
        newCalendarData.sort((a,b) => b.date.getTime() - a.date.getTime());
    }
    updateStateAndPersist(newCalendarData, messages, userProfile);
  };

  const updateUserProfile = (profile: UserProfile) => {
    updateStateAndPersist(calendarData, messages, profile);
  };
  
  const setMessagesWithPersistence: React.Dispatch<React.SetStateAction<Message[]>> = (action) => {
      const newMessages = typeof action === 'function' ? action(messages) : action;
      updateStateAndPersist(calendarData, newMessages, userProfile);
  };

  return (
    <AppContext.Provider value={{ calendarData, messages, userProfile, setMessages: setMessagesWithPersistence, addJournalEntry, updateTaskCompletion, addTask, updateUserProfile, isDataLoading }}>
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
