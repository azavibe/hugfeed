import CalendarTabs from "@/components/dashboard/calendar-tabs";
import { generateMockCalendarData } from "@/lib/data";

export default function DashboardPage() {
    const calendarData = generateMockCalendarData();

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl md:text-4xl text-foreground">
                    Your Emotional Compass
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Reflect on your days, understand your patterns, and grow.
                </p>
            </div>
            <CalendarTabs data={calendarData} />
        </div>
    );
}
