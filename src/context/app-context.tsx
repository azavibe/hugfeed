
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CalendarDay, JournalEntry, Message, Task, Mood, UserProfile } from '@/lib/types';
import { generateMockCalendarData } from '@/lib/data';
import { isSameDay, startOfDay } from 'date-fns';
import { useUser } from '@/firebase/auth/use-user';
import { getFirestore, doc, setDoc, onSnapshot, Timestamp, getDoc } from 'firebase/firestore';
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
}

interface AppContextType {
  calendarData: CalendarDay[];
  messages: Message[];
  userProfile: UserProfile | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  updateTaskCompletion: (taskId: string, completed: boolean) => void;
  addTask: (task: Omit<Task, 'id'>, date: Date) => void;
  updateUserProfile: (profile: UserProfile) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert Firestore timestamps to Date objects
const convertTimestampsToDates = (data: any) => {
    const calendarData = data.calendarData?.map((day: any) => ({
        ...day,
        date: day.date.toDate(),
        journalEntry: day.journalEntry ? { ...day.journalEntry, date: day.journalEntry.date.toDate() } : null,
        mood: day.mood || null,
    })) || [];
    const messages = data.messages || initialMessages;
    const userProfile = data.userProfile || initialUserProfile;
    return { calendarData, messages, userProfile };
};


export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const db = useFirestore();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Real-time listener for Firestore data
  useEffect(() => {
    if (user && db) {
        setIsDataLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const { calendarData, messages, userProfile } = convertTimestampsToDates(data);
                setCalendarData(calendarData);
                setMessages(messages);
                setUserProfile(userProfile);
            } else {
                 // If the document doesn't exist, create it with initial data
                const initialData = {
                    calendarData: generateMockCalendarData(),
                    messages: initialMessages,
                    userProfile: { ...initialUserProfile, name: user.displayName || 'Wellness Seeker' }
                };
                setUserData(user.uid, initialData);
                setCalendarData(initialData.calendarData);
                setMessages(initialData.messages);
                setUserProfile(initialData.userProfile);
            }
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error with Firestore snapshot:", error);
            setIsDataLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();

    } else if (!user) {
        // Guest user logic (localStorage)
        setIsDataLoading(true);
        try {
            const storedCalendarData = localStorage.getItem('calendarData');
            const storedMessages = localStorage.getItem('chatMessages');
            const storedProfile = localStorage.getItem('userProfile');
            
            setCalendarData(storedCalendarData ? JSON.parse(storedCalendarData).map((day: any) => ({ ...day, date: new Date(day.date) })) : generateMockCalendarData());
            setMessages(storedMessages ? JSON.parse(storedMessages) : initialMessages);
            setUserProfile(storedProfile ? JSON.parse(storedProfile) : initialUserProfile);
        } catch (error) {
            console.error("Failed to load guest data:", error);
            setCalendarData(generateMockCalendarData());
            setMessages(initialMessages);
            setUserProfile(initialUserProfile);
        }
        setIsDataLoading(false);
    }
  }, [user, db]);

  // Save guest data to localStorage
  useEffect(() => {
    if (!user && !isDataLoading) {
        try {
            localStorage.setItem('calendarData', JSON.stringify(calendarData));
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        } catch (error) {
            console.error("Failed to save guest data to localStorage", error);
        }
    }
  }, [calendarData, messages, userProfile, user, isDataLoading]);
  
  // Firestore write function
  const setUserData = async (userId: string, data: { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => {
      if (!db) return;
      const userDocRef = doc(db, 'users', userId);
      try {
        const sanitizedCalendarData = data.calendarData.map(day => ({
            ...day,
            date: Timestamp.fromDate(day.date),
            mood: day.mood || null,
            journalEntry: day.journalEntry ? { ...day.journalEntry, date: Timestamp.fromDate(day.journalEntry.date) } : null,
        }));
        
        const sanitizedMessages = data.messages.map(message => ({
            id: message.id,
            role: message.role,
            content: message.content,
            image: message.image || null,
            suggestions: message.suggestions || null,
        }));
        
        const sanitizedProfile = data.userProfile ? {
            name: data.userProfile.name || 'Wellness Seeker',
            pronouns: data.userProfile.pronouns || '',
            goals: data.userProfile.goals || [],
            preferredActivities: data.userProfile.preferredActivities || [],
        } : initialUserProfile;

        await setDoc(userDocRef, { 
            calendarData: sanitizedCalendarData, 
            messages: sanitizedMessages,
            userProfile: sanitizedProfile,
        }, { merge: true });
      } catch(error) {
        console.error("Error setting user data in Firestore:", error);
      }
  };


  const updateAndPersist = async (updater: (prev: { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => {
    const currentState = { calendarData, messages, userProfile };
    const newState = updater(currentState);

    if (user) {
        await setUserData(user.uid, newState);
    } else {
        setCalendarData(newState.calendarData);
        setMessages(newState.messages);
        setUserProfile(newState.userProfile);
    }
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'date'> & { date: Date, mood: Mood }) => {
    updateAndPersist(prev => {
        const dayIndex = prev.calendarData.findIndex(day => isSameDay(day.date, entry.date));
        const newEntry: JournalEntry = { id: `journal-${Date.now()}`, ...entry };
        const newData = [...prev.calendarData];

        if (dayIndex > -1) {
            const dayToUpdate = { ...newData[dayIndex] };
            dayToUpdate.journalEntry = newEntry;
            dayToUpdate.mood = entry.mood;
            newData[dayIndex] = dayToUpdate;
        } else {
            const newDay: CalendarDay = {
                date: startOfDay(entry.date),
                tasks: [],
                journalEntry: newEntry,
                mood: entry.mood,
            };
            newData.push(newDay);
            newData.sort((a,b) => b.date.getTime() - a.date.getTime());
        }
        return { ...prev, calendarData: newData };
    });
  };

  const updateTaskCompletion = (taskId: string, completed: boolean) => {
    updateAndPersist(prev => {
        const newCalendarData = prev.calendarData.map(day => {
            const taskIndex = day.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const newTasks = [...day.tasks];
                newTasks[taskIndex] = { ...newTasks[taskIndex], completed };
                return { ...day, tasks: newTasks };
            }
            return day;
        });
        return { ...prev, calendarData: newCalendarData };
    });
  };

  const addTask = (task: Omit<Task, 'id'>, date: Date) => {
    updateAndPersist(prev => {
        const targetDate = startOfDay(date);
        const dayIndex = prev.calendarData.findIndex(day => isSameDay(day.date, targetDate));
        const newTask: Task = { id: `task-${Date.now()}`, ...task };

        const newCalendarData = [...prev.calendarData];
        if (dayIndex !== -1) {
            newCalendarData[dayIndex].tasks.push(newTask);
        } else {
            const newDay: CalendarDay = {
                date: targetDate,
                tasks: [newTask],
                mood: undefined,
                journalEntry: undefined,
            };
            newCalendarData.push(newDay);
            newCalendarData.sort((a,b) => b.date.getTime() - a.date.getTime());
        }
        return { ...prev, calendarData: newCalendarData };
    });
  };

  const updateUserProfile = (profile: UserProfile) => {
    updateAndPersist(prev => ({
        ...prev,
        userProfile: profile,
    }));
  };

  const setMessagesAndUpdate = (newMessages: React.SetStateAction<Message[]>) => {
    const updatedMessages = typeof newMessages === 'function' ? newMessages(messages) : newMessages;
    setMessages(updatedMessages);
    if(user) {
        updateAndPersist(prev => ({...prev, messages: updatedMessages}));
    }
  }

  return (
    <AppContext.Provider value={{ calendarData, messages, userProfile, setMessages: setMessagesAndUpdate, addJournalEntry, updateTaskCompletion, addTask, updateUserProfile, isDataLoading }}>
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
