'use client';

import { BarChart, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoodEmojis } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart, Cell } from 'recharts';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  mood: {
    label: 'Mood',
  },
  great: { label: 'Great', color: 'hsl(var(--chart-1))' },
  good: { label: 'Good', color: 'hsl(var(--chart-2))' },
  ok: { label: 'Okay', color: 'hsl(var(--chart-3))' },
  bad: { label: 'Bad', color: 'hsl(var(--chart-4))' },
  awful: { label: 'Awful', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

export default function InsightsPage() {
  const { calendarData, isDataLoading } = useAppContext();

  const chartData = calendarData
    .filter(d => d.mood)
    .map(d => ({
      date: format(d.date, 'MMM d'),
      mood: d.mood,
      value: Object.keys(MoodEmojis).indexOf(d.mood!) + 1,
    }))
    .slice(0, 30) // Limit to last 30 entries for performance
    .reverse();

  const journalEntries = calendarData
    .filter(d => d.journalEntry)
    .sort((a,b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10); // Limit to last 10 entries

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-foreground">
          Your Wellness Insights
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Discover patterns in your emotional journey.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-6 h-6" />
            Mood Fluctuation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <RechartsBarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis hide={true} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                      formatter={(value, name, props) => (
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{backgroundColor: chartConfig[props.payload.mood as keyof typeof chartConfig]?.color}}></div>
                              <span>{MoodEmojis[props.payload.mood as keyof typeof MoodEmojis]} {chartConfig[props.payload.mood as keyof typeof chartConfig]?.label}</span>
                          </div>
                      )}
                  />}
                />
                <Bar dataKey="value" radius={4}>
                    {chartData.map((entry) => (
                        <Cell key={entry.date} fill={chartConfig[entry.mood as keyof typeof chartConfig]?.color} />
                    ))}
                </Bar>
              </RechartsBarChart>
            </ChartContainer>
          ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Not enough mood data to display chart. Start logging your mood!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Journal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : journalEntries.length > 0 ? (
            <div className="space-y-4">
              {journalEntries.map(day => (
                <div key={day.journalEntry!.id} className="p-4 border rounded-lg">
                  <p className="font-bold">{day.journalEntry!.title} - <span className="text-sm text-muted-foreground">{format(day.journalEntry!.date, "PPP")}</span></p>
                  <p className="mt-2 text-muted-foreground">{day.journalEntry!.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No journal entries yet. Write your first one from the Calendar tab.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
