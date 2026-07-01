import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const REQUIRED_FIREBASE_KEYS = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
] as const;

let app: FirebaseApp | null = null;

function hasRequiredFirebaseConfig() {
  return REQUIRED_FIREBASE_KEYS.every((key) => Boolean(firebaseConfig[key]));
}

export function isFirebaseConfigured() {
  return hasRequiredFirebaseConfig();
}

function getFirebaseApp(): FirebaseApp | null {
  if (!hasRequiredFirebaseConfig()) {
    return null;
  }

  if (app) {
    return app;
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return app;
}

function requireFirebaseApp(): FirebaseApp {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, and NEXT_PUBLIC_FIREBASE_APP_ID."
    );
  }

  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  return getAuth(requireFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(requireFirebaseApp());
}

export const initAnalytics = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  const supported = await isSupported();
  return supported ? getAnalytics(firebaseApp) : null;
};

export { getFirebaseApp };
