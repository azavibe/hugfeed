
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
const convertTimestampsToDates = (data: any): { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile } => {
    const calendarData = data.calendarData?.map((day: any) => ({
        ...day,
        date: day.date.toDate(),
        journalEntry: day.journalEntry ? { ...day.journalEntry, date: day.journalEntry.date.toDate() } : null,
        mood: day.mood || null,
    })) || [];
    const messages = data.messages?.length ? data.messages : initialMessages;
    const userProfile = data.userProfile || initialUserProfile;
    return { calendarData, messages, userProfile };
};

// Helper to convert dates to Firestore timestamps for saving
const convertDatesToTimestamps = (data: { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => {
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
        ...(message.image && { image: message.image }),
        ...(message.suggestions && { suggestions: message.suggestions }),
    }));
    
    const sanitizedProfile = data.userProfile ? {
        name: data.userProfile.name || 'Wellness Seeker',
        pronouns: data.userProfile.pronouns || '',
        goals: data.userProfile.goals || [],
        preferredActivities: data.userProfile.preferredActivities || [],
    } : initialUserProfile;

    return { 
        calendarData: sanitizedCalendarData, 
        messages: sanitizedMessages,
        userProfile: sanitizedProfile,
    };
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const db = useFirestore();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Function to save the entire state to Firestore
  const saveStateToFirestore = async (state: { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => {
    if (user && db) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const dataToSave = convertDatesToTimestamps(state);
            await setDoc(userDocRef, dataToSave, { merge: true });
        } catch (error) {
            console.error("Error saving state to Firestore:", error);
        }
    }
  };
  
   // Load data from Firestore or localStorage
  useEffect(() => {
    const loadData = async () => {
        setIsDataLoading(true);
        if (user && db) {
            const userDocRef = doc(db, 'users', user.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const { calendarData, messages, userProfile } = convertTimestampsToDates(data);
                    setCalendarData(calendarData);
                    setMessages(messages);
                    setUserProfile(userProfile);
                } else {
                    // If no data, create initial set for the user
                    const initialData = {
                        calendarData: generateMockCalendarData(),
                        messages: initialMessages,
                        userProfile: { ...initialUserProfile, name: user.displayName || 'Wellness Seeker' }
                    };
                    setCalendarData(initialData.calendarData);
                    setMessages(initialData.messages);
                    setUserProfile(initialData.userProfile);
                    await saveStateToFirestore(initialData); // Save initial state
                }
            } catch (error) {
                 console.error("Error fetching user data from Firestore:", error);
                 setCalendarData(generateMockCalendarData());
                 setMessages(initialMessages);
                 setUserProfile(initialUserProfile);
            }
        } else {
            // Guest user logic
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
        }
        setIsDataLoading(false);
    };
    loadData();
  }, [user, db]);

  // Unified update and persist function
  const updateStateAndPersist = (updateFn: (prevState: { calendarData: CalendarDay[], messages: Message[], userProfile: UserProfile | null }) => { calendarData?: CalendarDay[], messages?: Message[], userProfile?: UserProfile | null }) => {
    const prevState = { calendarData, messages, userProfile };
    const updates = updateFn(prevState);

    const newState = {
      calendarData: updates.calendarData || prevState.calendarData,
      messages: updates.messages || prevState.messages,
      userProfile: 'userProfile' in updates ? updates.userProfile : prevState.userProfile,
    };

    // Update local state first for immediate UI feedback
    if (updates.calendarData) setCalendarData(updates.calendarData);
    if (updates.messages) setMessages(updates.messages);
    if ('userProfile' in updates) setUserProfile(updates.userProfile || null);

    // Persist to appropriate storage
    if (user) {
      saveStateToFirestore(newState);
    } else {
      // Guest user persistence
      if (updates.calendarData) localStorage.setItem('calendarData', JSON.stringify(updates.calendarData));
      if (updates.messages) localStorage.setItem('chatMessages', JSON.stringify(updates.messages));
      if ('userProfile' in updates) localStorage.setItem('userProfile', JSON.stringify(updates.userProfile));
    }
  };


  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'date'> & { date: Date, mood: Mood }) => {
    updateStateAndPersist(prevState => {
        const newEntry: JournalEntry = { id: `journal-${Date.now()}`, ...entry };
        const newCalendarData = [...prevState.calendarData];
        const dayIndex = newCalendarData.findIndex(day => isSameDay(day.date, entry.date));

        if (dayIndex > -1) {
            const dayToUpdate = { ...newCalendarData[dayIndex] };
            dayToUpdate.journalEntry = newEntry;
            dayToUpdate.mood = entry.mood;
            newCalendarData[dayIndex] = dayToUpdate;
        } else {
            const newDay: CalendarDay = {
                date: startOfDay(entry.date),
                tasks: [],
                journalEntry: newEntry,
                mood: entry.mood,
            };
            newCalendarData.push(newDay);
            newCalendarData.sort((a,b) => b.date.getTime() - a.date.getTime());
        }
        return { calendarData: newCalendarData };
    });
  };

  const updateTaskCompletion = (taskId: string, completed: boolean) => {
    updateStateAndPersist(prevState => {
        const newCalendarData = prevState.calendarData.map(day => {
            const taskIndex = day.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const newTasks = [...day.tasks];
                newTasks[taskIndex] = { ...newTasks[taskIndex], completed };
                return { ...day, tasks: newTasks };
            }
            return day;
        });
        return { calendarData: newCalendarData };
    });
  };

  const addTask = (task: Omit<Task, 'id'>, date: Date) => {
    updateStateAndPersist(prevState => {
        const targetDate = startOfDay(date);
        const newCalendarData = [...prevState.calendarData];
        const dayIndex = newCalendarData.findIndex(day => isSameDay(day.date, targetDate));
        const newTask: Task = { id: `task-${Date.now()}`, ...task };

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
        return { calendarData: newCalendarData };
    });
  };

  const updateUserProfile = (profile: UserProfile) => {
    updateStateAndPersist(() => ({
        userProfile: profile,
    }));
  };
  
  const setMessagesWithPersistence: React.Dispatch<React.SetStateAction<Message[]>> = (newMessagesAction) => {
      updateStateAndPersist(prevState => {
        const newMessages = typeof newMessagesAction === 'function' ? newMessagesAction(prevState.messages) : newMessagesAction;
        return { messages: newMessages };
      });
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

    