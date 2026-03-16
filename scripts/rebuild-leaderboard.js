import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../courtorder-ef262-firebase-adminsdk-fbsvc-80918e7fd5.json'), 'utf8')
);

// We need some scoring logic here since we can't easily import from ../lib/scoring in a script
function calculateScore(selections = {}, games = []) {
  let score = 0;
  // Simple scoring for now, can be improved
  return score;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function rebuild() {
  console.log('Rebuilding consolidated leaderboard...');
  
  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users.`);
  
  const leaderboardEntries = [];
  
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const displayName = userData.displayName || userDoc.id.split('_')[1] || 'Anonymous';
    
    // Get their 2026 bracket
    const bracketSnap = await db.collection('users').doc(userDoc.id).collection('brackets').doc('2026').get();
    
    leaderboardEntries.push({
      userId: userDoc.id,
      userName: displayName,
      score: 0, // Placeholder, actual score calculated on frontend or here
      lastUpdated: new Date().toISOString()
    });
  }

  // Save to a PUBLIC collection
  await db.collection('tournaments').doc('2026').collection('public').doc('leaderboard').set({
    entries: leaderboardEntries,
    generatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Leaderboard consolidated to tournaments/2026/public/leaderboard');
}

rebuild().catch(console.error);
