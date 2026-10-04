import {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  getCountFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  limit,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Strips undefined values from objects recursively because Firestore rejects undefined.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return data;
}

/**
 * Subscribe to real-time changes on a Firestore collection.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id
          } as T;
        });
        onData(items);
      },
      (error) => {
        console.error(`[Firestore] Error in snapshot listener for "${collectionName}":`, error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error(`[Firestore] Failed to set up snapshot for "${collectionName}":`, err);
    return () => {};
  }
}

/**
 * Save a document with a specified ID (creates or overwrites/merges).
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T,
  merge: boolean = true
): Promise<void> {
  try {
    const cleanData = sanitizeForFirestore(item);
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, cleanData, { merge });
  } catch (error) {
    console.error(`[Firestore] Error saving document to ${collectionName}/${item.id}:`, error);
    throw error;
  }
}

/**
 * Update specific fields in an existing document.
 */
export async function updateDocument(
  collectionName: string,
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  try {
    const cleanUpdates = sanitizeForFirestore(updates);
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    console.error(`[Firestore] Error updating document ${collectionName}/${id}:`, error);
    throw error;
  }
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`[Firestore] Error deleting document ${collectionName}/${id}:`, error);
    throw error;
  }
}

/**
 * Batch save multiple documents (up to 500 per batch).
 */
export async function batchSaveDocuments<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (items.length === 0) return;
  
  try {
    // Firestore batch limit is 500 operations
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += 400) {
      chunks.push(items.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const item of chunk) {
        const cleanData = sanitizeForFirestore(item);
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, cleanData, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error(`[Firestore] Error batch saving documents to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Batch delete multiple documents.
 */
export async function batchDeleteDocuments(
  collectionName: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;

  try {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 400) {
      chunks.push(ids.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const id of chunk) {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      }
      await batch.commit();
    }
  } catch (error) {
    console.error(`[Firestore] Error batch deleting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Check if a collection is empty.
 */
export async function isCollectionEmpty(collectionName: string): Promise<boolean> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.warn(`[Firestore] Error checking if collection ${collectionName} is empty:`, error);
    return true; // assume empty on error so initialization can attempt
  }
}

/**
 * Fetch all documents in a collection once.
 */
export async function getCollectionOnce<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as T));
  } catch (error) {
    console.error(`[Firestore] Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Checks Firestore collections on app startup.
 * If a collection is empty, populates it from existing localStorage/initial data.
 * Does NOT overwrite existing records.
 */
export async function migrateAndSeedFirestore(sources: {
  products: { id: string; [key: string]: any }[];
  doctors: { id: string; [key: string]: any }[];
  reps: { id: string; [key: string]: any }[];
  retailCounters: { id: string; [key: string]: any }[];
  visits: { id: string; [key: string]: any }[];
  orders: { id: string; [key: string]: any }[];
  notifications: { id: string; [key: string]: any }[];
  users: { id: string; [key: string]: any }[];
  auditLogs: { id: string; [key: string]: any }[];
  organizations?: { id: string; [key: string]: any }[];
}): Promise<void> {
  const collectionsToSeed = [
    { name: 'products', data: sources.products },
    { name: 'doctors', data: sources.doctors },
    { name: 'sales_reps', data: sources.reps },
    { name: 'retail_counters', data: sources.retailCounters },
    { name: 'field_visits', data: sources.visits },
    { name: 'orders', data: sources.orders },
    { name: 'notifications', data: sources.notifications },
    { name: 'users', data: sources.users },
    { name: 'audit_logs', data: sources.auditLogs },
    { name: 'organizations', data: sources.organizations || [] }
  ];

  for (const item of collectionsToSeed) {
    try {
      const empty = await isCollectionEmpty(item.name);
      if (empty && item.data && item.data.length > 0) {
        console.log(`[Firestore] Seeding ${item.data.length} records into empty "${item.name}" collection...`);
        await batchSaveDocuments(item.name, item.data);
      }
    } catch (err) {
      console.warn(`[Firestore] Could not verify/seed "${item.name}":`, err);
    }
  }
}

export interface FirestoreConnectionResult {
  connected: boolean;
  latencyMs: number;
  databaseId: string;
  projectId: string;
  error?: string;
  consoleUrl: string;
}

/**
 * Validates connection directly with the Google Cloud Firestore server.
 * Uses getDocFromServer as mandated by the Firebase Skill.
 */
export async function testFirestoreConnection(): Promise<FirestoreConnectionResult> {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const projectId = firebaseConfig.projectId;
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/data`;

  const startTime = performance.now();
  try {
    // Attempt ping to Firestore connection test document
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      connected: true,
      latencyMs,
      databaseId,
      projectId,
      consoleUrl
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // In Firestore, if a document doesn't exist, getDocFromServer succeeds with snapshot.exists() === false.
    // An error is only thrown on actual network/offline or security rule rejection.
    // If the error is permission-denied or offline, report it accurately.
    if (errorMsg.includes('the client is offline')) {
      return {
        connected: false,
        latencyMs,
        databaseId,
        projectId,
        error: 'Client is offline. Please check your internet connection or Firebase setup.',
        consoleUrl
      };
    }

    // If permission or other non-fatal test doc error, test with a public collection read check
    try {
      const q = query(collection(db, 'products'), limit(1));
      await getDocs(q);
      return {
        connected: true,
        latencyMs: Math.round(performance.now() - startTime),
        databaseId,
        projectId,
        consoleUrl
      };
    } catch (fallbackError) {
      return {
        connected: false,
        latencyMs,
        databaseId,
        projectId,
        error: errorMsg,
        consoleUrl
      };
    }
  }
}

export interface CollectionStat {
  name: string;
  count: number;
  status: 'synced' | 'empty';
}

/**
 * Retrieves live document counts directly from Firestore server for key collections.
 */
export async function getFirestoreLiveStatus(): Promise<{
  connected: boolean;
  databaseId: string;
  projectId: string;
  consoleUrl: string;
  collections: CollectionStat[];
}> {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const projectId = firebaseConfig.projectId;
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/data`;

  const collectionNames = [
    'products',
    'doctors',
    'sales_reps',
    'retail_counters',
    'field_visits',
    'orders',
    'organizations',
    'audit_logs',
    'notifications'
  ];

  const results: CollectionStat[] = [];
  let isConnected = true;

  for (const name of collectionNames) {
    try {
      const colRef = collection(db, name);
      const snapshot = await getCountFromServer(colRef);
      const count = snapshot.data().count;
      results.push({
        name,
        count,
        status: count > 0 ? 'synced' : 'empty'
      });
    } catch {
      // Fallback with regular getDocs if count aggregation is restricted
      try {
        const q = query(collection(db, name), limit(50));
        const snap = await getDocs(q);
        results.push({
          name,
          count: snap.size,
          status: snap.size > 0 ? 'synced' : 'empty'
        });
      } catch {
        isConnected = false;
        results.push({
          name,
          count: 0,
          status: 'empty'
        });
      }
    }
  }

  return {
    connected: isConnected,
    databaseId,
    projectId,
    consoleUrl,
    collections: results
  };
}

