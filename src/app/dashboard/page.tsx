
'use client';

import { useState } from 'react';
import { format, isSameDay, startOfWeek, subWeeks, addWeeks, eachDayOfInterval } from 'date-fns';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DayPicker = ({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (date: Date) => void; }) => {
  const days = eachDayOfInterval({
    start: subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 2),
    end: addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 4),
  });

  const selectedIndex = days.findIndex(day => isSameDay(day, selectedDate));

  return (
    <Carousel
      opts={{
        align: "start",
        startIndex: selectedIndex > -1 ? selectedIndex -2: 0, // Start with the selected date in view
      }}
      className="w-full max-w-sm sm:max-w-md mx-auto"
    >
      <CarouselContent>
        {days.map((day) => (
          <CarouselItem key={day.toString()} className="basis-1/5">
             <Button
                variant={isSameDay(day, selectedDate) ? 'default' : 'ghost'}
                className="flex flex-col h-auto p-2 w-full"
                onClick={() => onDateChange(day)}
             >
                <span className="text-xs">{format(day, 'E')}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
            </Button>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
};


export default function DashboardPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div className="flex flex-col gap-6">
             <DayPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
             <div className="relative">
                <Mic className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ask, plan, or message..." className="pl-10 pr-4 py-6 text-lg" />
            </div>
            <ActivityFeed selectedDate={selectedDate} />
        </div>
    );
}
