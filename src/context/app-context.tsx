
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CalendarDay, JournalEntry, Message, Task, Mood } from '@/lib/types';
import { generateMockCalendarData } from '@/lib/data';
import { isSameDay, startOfDay } from 'date-fns';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load initial data from localStorage or mock data
  useEffect(() => {
    try {
      const storedCalendarData = localStorage.getItem('calendarData');
      const storedMessages = localStorage.getItem('chatMessages');
      
      if (storedCalendarData) {
        // Dates need to be re-hydrated from string
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
      console.error("Failed to load data from localStorage", error);
      setCalendarData(generateMockCalendarData());
      setMessages(initialMessages);
    }
    setIsInitialLoad(false);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialLoad) return;
    try {
      localStorage.setItem('calendarData', JSON.stringify(calendarData));
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [calendarData, messages, isInitialLoad]);

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
            newData[dayIndex] = {
                ...newData[dayIndex],
                tasks: [...newData[dayIndex].tasks, newTask],
            };
            return newData;
        } else {
            // If no data for this day exists, create it
            const newDay: CalendarDay = {
                date: targetDate,
                tasks: [newTask],
            };
            return [...prevData, newDay].sort((a,b) => b.date.getTime() - a.date.getTime());
        }
    });
  };

  return (
    <AppContext.Provider value={{ calendarData, messages, setMessages, addJournalEntry, updateTaskCompletion, addTask }}>
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
