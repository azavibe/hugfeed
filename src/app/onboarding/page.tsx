'use client';

import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { Logo } from "@/components/icons";
import { useUser } from "@/firebase/auth/use-user";

export default function OnboardingPage() {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    // Guest users don't need to onboard, but we can show this page
    // if a user is logged in and hasn't completed it.
    // For now, guests can access it if they navigate directly.

    return (
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex flex-col items-center gap-4 mb-8 text-center">
                    <Logo className="w-16 h-16 text-primary" />
                    <h1 className="text-4xl font-bold font-headline">Welcome to Hugfeed</h1>
                    <p className="text-muted-foreground max-w-md text-lg">
                        Let's get to know you a little better to personalize your wellness journey.
                    </p>
                </div>
                <OnboardingFlow />
            </div>
        </div>
    )
}
