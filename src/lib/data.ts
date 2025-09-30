import { JournalEntry, Task, Mood, CalendarDay, UserProfile } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, startOfDay } from 'date-fns';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-1');

export const mockUserProfile: UserProfile = {
  name: 'Alex Doe',
};

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'j1',
    date: subDays(new Date(), 1),
    mood: 'good',
    title: 'A productive day',
    content: 'Felt really focused today and managed to get a lot done. The new morning ritual seems to be working wonders. I feel optimistic about the week ahead.',
  },
  {
    id: 'j2',
    date: subDays(new Date(), 3),
    mood: 'bad',
    title: 'Feeling overwhelmed',
    content: 'Work has been piling up and I feel like I\'m drowning. It\'s hard to stay positive when there\'s so much to do. I need to find a way to de-stress.',
  },
  {
    id: 'j3',
    date: subDays(new Date(), 5),
    mood: 'great',
    title: 'Wonderful evening with friends',
    content: 'Had a great time catching up with old friends. It was so refreshing to laugh and just be in the moment. Exactly what I needed.',
  },
];

export const mockTasks: Task[] = [
  { id: 't1', content: 'Morning meditation ritual', completed: true },
  { id: 't2', content: 'Journal about today\'s feelings', completed: false },
  { id: 't3', content: 'Go for a 30-minute walk', completed: false },
];

export const generateMockCalendarData = (): CalendarDay[] => {
  const today = startOfDay(new Date());
  const data: CalendarDay[] = [];

  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const journalEntry = mockJournalEntries.find(
      (entry) => startOfDay(entry.date).getTime() === date.getTime()
    );

    let dailyTasks: Task[] = [];
    if (date.getTime() === today.getTime()) {
        dailyTasks = mockTasks;
    } else if (i % 3 === 0) {
        dailyTasks = [
            { id: `dt${i}1`, content: 'Reflect on gratitude', completed: true },
            { id: `dt${i}2`, content: 'Plan tomorrow\'s priorities', completed: true },
        ]
    }

    data.push({
      date,
      mood: journalEntry?.mood,
      journalEntry,
      tasks: dailyTasks,
    });
  }

  return data;
};
