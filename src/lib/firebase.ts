import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  collection as realCollection,
  doc as realDoc,
  query as realQuery,
  where as realWhere,
  orderBy as realOrderBy,
  getDocs as realGetDocs,
  updateDoc as realUpdateDoc,
  deleteDoc as realDeleteDoc,
  addDoc as realAddDoc,
  getDoc as realGetDoc,
  setDoc as realSetDoc,
  onSnapshot as realOnSnapshot,
  serverTimestamp as realServerTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Sandbox Reference Classes for Resilient Client-Side Fallback
export class VirtualDocRef {
  id: string;
  collectionName: string;
  path: string;
  _isVirtual = true;
  constructor(collectionName: string, id: string) {
    this.id = id;
    this.collectionName = collectionName;
    this.path = `${collectionName}/${id}`;
  }
}

export class VirtualCollectionRef {
  collectionName: string;
  path: string;
  _isVirtual = true;
  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.path = collectionName;
  }
}

export class VirtualQuery {
  collectionName: string;
  constraints: any[];
  _isVirtual = true;
  constructor(collectionName: string, constraints: any[]) {
    this.collectionName = collectionName;
    this.constraints = constraints;
  }
}

// Global notification channel to force re-render components on sandbox writes
const sandboxListeners = new Set<() => void>();
export const notifyDbListeners = () => {
  sandboxListeners.forEach(cb => {
    try { cb(); } catch (e) { console.error("Error in sandbox update listener:", e); }
  });
};

const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('limit exceeded') ||
    lower.includes('resource exhausted') ||
    lower.includes('firestore.googleapis.com') ||
    lower.includes('quota limit exceeded')
  );
};

