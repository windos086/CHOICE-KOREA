import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function run() {
  const configFile = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
  const app = initializeApp(configFile);
  const db = getFirestore(app, configFile.firestoreDatabaseId);

  const snap = await getDocs(collection(db, 'matches'));
  const matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log(`FOUND ${matches.length} matches`);
  matches.slice(0, 10).forEach((m: any) => {
    console.log(`\nMatch: ${m.homeTeam} vs ${m.awayTeam} (${m.dateTime})`);
    console.log(`Markets:`, JSON.stringify(m.markets, null, 2));
  });
}

run().catch(console.error);
