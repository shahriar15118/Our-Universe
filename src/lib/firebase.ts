import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app;
let db: any;
let auth: any;
let storage: any;

export async function initFirebase() {
  if (app) return { db, auth, storage };

  try {
    // @ts-ignore
    const configData = await import('../../firebase-applet-config.json');
    const config = configData.default;
    
    app = initializeApp(config);
    
    // For Firestore, if databaseId is "(default)" or undefined, use default
    const dbId = (config.firestoreDatabaseId === "(default)" || !config.firestoreDatabaseId) 
      ? undefined 
      : config.firestoreDatabaseId;
    
    db = getFirestore(app, dbId);
    auth = getAuth(app);
    storage = getStorage(app);

    console.log("Firebase initialized successfully with project:", config.projectId);
    return { db, auth, storage };
  } catch (e) {
    console.warn("Firebase config not found or invalid. Please set up Firebase.");
    return { db: null, auth: null, storage: null };
  }
}

// For legacy/simple access, we can export the variables but they might be null initially
export { db, auth, storage };
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
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
