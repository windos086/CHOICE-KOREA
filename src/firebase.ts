import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "gen-lang-client-0846967003",
  appId: "1:230268211245:web:61532eab5777b9b9d868a4",
  apiKey: "AIzaSyDC4TCYHVr9Mw23UZmF2LqkEpgbg7fjHio",
  authDomain: "gen-lang-client-0846967003.firebaseapp.com",
  storageBucket: "gen-lang-client-0846967003.firebasestorage.app",
  messagingSenderId: "230268211245"
};

let app;
let db: any;
let auth: any;
let storage: any;
let firebaseAvailable = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // Safe initialization with experimentalForceLongPolling to pass smoothly through reverse-proxy sandboxes
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, "ai-studio-b5236bbb-f6e1-4e44-90d0-27290bc07c2e");
  auth = getAuth(app);
  storage = getStorage(app, "gs://gen-lang-client-0846967003.firebasestorage.app");
  firebaseAvailable = true;

  console.log("Firebase initialized successfully with dynamic Database ID and forceLongPolling wrapper");
} catch (error) {
  console.warn("First attempt failed, retrying legacy fallback...", error);
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, "ai-studio-b5236bbb-f6e1-4e44-90d0-27290bc07c2e");
    auth = getAuth(app);
    storage = getStorage(app, "gs://gen-lang-client-0846967003.firebasestorage.app");
    firebaseAvailable = true;
  } catch (fallbackError) {
    console.warn("Firebase is not available or blocked in current iframe. Switching to Local Dual Engine.", fallbackError);
    db = null;
    auth = null;
    storage = null;
    firebaseAvailable = false;
  }
}

export { db, auth, storage, firebaseAvailable };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

