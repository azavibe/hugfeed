
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { CalendarDay, JournalEntry, Message, Task, Mood, UserProfile } from '@/lib/types';
import { isSameDay, startOfDay } from 'date-fns';
import { useUser } from '@clerk/nextjs';
interface AppContextType {
  calendarData: CalendarDay[];
  messages: Message[];
  userProfile: UserProfile | null;
  addMessage: (message: Message) => void;
  addJournalEntry: (entry: { title: string; content: string; mood: Mood, date: Date }) => void;
  updateTaskCompletion: (taskId: string, completed: boolean) => void;
  addTask: (task: Omit<Task, 'id'>, date: Date) => void;
  addTasks: (tasks: { content: string; completed: boolean }[], date: Date) => void;
  updateUserProfile: (profile: UserProfile) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user data on mount
  useEffect(() => {
    if (!user?.id) {
      setIsDataLoading(false);
      return;
    }
    
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const userId = user.id;
        
        const [profileRes, calendarRes, messagesRes] = await Promise.all([
          fetch(`/api/user-profile?id=${userId}`),
          fetch(`/api/calendar?id=${userId}`),
          fetch(`/api/messages?id=${userId}`)
        ]);
        
        // Parse responses safely
        const profile = profileRes.ok && profileRes.headers.get('content-length') !== '4' ? await profileRes.json() : null;
        const calendar = calendarRes.ok && calendarRes.headers.get('content-length') !== '4' ? await calendarRes.json() : [];
        const msgs = messagesRes.ok && messagesRes.headers.get('content-length') !== '4' ? await messagesRes.json() : [];
        
        setUserProfile(profile);
        setCalendarData(Array.isArray(calendar) ? calendar.map(day => ({
          ...day,
          date: new Date(day.date)
        })) : []);
        setMessages(Array.isArray(msgs) ? msgs : []);
        
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
      setIsDataLoading(false);
    };
    
    loadData();
  }, [user?.id]);


  // Save data to database
  const saveCalendarData = async (data: CalendarDay[]) => {
    if (!user?.id) return;
    
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, calendarData: data })
      });
    } catch (error) {
      console.error('Failed to save calendar data:', error);
    }
  };
  
  const saveMessages = async (msgs: Message[]) => {
    if (!user?.id) return;
    
    try {
      console.log('Saving messages:', msgs);
      const payload = { userId: user.id, messages: msgs };
      console.log('Payload:', payload);
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  // Add message to chat and save
  const addMessage = (message: Message) => {
    const newMessages = [...messages, message];
    setMessages(newMessages);
    saveMessages(newMessages);
  };
  
  // Add multiple tasks at once (from AI)
  const addTasks = (tasks: { content: string; completed: boolean }[], date: Date) => {
    const targetDate = startOfDay(date);
    const newTasks: Task[] = tasks.map(task => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: task.content,
      completed: task.completed
    }));
    
    let dayFound = false;
    const updatedCalendarData = calendarData.map(day => {
      if (isSameDay(day.date, targetDate)) {
        dayFound = true;
        return { ...day, tasks: [...day.tasks, ...newTasks] };
      }
      return day;
    });
    
    if (!dayFound) {
      updatedCalendarData.push({
        date: targetDate,
        tasks: newTasks,
      });
      updatedCalendarData.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    setCalendarData(updatedCalendarData);
    saveCalendarData(updatedCalendarData);
  };
  
  const addJournalEntry = (entry: { title: string; content: string; mood: Mood, date: Date }) => {
    const newEntry: JournalEntry = { 
      id: `journal-${Date.now()}`, 
      title: entry.title,
      content: entry.content,
      date: entry.date,
      mood: entry.mood
    };
    
    let dayFound = false;
    const updatedCalendarData = calendarData.map(day => {
      if (isSameDay(day.date, entry.date)) {
        dayFound = true;
        return { ...day, journalEntry: newEntry, mood: entry.mood };
      }
      return day;
    });
    
    if (!dayFound) {
      updatedCalendarData.push({
        date: startOfDay(entry.date),
        tasks: [],
        journalEntry: newEntry,
        mood: entry.mood,
      });
      updatedCalendarData.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    setCalendarData(updatedCalendarData);
    saveCalendarData(updatedCalendarData);
  };

  const updateTaskCompletion = (taskId: string, completed: boolean) => {
    const updatedCalendarData = calendarData.map(day => ({
      ...day,
      tasks: day.tasks.map(task =>
        task.id === taskId ? { ...task, completed } : task
      ),
    }));
    setCalendarData(updatedCalendarData);
    saveCalendarData(updatedCalendarData);
  };

  const addTask = (task: Omit<Task, 'id'>, date: Date) => {
    const targetDate = startOfDay(date);
    const newTask: Task = { id: `task-${Date.now()}`, ...task };
    let dayFound = false;
    
    const updatedCalendarData = calendarData.map(day => {
      if (isSameDay(day.date, targetDate)) {
        dayFound = true;
        return { ...day, tasks: [...day.tasks, newTask] };
      }
      return day;
    });
    
    if (!dayFound) {
      updatedCalendarData.push({
        date: targetDate,
        tasks: [newTask],
      });
      updatedCalendarData.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    setCalendarData(updatedCalendarData);
    saveCalendarData(updatedCalendarData);
  };

  const updateUserProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    if (!user?.id) return;
    
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: profile.name,
          pronouns: profile.pronouns,
          goals: profile.goals,
          preferredActivities: profile.preferredActivities
        })
      });
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  };

  return (
    <AppContext.Provider value={{ 
      calendarData, 
      messages, 
      userProfile, 
      addMessage, 
      addJournalEntry, 
      updateTaskCompletion, 
      addTask, 
      addTasks,
      updateUserProfile, 
      isDataLoading 
    }}>
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
