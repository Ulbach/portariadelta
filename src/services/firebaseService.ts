import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  doc,
  serverTimestamp,
  Timestamp,
  getDocFromServer,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import { Partner, AttendanceRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('[Firebase Error Detail]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('[Firebase] Sign-in error:', error);
    return null;
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('[Firebase] Sign-out error:', error);
  }
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Ensure connection and database existence
export async function testConnection() {
  try {
    console.log('[Firebase] Testing context:', {
      projectId: db.app.options.projectId,
      databaseId: db.app.options.storageBucket?.split('.')[0] || 'unknown'
    });
    // Try to fetch one company to verify connection and rules
    const q = query(collection(db, 'companies'), limit(1));
    await getDocs(q);
    console.log('[Firebase] Connection test triggered successfully.');
  } catch (error: any) {
    console.error('[Firebase] Connection test error:', error.code, error.message);
    if(error.message.includes('the client is offline')) {
      console.warn("Firestore reports client is offline. This might be a transient network issue or invalid configuration.");
    }
  }
}

// Function to seed initial data if empty
export async function seedInitialDataIfEmpty() {
  try {
    const companies = await fetchCompanies();
    if (companies.length === 0) {
      console.log('[Firebase] Database empty, seeding initial data...');
      const batch = writeBatch(db);
      
      const initialCompanies = ['TecmiSul', 'HBR', 'MAX'];
      for (const name of initialCompanies) {
        batch.set(doc(collection(db, 'companies')), { name, status: 'Ativa' });
      }
      
      const initialPartners = [
        { name: 'Fabricio Ulbach', company: 'TecmiSul', status: 'Ativo' },
        { name: 'Joao Silva', company: 'HBR', status: 'Ativo' },
        { name: 'Marina Souza', company: 'MAX', status: 'Ativo' }
      ];
      for (const partner of initialPartners) {
        batch.set(doc(collection(db, 'partners')), partner);
      }
      
      await batch.commit();
      console.log('[Firebase] Seeding completed.');
    }
  } catch (error) {
    console.error('[Firebase] Seeding failed:', error);
  }
}

import { Company } from '../types';

export async function fetchCompanies(): Promise<Company[]> {
  const path = 'companies';
  try {
    console.log('[Firebase] Attempting to fetch companies from path:', path, 'on db:', (db as any)._databaseId?.database || 'default');
    const q = query(collection(db, path), orderBy('name'));
    const snapshot = await getDocs(q);
    console.log('[Firebase] Successfully fetched', snapshot.size, 'companies.');
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Company));
  } catch (error) {
    console.error('[Firebase] Error fetching companies:', error);
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addCompany(name: string): Promise<boolean> {
  const path = 'companies';
  try {
    await addDoc(collection(db, path), { name, status: 'Ativa' });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function updateCompany(id: string, data: Partial<Omit<Company, 'id'>>): Promise<boolean> {
  const path = `companies/${id}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'companies', id), data);
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchPartners(companyName?: string): Promise<Partner[]> {
  const path = 'partners';
  try {
    let q = query(collection(db, path));
    if (companyName) {
      q = query(collection(db, path), where('company', '==', companyName));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      ...d.data(),
      id: d.id
    } as Partner));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function fetchAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const path = 'attendance_records';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        timestamp: (data.timestamp as Timestamp).toDate()
      } as AttendanceRecord;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function appendRecord(partner: { name: string, company: string }, type: 'ENTRY' | 'EXIT'): Promise<boolean> {
  const path = 'attendance_records';
  try {
    await addDoc(collection(db, path), {
      partnerName: partner.name,
      company: partner.company,
      type: type,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function clearAllRecords(): Promise<boolean> {
  const path = 'attendance_records';
  try {
    const snapshot = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function addPartner(partner: Omit<Partner, 'id'>): Promise<string | null> {
  const path = 'partners';
  try {
    const docRef = await addDoc(collection(db, path), partner);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function bulkAddPartners(partners: Omit<Partner, 'id'>[]): Promise<boolean> {
  const path = 'partners';
  try {
    // Firestore batch limit is 500
    const chunkSize = 400;
    for (let i = 0; i < partners.length; i += chunkSize) {
      const chunk = partners.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(p => {
        const docRef = doc(collection(db, path));
        batch.set(docRef, p);
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}
