
'use client';

import { BarChart, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  tasksCompleted: {
    label: 'Tasks Completed',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function ProgressPage() {
  const { calendarData, isDataLoading } = useAppContext();

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
          Your Progress
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Track your consistency and celebrate your wins.
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
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
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
                <Bar dataKey="tasksCompleted" fill="var(--color-tasksCompleted)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No task data to display. Start adding tasks to your calendar!</p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
