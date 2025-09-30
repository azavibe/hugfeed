
'use client';

import { useState } from 'react';
import { addDays, format, isSameDay, startOfWeek, subWeeks, addWeeks, eachDayOfInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodEmojis, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '../ui/checkbox';
import { Calendar } from '../ui/calendar';
import { useAppContext } from '@/context/app-context';
import { JournalEntryDialog } from './journal-entry-dialog';

const WeeklyDatePicker = ({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }));

  const weekDays = eachDayOfInterval({
    start: currentWeek,
    end: addDays(currentWeek, 6),
  });

  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        {weekDays.map((day) => (
          <Button
            key={day.toString()}
            variant={isSameDay(day, selectedDate) ? 'default' : 'ghost'}
            className="flex flex-col h-auto p-2"
            onClick={() => onDateChange(day)}
          >
            <span className="text-xs">{format(day, 'E')}</span>
            <span className="text-lg font-bold">{format(day, 'd')}</span>
          </Button>
        ))}
      </div>
      <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};


const DayDetails = ({ selectedDate }: { selectedDate: Date }) => {
    const { calendarData, updateTaskCompletion, addJournalEntry } = useAppContext();
    const dayData = calendarData.find(d => isSameDay(d.date, selectedDate));
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (!dayData) {
        return <div className="text-center text-muted-foreground py-16">No data for this day.</div>
    }

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
            <JournalEntryDialog 
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={addJournalEntry}
                selectedDate={selectedDate}
            />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Mood & Journal</span>
                        {dayData.mood && <span className="text-3xl">{MoodEmojis[dayData.mood]}</span>}
                    </CardTitle>
                     <CardDescription>{format(dayData.date, "EEEE, MMMM d, yyyy")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {dayData.journalEntry ? (
                        <div className="space-y-2">
                            <h3 className="font-semibold">{dayData.journalEntry.title}</h3>
                            <p className="text-muted-foreground text-sm">{dayData.journalEntry.content}</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No journal entry for today.</p>
                            <Button variant="ghost" className="mt-2" onClick={() => setIsDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/> Add Entry</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Tasks & Plan</CardTitle>
                    <CardDescription>Your daily rituals and goals.</CardDescription>
                </CardHeader>
                <CardContent>
                     {dayData.tasks.length > 0 ? (
                        <div className="space-y-4">
                            {dayData.tasks.map((task: Task) => (
                                <div key={task.id} className="flex items-center space-x-3">
                                    <Checkbox 
                                        id={task.id} 
                                        checked={task.completed} 
                                        onCheckedChange={(checked) => updateTaskCompletion(task.id, !!checked)}
                                    />
                                    <label
                                        htmlFor={task.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {task.content}
                                    </label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No tasks for today.</p>
                             <Button variant="ghost" className="mt-2" onClick={() => {
                                // In a real app, this would open a dialog to add a task.
                                console.log("Add Task clicked");
                             }}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Add Task
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function CalendarTabs() {
  const { calendarData } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Tabs defaultValue="day">
      <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
      <TabsContent value="day">
        <Card>
            <CardHeader>
                <WeeklyDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </CardHeader>
            <CardContent>
                <DayDetails selectedDate={selectedDate} />
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="week">
        <Card>
            <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
                <CardDescription>Coming soon: A view of your week at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                Week view is under construction.
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="month">
        <Card className="flex justify-center">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                    if (date) {
                        setSelectedDate(date);
                    }
                }}
                className="p-0"
                components={{
                    Day: ({ date }) => {
                      const dayData = calendarData.find(d => isSameDay(d.date, date));
                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {format(date, 'd')}
                          {dayData?.mood && (
                            <span className="absolute bottom-1 text-xs">{MoodEmojis[dayData.mood]}</span>
                          )}
                        </div>
                      );
                    },
                  }}
            />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
