import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function run() {
  const configFile = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
  const app = initializeApp(configFile);
  const db = getFirestore(app, configFile.firestoreDatabaseId);

  const q = query(collection(db, 'matches'), limit(100));
  const snap = await getDocs(q);
  const matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const leagues = new Set(matches.map((m: any) => m.league));
  console.log(`FOUND ${matches.length} matches`);
  console.log(`Distinct leagues:`, Array.from(leagues));
}

run().catch(console.error);