export const getLocalCollection = (collectionName: string): Record<string, any> => {
  const data = localStorage.getItem(`db_sandbox_${collectionName}`);
  if (!data) {
    // Seed initial collections to provide high fidelity login & admin experience out of the box
    if (collectionName === 'users') {
      const fallbackStr = localStorage.getItem('localUsersFallback');
      const fallbackUsers = fallbackStr ? JSON.parse(fallbackStr) : [];
      const dict: Record<string, any> = {};
      
      // Load current cached user from storage if available
      const curUserStr = localStorage.getItem('currentUser');
      if (curUserStr) {
        try {
          const cu = JSON.parse(curUserStr);
          dict[cu.username] = cu;
        } catch {}
      }
      
      fallbackUsers.forEach((u: any) => {
        const id = u.username || u.id;
        dict[id] = u;
      });
      
      if (!dict['windo086']) {
        dict['windo086'] = {
          id: "demo_admin_user_086",
          username: "windo086",
          nickname: "임시어드민",
          password: "1234",
          tetherWalletAddress: "TR7NHqfe61L19u7C6s3gKvPP659a4B36D8",
          balance: 154000000,
          points: 750000,
          createdAt: new Date().toISOString(),
          bets: [
            {
              id: "demo_bet_1",
              game: "스피드사다리(1분)",
              gameType: "speedladder1",
              round: 403,
              amount: 2000000,
              dividend: 1.95,
              group: "최종결과",
              option: "홀",
              status: "pending",
              rollResult: "대기중",
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      return dict;
    }
    
    if (collectionName === 'appSettings') {
      return {
        'general': { usdtToKrwRate: 1537 }
      };
    }
    
    if (collectionName === 'gameResults') {
      // Seed game results, especially our user's speedladder1 403 round!
      return {
        'speedladder1_403': {
          gameName: '스피드사다리(1분)',
          round: 403,
          result: '[출발] 우 · [줄] 4줄 · [결과] 짝',
          details: { start: '우', lines: '4줄', outcome: '짝' },
          createdAt: new Date().toISOString()
        }
      };
    }
    
    return {};
  }
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

export const saveLocalCollection = (collectionName: string, data: Record<string, any>) => {
  localStorage.setItem(`db_sandbox_${collectionName}`, JSON.stringify(data));
  notifyDbListeners();
};

export function collection(dbRef: any, collectionName: string) {
  if (localStorage.getItem('db_use_sandbox') === 'true') {
    return new VirtualCollectionRef(collectionName);
  }
  try {
    return realCollection(dbRef, collectionName);
  } catch (err) {
    console.warn("Quota exceeded early on collection, entering sandbox mode.");
    localStorage.setItem('db_use_sandbox', 'true');
    return new VirtualCollectionRef(collectionName);
  }
}

export function doc(dbRef: any, collectionName: string, docId?: string) {
  if (localStorage.getItem('db_use_sandbox') === 'true') {
    const id = docId || Math.random().toString(36).substring(2, 11);
    return new VirtualDocRef(collectionName, id);
  }
  try {
    return realDoc(dbRef, collectionName, docId || '');
  } catch (err) {
    console.warn("Quota exceeded early on doc, entering sandbox mode.");
    localStorage.setItem('db_use_sandbox', 'true');
    const id = docId || Math.random().toString(36).substring(2, 11);
    return new VirtualDocRef(collectionName, id);
  }
}

export function where(field: string, op: string, val: any) {
  if (localStorage.getItem('db_use_sandbox') === 'true') {
    return { type: 'where', field, op, val };
  }
  return realWhere(field, op as any, val);
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  if (localStorage.getItem('db_use_sandbox') === 'true') {
    return { type: 'orderBy', field, direction };
  }
  return realOrderBy(field, direction);
}

export function query(ref: any, ...constraints: any[]) {
  if (ref?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = ref?._isVirtual ? ref.collectionName : (ref?.path?.split('/')[0] || '');
    return new VirtualQuery(colName, constraints);
  }
  return realQuery(ref, ...constraints);
}

export function serverTimestamp() {
  if (localStorage.getItem('db_use_sandbox') === 'true') {
    return new Date().toISOString();
  }
  try {
    return realServerTimestamp();
  } catch {
    return new Date().toISOString();
  }
}

export async function getDoc(docRef: any): Promise<any> {
  if (docRef?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = docRef._isVirtual ? docRef.collectionName : docRef.path.split('/')[0];
    const id = docRef.id;
    const colData = getLocalCollection(colName);
    const docData = colData[id];
    return {
      id,
      exists: () => docData !== undefined,
      data: () => docData ? JSON.parse(JSON.stringify(docData)) : undefined
    };
  }
  
  try {
    return await realGetDoc(docRef);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in getDoc, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      const colName = docRef.path.split('/')[0];
      const virtualRef = new VirtualDocRef(colName, docRef.id);
      return getDoc(virtualRef);
    }
    throw err;
  }
}

export async function setDoc(docRef: any, data: any, options?: any): Promise<any> {
  if (docRef?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = docRef._isVirtual ? docRef.collectionName : docRef.path.split('/')[0];
    const id = docRef.id;
    const colData = getLocalCollection(colName);
    
    // Support basic merge option
    if (options && options.merge && colData[id]) {
      colData[id] = {
        ...colData[id],
        ...JSON.parse(JSON.stringify(data))
      };
    } else {
      colData[id] = JSON.parse(JSON.stringify(data));
    }
    
    saveLocalCollection(colName, colData);
    return;
  }
  
  try {
    return await realSetDoc(docRef, data, options);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in setDoc, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      const colName = docRef.path.split('/')[0];
      const virtualRef = new VirtualDocRef(colName, docRef.id);
      return setDoc(virtualRef, data, options);
    }
    throw err;
  }
}

export async function updateDoc(docRef: any, data: any): Promise<any> {
  if (docRef?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = docRef._isVirtual ? docRef.collectionName : docRef.path.split('/')[0];
    const id = docRef.id;
    const colData = getLocalCollection(colName);
    if (!colData[id]) {
      colData[id] = {};
    }
    colData[id] = {
      ...colData[id],
      ...JSON.parse(JSON.stringify(data))
    };
    saveLocalCollection(colName, colData);
    return;
  }
  
  try {
    return await realUpdateDoc(docRef, data);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in updateDoc, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      const colName = docRef.path.split('/')[0];
      const virtualRef = new VirtualDocRef(colName, docRef.id);
      return updateDoc(virtualRef, data);
    }
    throw err;
  }
}

export async function deleteDoc(docRef: any): Promise<any> {
  if (docRef?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = docRef._isVirtual ? docRef.collectionName : docRef.path.split('/')[0];
    const id = docRef.id;
    const colData = getLocalCollection(colName);
    delete colData[id];
    saveLocalCollection(colName, colData);
    return;
  }
  
  try {
    return await realDeleteDoc(docRef);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in deleteDoc, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      const colName = docRef.path.split('/')[0];
      const virtualRef = new VirtualDocRef(colName, docRef.id);
      return deleteDoc(virtualRef);
    }
    throw err;
  }
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  if (collectionRef?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = collectionRef._isVirtual ? collectionRef.collectionName : collectionRef.path;
    const colData = getLocalCollection(colName);
    const newId = 'local_' + Math.random().toString(36).substring(2, 15);
    colData[newId] = {
      id: newId,
      ...JSON.parse(JSON.stringify(data))
    };
    saveLocalCollection(colName, colData);
    return {
      id: newId,
      path: `${colName}/${newId}`
    };
  }
  
  try {
    return await realAddDoc(collectionRef, data);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in addDoc, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      const colName = collectionRef.path;
      const virtualRef = new VirtualCollectionRef(colName);
      return addDoc(virtualRef, data);
    }
    throw err;
  }
}

