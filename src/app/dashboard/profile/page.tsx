'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, User, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/app-context";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const { user, isLoaded: userLoaded } = useUser();
    const { userProfile, updateUserProfile, isDataLoading } = useAppContext();
    const [name, setName] = useState('');
    const { toast } = useToast();
    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name);
        }
    }, [userProfile]);

    const handleSaveChanges = () => {
        if (userProfile) {
            updateUserProfile({ ...userProfile, name });
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });
        }
    }

    const isLoading = !userLoaded || isDataLoading;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl md:text-4xl text-foreground">
                    Your Profile
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Manage your account, preferences, and subscription.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5"/> Personal Information</CardTitle>
                            <CardDescription>Update your personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {isLoading ? (
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-20 w-20 rounded-full" />
                                    <Skeleton className="h-10 w-28" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                     <Image src={user?.imageUrl || 'https://picsum.photos/seed/avatar-placeholder/80/80'} alt="User avatar" width={80} height={80} className="rounded-full" />
                                     <Button variant="outline">Change Photo</Button>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                {isLoading ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                {isLoading ? (
                                     <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Input id="email" type="email" defaultValue={user?.emailAddress?.toString() || ''} disabled />
                                )}
                            </div>
                            <Button onClick={handleSaveChanges} disabled={isLoading}>Save Changes</Button>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5"/> Security</CardTitle>
                            <CardDescription>Manage your password and account security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <Button>Update Password</Button>
                        </CardContent>
                    </Card>

                </div>

                <div className="space-y-8">
                     <Card className="bg-gradient-to-br from-primary to-accent border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary-foreground"><Gem className="w-5 h-5"/> Subscription</CardTitle>
                            <CardDescription className="text-primary-foreground/80">You are on the Yearly Plan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-primary-foreground mb-4">Your subscription renews on December 31, 2025.</p>
                            <Link href="/pricing">
                                <Button variant="secondary" className="w-full">Manage Subscription</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
