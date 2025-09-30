
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mood, MoodEmojis } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface JournalEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: { title: string; content: string; mood: Mood, date: Date }) => void;
  selectedDate: Date;
}

export function JournalEntryDialog({
  isOpen,
  onOpenChange,
  onSave,
  selectedDate,
}: JournalEntryDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const handleSave = () => {
    if (title && content && selectedMood) {
      onSave({ title, content, mood: selectedMood, date: selectedDate });
      onOpenChange(false);
      // Reset form
      setTitle('');
      setContent('');
      setSelectedMood(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Journal Entry for {format(selectedDate, 'PPP')}</DialogTitle>
          <DialogDescription>
            Reflect on your day. What's on your mind?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., A good day"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell me more..."
            />
          </div>
          <div className="space-y-2">
            <Label>How are you feeling?</Label>
            <div className="flex justify-around p-2 bg-muted rounded-lg">
              {Object.entries(MoodEmojis).map(([mood, emoji]) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood as Mood)}
                  className={cn(
                    'text-3xl p-2 rounded-full transition-transform transform hover:scale-125',
                    selectedMood === mood ? 'bg-primary scale-110' : ''
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!title || !content || !selectedMood}>
            Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
