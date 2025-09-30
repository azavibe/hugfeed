
export type UserProfile = {
  name: string;
  pronouns?: string;
  goals?: string[];
  preferredActivities?: string[];
};

export type Mood = 'awful' | 'bad' | 'ok' | 'good' | 'great';

export const MoodEmojis: Record<Mood, string> = {
    great: '😄',
    good: '😊',
    ok: '😐',
    bad: '😟',
    awful: '😭',
}

export type JournalEntry = {
  id: string;
  date: Date;
  title: string;
  content: string;
  mood: Mood;
};

export type Task = {
  id: string;
  content: string;
  completed: boolean;
};

export type CalendarDay = {
  date: Date;
  mood?: Mood | null;
  journalEntry?: JournalEntry | null;
  tasks: Task[];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  image?: string;
  suggestions?: string[];
};
