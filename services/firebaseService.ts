
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, Auth, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, Firestore, Unsubscribe } from "firebase/firestore";
import { Project } from "../types";

let fbApp: FirebaseApp | null = null;
let fbAuth: Auth | null = null;
let fbDb: Firestore | null = null;
let isEnabled = false;

// @ts-ignore - Assuming __app_id is injected globally
const appId = (window as any).__app_id || 'construction-budget-pro-v2';

// Helper to retrieve Firebase config from global scope
const getFirebaseConfig = () => {
  try {
    // @ts-ignore
    const config = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    if (!config) return null;
    return typeof config === 'string' ? JSON.parse(config) : config;
  } catch (e) {
    return null;
  }
};

/**
 * Initializes Firebase and signs in anonymously
 */
export const initializeFirebase = async (): Promise<User | null> => {
  const fbConfig = getFirebaseConfig();
  if (fbConfig && fbConfig.apiKey && fbConfig.apiKey !== "undefined") {
    try {
      fbApp = initializeApp(fbConfig);
      fbAuth = getAuth(fbApp);
      fbDb = getFirestore(fbApp);
      isEnabled = true;
      const userCred = await signInAnonymously(fbAuth);
      return userCred.user;
    } catch (e) {
      console.error("Firebase init failed", e);
    }
  }
  return null;
};

/**
 * Checks if Firebase service is active
 */
export const isFirebaseActive = () => isEnabled;

/**
 * Saves current project list to Firestore
 */
export const saveToCloud = async (projects: Project[]): Promise<void> => {
  if (!isEnabled || !fbDb) return;
  const ref = doc(fbDb, 'artifacts', appId, 'public', 'data', 'projects', 'main');
  await setDoc(ref, { list: projects, updatedAt: new Date().toISOString() });
};

/**
 * Listens for real-time updates from Firestore
 */
export const listenToCloud = (onData: (data: Project[]) => void, onError: (err: any) => void): Unsubscribe => {
  if (!isEnabled || !fbDb) return () => {};
  const ref = doc(fbDb, 'artifacts', appId, 'public', 'data', 'projects', 'main');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      onData(snap.data().list || []);
    }
  }, onError);
};
