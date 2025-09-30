
'use client';

import { BarChart, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';

const moodChartConfig = {
  mood: {
    label: 'Mood',
  },
  great: { label: 'Great', color: 'hsl(var(--chart-1))' },
  good: { label: 'Good', color: 'hsl(var(--chart-2))' },
  ok: { label: 'Okay', color: 'hsl(var(--chart-3))' },
  bad: { label: 'Bad', color: 'hsl(var(--chart-4))' },
  awful: { label: 'Awful', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

const tasksChartConfig = {
  tasksCompleted: {
    label: 'Tasks Completed',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export default function InsightsPage() {
  const { calendarData, isDataLoading } = useAppContext();

  // Data for mood chart
  const moodChartData = calendarData
    .filter(d => d.mood)
    .map(d => ({
      date: format(d.date, 'MMM d'),
      mood: d.mood,
      value: Object.keys(MoodEmojis).indexOf(d.mood!) + 1,
    }))
    .slice(0, 30) // Limit to last 30 entries
    .reverse();

  // Data for journal entries
  const journalEntries = calendarData
    .filter(d => d.journalEntry)
    .sort((a,b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10); // Limit to last 10 entries

  // Data for progress tracking
  const weeklyCompletionData = calendarData
    .slice(0, 7) // Last 7 days
    .map(day => {
      const totalTasks = day.tasks.length;
      const completedTasks = day.tasks.filter(t => t.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      return {
        date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        tasksCompleted: completedTasks,
        completionRate: completionRate,
      };
    })
    .reverse();

  const overallCompletion = weeklyCompletionData.reduce((acc, day) => acc + day.completionRate, 0) / (weeklyCompletionData.length || 1);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-foreground">
          Your Wellness Insights
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Discover patterns, track your consistency, and celebrate your wins.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Weekly Habit Tracker
          </CardTitle>
          <CardDescription>
            Your task completion rate for the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isDataLoading ? (
                 <Skeleton className="h-[50px] w-full" />
            ) : (
                <div className="space-y-2">
                    <Progress value={overallCompletion} className="h-4" />
                    <p className="text-right text-muted-foreground text-sm">{Math.round(overallCompletion)}% average completion</p>
                </div>
            )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
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
            ) : moodChartData.length > 0 ? (
              <ChartContainer config={moodChartConfig} className="min-h-[250px] w-full">
                <RechartsBarChart accessibilityLayer data={moodChartData}>
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
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: moodChartConfig[props.payload.mood as keyof typeof moodChartConfig]?.color}}></div>
                                <span>{MoodEmojis[props.payload.mood as keyof typeof MoodEmojis]} {moodChartConfig[props.payload.mood as keyof typeof moodChartConfig]?.label}</span>
                            </div>
                        )}
                    />}
                  />
                  <Bar dataKey="value" radius={4}>
                      {moodChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={moodChartConfig[entry.mood as keyof typeof moodChartConfig]?.color} />
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
              <BarChart className="w-6 h-6" />
              Tasks Completed Per Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : weeklyCompletionData.length > 0 ? (
              <ChartContainer config={tasksChartConfig} className="min-h-[250px] w-full">
                <RechartsBarChart accessibilityLayer data={weeklyCompletionData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="tasksCompleted" fill="var(--color-tasksCompleted)" radius={4}>
                     {weeklyCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={"hsl(var(--chart-1))"} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p>No task data to display. Start adding tasks to your calendar!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Distraction Analysis
          </CardTitle>
           <CardDescription>
            Understand what's getting in your way. (Coming Soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                <p>Track reasons for incomplete tasks to uncover patterns.</p>
            </div>
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
