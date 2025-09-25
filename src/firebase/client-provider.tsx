
'use client';

import {useEffect, useState} from 'react';
import {FirebaseProvider} from './provider';
import {initializeFirebase} from './index';

export function FirebaseClientProvider({children}: {children: React.ReactNode}) {
  const [firebaseInstances, setFirebaseInstances] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    const instances = initializeFirebase();
    setFirebaseInstances(instances);
  }, []);

  if (!firebaseInstances) {
    return null; // or a loading spinner
  }

  return <FirebaseProvider value={firebaseInstances}>{children}</FirebaseProvider>;
}
