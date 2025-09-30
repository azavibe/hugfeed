
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/icons";

export default function PricingPage() {
    const monthlyImage = PlaceHolderImages.find((image) => image.id === 'pricing-monthly');
    const yearlyImage = PlaceHolderImages.find((image) => image.id === 'pricing-yearly');

    const features = [
        "Unlimited journaling",
        "Personalized AI coaching",
        "Advanced mood analysis",
        "Full calendar integration",
        "Task & ritual suggestions"
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
             <Link href="/dashboard" className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-foreground">
                <Logo className="w-8 h-8"/>
                <span className="font-headline text-xl">Hugfeed</span>
            </Link>
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Find Your Perfect Plan</h1>
                <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                    Unlock your full potential with unlimited access to journaling, AI coaching, and personalized wellness plans.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl w-full">
                <Card className="flex flex-col">
                    {monthlyImage && (
                        <div className="relative h-48 w-full">
                            <Image src={monthlyImage.imageUrl} alt="Zen pebbles" fill className="object-cover rounded-t-lg" data-ai-hint={monthlyImage.imageHint}/>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Monthly</CardTitle>
                        <CardDescription>Ideal for getting started and exploring all features.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <p className="text-4xl font-bold">$29.99<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                        <ul className="space-y-2">
                            {features.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-primary" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg">Choose Monthly</Button>
                    </CardFooter>
                </Card>
                 <Card className="flex flex-col border-primary ring-2 ring-primary relative">
                     <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Most Popular</div>
                    {yearlyImage && (
                        <div className="relative h-48 w-full">
                            <Image src={yearlyImage.imageUrl} alt="Forest path" fill className="object-cover rounded-t-lg" data-ai-hint={yearlyImage.imageHint} />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Yearly</CardTitle>
                        <CardDescription>Save over 30% and commit to your long-term growth.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                         <p className="text-4xl font-bold">$199.99<span className="text-lg font-normal text-muted-foreground">/year</span></p>
                         <ul className="space-y-2">
                            {features.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-primary" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg">Choose Yearly</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
