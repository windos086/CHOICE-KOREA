const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Analyzing users' bets...");
  const usersSnap = await getDocs(collection(db, 'users'));
  let totalPending = 0;
  for (const uDoc of usersSnap.docs) {
    const uData = uDoc.data();
    if (!uData.bets || uData.bets.length === 0) continue;
    
    console.log(`User: ${uData.email || uDoc.id} (${uData.nickname || 'N/A'}) - Balance: ${uData.balance}`);
    const pendingBets = uData.bets.filter(b => b.status === 'pending' || b.status === '대기중');
    if (pendingBets.length > 0) {
      console.log(`  -> Found ${pendingBets.length} pending bets:`);
      pendingBets.forEach(b => {
        console.log(`     - BetID: ${b.id}, Game: ${b.game}, GameType: ${b.gameType}, Round: ${b.round}, Option: ${b.option}, Amount: ${b.amount}, Folders: ${b.folders ? JSON.stringify(b.folders) : 'None'}`);
      });
      totalPending += pendingBets.length;
    }
  }
  console.log(`Total Pending Bets in entire DB: ${totalPending}`);
}

run().catch(console.error);
