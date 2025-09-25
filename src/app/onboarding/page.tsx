import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { Logo } from "@/components/icons";

export default function OnboardingPage() {
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
