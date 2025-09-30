
import {initializeApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';

import {firebaseConfig} from './config';

export * from './provider';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  if (getApps().length === 0) {
    if (!firebaseConfig.projectId) {
      console.error("Firebase config is not set. Please check your .env file.");
      // @ts-ignore
      return {};
    }
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    // Connect to the specific 'hugfeeddb' database
    firestore = getFirestore(firebaseApp);
  } else {
    // On subsequent loads (like in Next.js hot-reloading), get the existing instances.
    firebaseApp = getApps()[0];
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return {firebaseApp, auth, firestore};
}

export {initializeFirebase};
