import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../courtorder-ef262-firebase-adminsdk-fbsvc-80918e7fd5.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function rebuild() {
  console.log('Synchronizing Local standings mirror...');
  
  const usersSnap = await db.collection('users').get();
  const entries = [];
  
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const displayName = userData.displayName || userDoc.id.split('_')[1] || 'Anonymous';
    
    // Get their 2026 bracket
    const bracketSnap = await db.collection('users').doc(userDoc.id).collection('brackets').doc('2026').get();
    const bracketData = bracketSnap.exists ? bracketSnap.data() : { selections: {} };
    
    entries.push({
      userId: userDoc.id,
      userName: displayName,
      picks: bracketData.selections || {},
      score: 0 // Frontend will calculate this
    });
  }

  const data = {
    entries,
    generatedAt: new Date().toISOString(),
    version: '4.2.10'
  };

  // Write to public folder for static hosting bypass
  const publicPath = path.join(__dirname, '../public/leaderboard-data.json');
  fs.writeFileSync(publicPath, JSON.stringify(data, null, 2));
  
  // Also keep the Firestore mirror just in case
  await db.collection('tournaments').doc('2026').collection('public').doc('leaderboard').set(data);

  console.log(`Success! Synchronized ${entries.length} contestants to /public/leaderboard-data.json`);
}

rebuild().catch(console.error);
