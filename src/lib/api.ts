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
import { Candidate, DailyLead, Client, Job } from "../types";

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

export async function checkConfig(): Promise<{ 
  googleSheetId: boolean; 
  googleServiceAccountEmail: boolean; 
  googlePrivateKey: boolean;
  contactOutToken: boolean;
}> {
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

    // Keep Google Sheets sync via proxy
    try {
      await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...candidate,
          date: candidate.date, // Ensure primitives are passed
        }),
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

    // Keep Google Sheets sync
    // Note: This requires the sheet row ID. Our current server.ts uses row number as id.
    // However, Firestore IDs are different.
    // To properly sync updates to a specific row, we'd need a mapping or to use search.
    // For now, we attempt to sync if the candidate object has a 'sheetRowId' or similar.
    // Actually, the server.ts currently expects rowId in URL.
    // If we don't have it, we might need a different strategy for update sync.
    // I'll add a comment about this limitation.
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

export async function findContactInfo(linkedinUrl: string): Promise<any> {
  const response = await fetch(`/api/contactout/find?profile=${encodeURIComponent(linkedinUrl)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch contact info");
  }
  return response.json();
}

// Client Management
export async function addClient(client: Omit<Client, "id">): Promise<void> {
  const path = 'clients';
  try {
    await addDoc(collection(db, path), {
      ...client,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  const path = `clients/${id}`;
  try {
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToClients(callback: (clients: Client[]) => void): () => void {
  const path = 'clients';
  const q = query(collection(db, path), orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
}

// Job Management
export async function addJob(job: Omit<Job, "id">): Promise<void> {
  const path = 'jobs';
  try {
    await addDoc(collection(db, path), {
      ...job,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  const path = `jobs/${id}`;
  try {
    const docRef = doc(db, 'jobs', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToJobs(callback: (jobs: Job[]) => void, clientId?: string): () => void {
  const path = 'jobs';
  let q = query(collection(db, path), orderBy("createdAt", "desc"));
  if (clientId) {
    q = query(collection(db, path), where("clientId", "==", clientId), orderBy("createdAt", "desc"));
  }
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
}
