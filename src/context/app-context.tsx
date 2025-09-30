
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { CalendarDay, JournalEntry, Message, Task, Mood, UserProfile } from '@/lib/types';
import { generateMockCalendarData } from '@/lib/data';
import {
  getUserProfile,
  setUserProfile,
  getCalendarData,
  setCalendarData as setCalendarDataDB,
  getMessages,
  setMessages as setMessagesDB
} from '@/lib/neon-db';
import { isSameDay, startOfDay } from 'date-fns';
import { useUser } from '@clerk/nextjs';

const initialUserProfile: UserProfile = {
  id: 'demo-user',
  name: 'Wellness Seeker',
  goals: [],
  preferredActivities: [],
};

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI wellness coach. How are you feeling today? You can talk to me, ask me to plan your day, or upload an image that represents your current state."
  }
];
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


export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const userId = user?.id || 'demo-user';
        // Load all app data from Neon DB
        const [profile, calendar, msgs] = await Promise.all([
          getUserProfile(userId),
          getCalendarData(userId),
          getMessages(userId)
        ]);
        setUserProfile(profile || initialUserProfile);
        setCalendarData(calendar || generateMockCalendarData());
        setMessages(msgs || initialMessages);
      } catch (error) {
        console.error("Failed to load app data from Neon DB:", error);
        setUserProfile(initialUserProfile);
        setCalendarData(generateMockCalendarData());
        setMessages(initialMessages);
      }
      setIsDataLoading(false);
    };
    loadData();
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);


      try {
        const userId = user?.id || 'demo-user';
        // Load all app data from Neon DB
        const [profile, calendar, messages] = await Promise.all([
          getUserProfile(userId),
          getCalendarData(userId),
          getMessages(userId)
        ]);
        setUserProfile(profile || initialUserProfile);
        setCalendarData(calendar || generateMockCalendarData());
        setMessages(messages || initialMessages);
      } catch (error) {
        console.error("Failed to load app data from Neon DB:", error);
        setUserProfile(initialUserProfile);
        setCalendarData(generateMockCalendarData());
        setMessages(initialMessages);
      }
      setIsDataLoading(false);
    };

    loadData();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user]);


  const updateStateAndPersist = async (newCalendarData: CalendarDay[], newMessages: Message[], newUserProfile: UserProfile | null) => {
    setCalendarData(newCalendarData);
    setMessages(newMessages);
    if (newUserProfile) {
      setUserProfile(newUserProfile);
    }

    const userId = user?.id || 'demo-user';
    try {
      await Promise.all([
        setUserProfile({
          id: userId,
          name: newUserProfile?.name || '',
          pronouns: newUserProfile?.pronouns,
          goals: newUserProfile?.goals,
          preferredActivities: newUserProfile?.preferredActivities
        }),
        setCalendarDataDB(userId, newCalendarData),
        setMessagesDB(userId, newMessages)
      ]);
    } catch (error) {
      console.error("Failed to persist app data to Neon DB:", error);
    }
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id'> & { date: Date, mood: Mood }) => {
    const newEntry: JournalEntry = { id: `journal-${Date.now()}`, ...entry };
    let dayFound = false;
    const newCalendarData = calendarData.map((day: CalendarDay) => {
      if (isSameDay(day.date, entry.date)) {
        dayFound = true;
        return { ...day, journalEntry: newEntry, mood: entry.mood };
      }
      return day;
    });
    let updatedCalendarData = [...newCalendarData];
    if (!dayFound) {
      updatedCalendarData.push({
        date: startOfDay(entry.date),
        tasks: [],
        journalEntry: newEntry,
        mood: entry.mood,
      });
      updatedCalendarData.sort((a: CalendarDay, b: CalendarDay) => b.date.getTime() - a.date.getTime());
    }
    updateStateAndPersist(updatedCalendarData, messages, userProfile);
    };

  const updateTaskCompletion = (taskId: string, completed: boolean) => {
    const newCalendarData = calendarData.map((day: CalendarDay) => ({
      ...day,
      tasks: day.tasks.map((task: Task) =>
        task.id === taskId ? { ...task, completed } : task
      ),
    }));
    updateStateAndPersist(newCalendarData, messages, userProfile);
  };

  const addTask = (task: Omit<Task, 'id'>, date: Date) => {
    const targetDate = startOfDay(date);
    const newTask: Task = { id: `task-${Date.now()}`, ...task };
    let dayFound = false;
    let newCalendarData = calendarData.map((day: CalendarDay) => {
      if (isSameDay(day.date, targetDate)) {
        dayFound = true;
        return { ...day, tasks: [...day.tasks, newTask] };
      }
      return day;
    });
    let updatedCalendarData = [...newCalendarData];
    if (!dayFound) {
      updatedCalendarData.push({
        date: targetDate,
        tasks: [newTask],
        mood: undefined,
        journalEntry: undefined,
      });
      updatedCalendarData.sort((a: CalendarDay, b: CalendarDay) => b.date.getTime() - a.date.getTime());
    }
    updateStateAndPersist(updatedCalendarData, messages, userProfile);
  };

  const updateUserProfile = (profile: UserProfile) => {
  updateStateAndPersist(calendarData, messages, profile);
  };
  
  const setMessagesWithPersistence: React.Dispatch<React.SetStateAction<Message[]>> = (action) => {
    const newMessages = typeof action === 'function' ? (action as (prevState: Message[]) => Message[])(messages) : action;
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
