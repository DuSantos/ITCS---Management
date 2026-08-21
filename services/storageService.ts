import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Asset, AssetStatus, Company, Location, Subscription, SubscriptionType, Mailbox, SecurityGroupRecord } from '../types';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// --- AUTHENTICATION ---
export const registerUser = async (data: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    return { user: userCredential.user, token: await userCredential.user.getIdToken() };
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const loginUser = async (data: any) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    return { user: userCredential.user, token: await userCredential.user.getIdToken() };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const setupMfa = async (token: string) => {
  throw new Error('MFA setup is not implemented in this Firebase demo');
};

export const verifyMfa = async (token: string, mfaToken: string) => {
  throw new Error('MFA verification is not implemented in this Firebase demo');
};

// --- ERROR HANDLING HELPER ---
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
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- SUBSCRIPTIONS ---
export const getSubscriptions = async (): Promise<{ data: Subscription[], isOffline: boolean }> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'subscriptions'));
    const data = querySnapshot.docs.map(doc => doc.data() as Subscription);
    return { data, isOffline: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'subscriptions');
    return { data: [], isOffline: true };
  }
};

// --- UTILS ---
const removeUndefined = (obj: any) => {
  const result = { ...obj };
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (result[key] !== null && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = removeUndefined(result[key]);
    }
  });
  return result;
};

export const saveSubscription = async (subscription: Subscription): Promise<void> => {
  try {
    await setDoc(doc(db, 'subscriptions', subscription.id), removeUndefined(subscription));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `subscriptions/${subscription.id}`);
  }
};

export const deleteSubscription = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'subscriptions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subscriptions/${id}`);
  }
};

// --- MAILBOXES ---
export const getMailboxes = async (): Promise<{ data: Mailbox[], isOffline: boolean }> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'mailboxes'));
    const data = querySnapshot.docs.map(doc => doc.data() as Mailbox);
    return { data, isOffline: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'mailboxes');
    return { data: [], isOffline: true };
  }
};

export const saveMailbox = async (mailbox: Mailbox): Promise<void> => {
  try {
    await setDoc(doc(db, 'mailboxes', mailbox.id), removeUndefined(mailbox));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `mailboxes/${mailbox.id}`);
  }
};

export const deleteMailbox = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'mailboxes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `mailboxes/${id}`);
  }
};

// --- PERMISSIONS ---
export const getSecurityGroups = async (): Promise<{ data: SecurityGroupRecord[], isOffline: boolean }> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'securityGroups'));
    const data = querySnapshot.docs.map(doc => doc.data() as SecurityGroupRecord);
    return { data, isOffline: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'securityGroups');
    return { data: [], isOffline: true };
  }
};

export const saveSecurityGroup = async (group: SecurityGroupRecord): Promise<void> => {
  try {
    await setDoc(doc(db, 'securityGroups', group.id), removeUndefined(group));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `securityGroups/${group.id}`);
  }
};

export const deleteSecurityGroup = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'securityGroups', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `securityGroups/${id}`);
  }
};

// --- ALUGA RENTALS ---
export const getAlugaRentals = async (): Promise<{ data: Asset[], isOffline: boolean }> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'alugaRentals'));
    const data = querySnapshot.docs.map(doc => doc.data() as Asset);
    return { data, isOffline: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'alugaRentals');
    return { data: [], isOffline: true };
  }
};

export const saveAlugaRental = async (asset: Asset) => {
  try {
    const updatedAsset = { 
      ...asset, 
      lastUpdated: new Date().toISOString() 
    };
    await setDoc(doc(db, 'alugaRentals', asset.id), removeUndefined(updatedAsset));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `alugaRentals/${asset.id}`);
  }
};

export const deleteAlugaRental = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'alugaRentals', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `alugaRentals/${id}`);
  }
};

// --- ASSETS ---
export const getAssets = async (): Promise<{ data: Asset[], isOffline: boolean }> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'assets'));
    const data = querySnapshot.docs.map(doc => doc.data() as Asset);
    return { data, isOffline: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'assets');
    return { data: [], isOffline: true };
  }
};

export const saveAsset = async (asset: Asset): Promise<void> => {
  try {
    const updatedAsset = { 
      ...asset, 
      lastUpdated: new Date().toISOString() 
    };
    await setDoc(doc(db, 'assets', asset.id), removeUndefined(updatedAsset));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `assets/${asset.id}`);
  }
};

export const deleteAsset = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'assets', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `assets/${id}`);
  }
};

export const calculateVat = (valueExVat: number): number => {
  return valueExVat * 1.23; 
};
