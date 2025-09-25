'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { useUser } from '@/firebase/auth/use-user';


export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((image) => image.id === 'login-background');
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  const signInWithGoogle = async () => {
    if (auth) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithRedirect(auth, provider);
      } catch (error) {
        console.error('Error signing in with Google', error);
      }
    }
  };
  
  if (loading || user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold font-headline">Welcome to Hugfeed</h1>
            <p className="text-balance text-muted-foreground">
              Your emotional wellness companion.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginImage && (
            <Image
                src={loginImage.imageUrl}
                alt="Serene background"
                fill
                className="object-cover"
                data-ai-hint={loginImage.imageHint}
            />
        )}
         <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-60%"></div>
         <div className="absolute bottom-0 left-0 p-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">"A mirror, a coach, a future interface."</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Hugfeed has transformed how I understand and nurture my emotional well-being. It's more than an app; it's a daily ritual of self-discovery.</p>
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
