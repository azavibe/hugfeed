

'use client';
import * as React from 'react';


import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export function UserNav() {
  const { user } = useUser();
  return (
    <nav className="flex items-center gap-2">
      <SignedIn>
        <UserButton />
        <span className="ml-2 font-medium">{user?.fullName || user?.username || 'User'}</span>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="border px-4 py-2 rounded">Login / Sign Up</button>
        </SignInButton>
      </SignedOut>
    </nav>
  );
}
