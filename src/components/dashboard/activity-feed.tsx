
'use client';

import { useAppContext } from "@/context/app-context";
import { isSameDay, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { PlusCircle, Coffee, Brain, Wind, Dumbbell, Heart } from "lucide-react";
import { JournalEntryDialog } from "./journal-entry-dialog";
import { useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { Task } from "@/lib/types";

const activityIcons: Record<string, React.ElementType> = {
    meditation: Coffee,
    journaling: Brain,
    walking: Wind,
    exercise: Dumbbell,
};

export function ActivityFeed({ selectedDate }: { selectedDate: Date }) {
    const { calendarData, updateTaskCompletion, addJournalEntry } = useAppContext();
    const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);

    const dayData = calendarData.find(d => isSameDay(d.date, selectedDate));

    const renderTask = (task: Task) => (
        <Card key={task.id} className="bg-background/30 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 flex items-center gap-4">
                 <Checkbox 
                    id={task.id} 
                    checked={task.completed} 
                    onCheckedChange={(checked) => updateTaskCompletion(task.id, !!checked)}
                    className="border-foreground"
                />
                <div>
                    <p className="font-semibold">{task.content}</p>
                    <p className="text-sm text-muted-foreground">Task</p>
                </div>
            </CardContent>
        </Card>
    );

    const renderJournalEntry = () => {
        if (dayData?.journalEntry) {
            return (
                <Card className="bg-background/30 backdrop-blur-sm border-white/20">
                    <CardHeader>
                        <CardTitle>{dayData.journalEntry.title}</CardTitle>
                        <CardDescription>{format(dayData.journalEntry.date, "PPP")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>{dayData.journalEntry.content}</p>
                    </CardContent>
                </Card>
            )
        }
        return (
             <Card className="bg-background/30 backdrop-blur-sm border-white/20 text-center">
                <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4">No journal entry for today.</p>
                    <Button variant="secondary" onClick={() => setIsJournalDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Journal Entry
                    </Button>
                </CardContent>
            </Card>
        )
    };
    
    const renderWellnessBreak = () => {
        return (
            <Card className="bg-background/30 backdrop-blur-sm border-white/20 text-green-400">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-400/20 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Go for a refreshing walk</p>
                        <p className="text-sm text-green-400/80">Between events</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <JournalEntryDialog
                isOpen={isJournalDialogOpen}
                onOpenChange={setIsJournalDialogOpen}
                onSave={addJournalEntry}
                selectedDate={selectedDate}
            />
            <div className="space-y-4">
               {dayData?.tasks && dayData.tasks.length > 0 && (
                 <div className="space-y-4">
                     {dayData.tasks.map(renderTask)}
                 </div>
               )}
               
               {renderWellnessBreak()}

               {renderJournalEntry()}

               {!dayData || dayData.tasks.length === 0 && !dayData.journalEntry && (
                 <Card className="bg-background/30 backdrop-blur-sm border-white/20 text-center">
                    <CardContent className="p-10">
                        <p className="text-muted-foreground">No activities scheduled for today.</p>
                    </CardContent>
                </Card>
               )}
            </div>
        </>
    )
}
