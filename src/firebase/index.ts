
import {initializeApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';

import {firebaseConfig} from './config';

export * from './provider';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  console.log('Attempting to initialize Firebase...');
  if (getApps().length === 0) {
    if (!firebaseConfig.projectId) {
      console.error("Firebase config is not set. Please check your .env file.");
      // @ts-ignore
      return {};
    }
    console.log('Firebase config loaded:', firebaseConfig);
    try {
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
      console.log('Firebase initialized successfully:', {
        app: firebaseApp.name,
        auth: auth.app.name,
        firestore: firestore.app.name,
      });
    } catch (error) {
      console.error('Error during Firebase initialization:', error);
    }
  } else {
    // On subsequent loads (like in Next.js hot-reloading), get the existing instances.
    firebaseApp = getApps()[0];
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    console.log('Using existing Firebase instances.');
  }
  return {firebaseApp, auth, firestore};
}

export {initializeFirebase};
