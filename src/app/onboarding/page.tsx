'use client';

import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { Logo } from "@/components/icons";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);


    if (loading || !user) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

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
