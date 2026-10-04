import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { LocalStoreDB } from './fallbackStore.ts';
import { getLocalStoreDB, saveLocalStoreDB, normalizeFullStoreDB } from './fallbackStore.ts';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const GLOBAL_STORE_DOC = doc(firestoreDb, 'store', 'global');

let cloudCache: LocalStoreDB | null = null;
let isInitialized = false;

export async function fetchCloudStoreDB(): Promise<LocalStoreDB> {
  try {
    const snap = await getDoc(GLOBAL_STORE_DOC);
    if (snap.exists()) {
      const rawData = snap.data() as LocalStoreDB;
      const normalized = normalizeFullStoreDB(rawData);
      cloudCache = normalized;
      saveLocalStoreDB(normalized);
      return normalized;
    } else {
      // Seed central Firestore document with initial Khojau store data if not created yet
      const seed = getLocalStoreDB();
      await setDoc(GLOBAL_STORE_DOC, JSON.parse(JSON.stringify(seed)));
      cloudCache = seed;
      return seed;
    }
  } catch (err) {
    console.warn('Cloud DB fetch fallback:', err);
    return cloudCache || getLocalStoreDB();
  }
}

export async function saveCloudStoreDB(dbToSave: LocalStoreDB): Promise<LocalStoreDB> {
  const normalized = normalizeFullStoreDB(dbToSave);
  cloudCache = normalized;
  saveLocalStoreDB(normalized);
  try {
    const cleanPayload = JSON.parse(JSON.stringify({
      ...normalized,
      updatedAt: Date.now()
    }));
    await setDoc(GLOBAL_STORE_DOC, cleanPayload);
  } catch (err) {
    console.warn('Failed to write to cloud DB:', err);
  }
  return normalized;
}

export function subscribeToCloudStore(onUpdate: (db: LocalStoreDB) => void): () => void {
  try {
    return onSnapshot(
      GLOBAL_STORE_DOC,
      (snap) => {
        if (snap.exists()) {
          const normalized = normalizeFullStoreDB(snap.data() as LocalStoreDB);
          cloudCache = normalized;
          saveLocalStoreDB(normalized);
          onUpdate(normalized);
        } else if (!isInitialized) {
          isInitialized = true;
          const seed = getLocalStoreDB();
          setDoc(GLOBAL_STORE_DOC, JSON.parse(JSON.stringify({ ...seed, updatedAt: Date.now() }))).catch(() => {});
        }
      },
      (err) => {
        console.warn('Realtime cloud listener warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}