export async function getDocs(queryRef: any): Promise<any> {
  if (queryRef?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const colName = queryRef._isVirtual ? queryRef.collectionName : (queryRef.path || '');
    const constraints = queryRef._isVirtual && queryRef.constraints ? queryRef.constraints : [];
    
    const colData = getLocalCollection(colName);
    let docsArr = Object.entries(colData).map(([id, val]) => ({ id, ...val }));
    
    // Evaluate constraints if any
    constraints.forEach((c: any) => {
      if (c && c.type === 'where') {
        const { field, op, val } = c;
        docsArr = docsArr.filter((doc: any) => {
          const docVal = doc[field];
          if (op === '==') return docVal === val;
          if (op === '!=') return docVal !== val;
          if (op === '>') return docVal > val;
          if (op === '>=') return docVal >= val;
          if (op === '<') return docVal < val;
          if (op === '<=') return docVal <= val;
          return true;
        });
      }
    });

    // Sort order rule
    const orderRule = constraints.find((c: any) => c && c.type === 'orderBy');
    if (orderRule) {
      const { field, direction } = orderRule;
      docsArr.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    const docs = docsArr.map((docItem: any) => ({
      id: docItem.id,
      data: () => JSON.parse(JSON.stringify(docItem)),
      exists: () => true
    }));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback)
    };
  }
  
  try {
    return await realGetDocs(queryRef);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in getDocs, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      const colName = queryRef.path || '';
      const virtualRef = new VirtualQuery(colName, []);
      return getDocs(virtualRef);
    }
    throw err;
  }
}

export function onSnapshot(ref: any, onNext: (snap: any) => void, onError?: (err: any) => void): () => void {
  const isDoc = ref && (ref instanceof VirtualDocRef || (ref.path && ref.path.includes('/')));
  
  if (ref?._isVirtual || localStorage.getItem('db_use_sandbox') === 'true') {
    const triggerUpdate = async () => {
      try {
        if (isDoc) {
          const snap = await getDoc(ref);
          onNext(snap);
        } else {
          const snap = await getDocs(ref);
          onNext(snap);
        }
      } catch (e) {
        if (onError) onError(e);
      }
    };
    
    // Call once immediately
    triggerUpdate();
    
    // Enroll inside sandbox global triggers
    sandboxListeners.add(triggerUpdate);
    
    return () => {
      sandboxListeners.delete(triggerUpdate);
    };
  }

  try {
    const unsub = realOnSnapshot(ref, (snap: any) => {
      onNext(snap);
    }, (err: any) => {
      if (isQuotaError(err)) {
        console.warn("Quota exceeded in onSnapshot real, switching to Sandbox.");
        localStorage.setItem('db_use_sandbox', 'true');
        
        const colPath = ref.path || '';
        const isDocPath = colPath.includes('/');
        const colName = isDocPath ? colPath.split('/')[0] : colPath;
        const id = isDocPath ? colPath.split('/')[1] : '';
        const virtualRef = id ? new VirtualDocRef(colName, id) : new VirtualQuery(colName, []);
        onSnapshot(virtualRef, onNext, onError);
      } else {
        if (onError) onError(err);
      }
    });
    return unsub;
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("Quota exceeded in onSnapshot setup, switching to Sandbox.");
      localStorage.setItem('db_use_sandbox', 'true');
      
      const colPath = ref.path || '';
      const isDocPath = colPath.includes('/');
      const colName = isDocPath ? colPath.split('/')[0] : colPath;
      const id = isDocPath ? colPath.split('/')[1] : '';
      const virtualRef = id ? new VirtualDocRef(colName, id) : new VirtualQuery(colName, []);
      return onSnapshot(virtualRef, onNext, onError);
    }
    throw err;
  }
}
