import {
  collection,
  doc,
  getDocs,
  getDoc,
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
    { name: 'audit_logs', data: sources.auditLogs }
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

