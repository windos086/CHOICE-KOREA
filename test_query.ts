import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function run() {
  const configFile = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
  const app = initializeApp(configFile);
  const db = getFirestore(app, configFile.firestoreDatabaseId);

  const snap = await getDocs(collection(db, 'matches'));
  const matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  console.log(`FOUND ${matches.length} matches`);
  matches.forEach((m: any) => {
    const handis = m.markets?.handicaps || [];
    console.log(`Match: ${m.homeTeam} vs ${m.awayTeam} | League: ${m.league} | Handicaps:`, handis.map((h: any) => h.value));
  });
}

run().catch(console.error);
