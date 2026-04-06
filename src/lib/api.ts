import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDocs,
  Timestamp,
  getDocFromServer
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Candidate, DailyLead } from "../types";

enum OperationType {
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
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
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function checkConfig(): Promise<{ googleSheetId: boolean; googleServiceAccountEmail: boolean; googlePrivateKey: boolean }> {
  const response = await fetch("/api/config-status");
  if (!response.ok) throw new Error("Failed to check configuration");
  return response.json();
}

export async function addCandidate(candidate: Omit<Candidate, "id">): Promise<void> {
  const path = 'candidates';
  try {
    await addDoc(collection(db, path), {
      ...candidate,
      recruiterUid: auth.currentUser?.uid,
      createdAt: Timestamp.now(),
    });

    // Optional: Keep Google Sheets sync via proxy
    try {
      await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      });
    } catch (e) {
      console.warn("Google Sheets sync failed, but Firestore succeeded:", e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<void> {
  const path = `candidates/${id}`;
  try {
    const docRef = doc(db, 'candidates', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // Optional: Keep Google Sheets sync
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn("Google Sheets sync failed, but Firestore succeeded:", e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCandidate(id: string): Promise<void> {
  const path = `candidates/${id}`;
  try {
    const docRef = doc(db, 'candidates', id);
    await deleteDoc(docRef);

    // Optional: Keep Google Sheets sync
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Google Sheets sync failed, but Firestore succeeded:", e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCandidates(
  callback: (candidates: Candidate[]) => void,
  recruiterUid?: string
): () => void {
  const path = 'candidates';
  const candidatesRef = collection(db, path);
  
  let q = query(candidatesRef, orderBy("date", "desc"));
  
  if (recruiterUid) {
    q = query(candidatesRef, where("recruiterUid", "==", recruiterUid), orderBy("date", "desc"));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const candidates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Candidate));
    callback(candidates);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });

  return unsubscribe;
}

export async function addDailyLead(lead: Omit<DailyLead, "id">): Promise<void> {
  const path = 'dailyLeads';
  try {
    await addDoc(collection(db, path), {
      ...lead,
      recruiterUid: auth.currentUser?.uid,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToDailyLeads(
  callback: (leads: DailyLead[]) => void,
  recruiterUid?: string
): () => void {
  const path = 'dailyLeads';
  const leadsRef = collection(db, path);
  
  let q = query(leadsRef, orderBy("date", "desc"));
  
  if (recruiterUid) {
    q = query(leadsRef, where("recruiterUid", "==", recruiterUid), orderBy("date", "desc"));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DailyLead));
    callback(leads);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });

  return unsubscribe;
}
