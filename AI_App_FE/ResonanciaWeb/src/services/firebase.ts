import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDJPtNpFNYyI1wt1lu03pnzyqXkyOWumgU',
  authDomain: 'soulmateapp-new.firebaseapp.com',
  projectId: 'soulmateapp-new',
  storageBucket: 'soulmateapp-new.firebasestorage.app',
  messagingSenderId: '601603073289',
  appId: '1:601603073289:web:31a53d6d91e10802e4dfd8',
  measurementId: 'G-2VMC8DRCNB',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export default app;
