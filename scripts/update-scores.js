import admin from 'firebase-admin';
// Using native fetch available in Node 18+

/**
 * Automator for CourtOrder March Madness
 * Polling ESPN Scoreboard and updating Firestore "Master Feed"
 */

const TOURNAMENT_ID = '2026';
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';

// Initialize Firebase
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log(`[${new Date().toISOString()}] Starting Score Update...`);
  
  try {
    const response = await fetch(ESPN_URL);
    const data = await response.json();
    
    const events = data.events || [];
    console.log(`Found ${events.length} games on scoreboard.`);

    for (const event of events) {
      const status = event.status.type.name;
      if (status !== 'STATUS_FINAL') continue;

      const competitorA = event.competitions[0].competitors[0];
      const competitorB = event.competitions[0].competitors[1];
      
      const teamAName = competitorA.team.displayName;
      const teamBName = competitorB.team.displayName;
      const scoreA = parseInt(competitorA.score);
      const scoreB = parseInt(competitorB.score);
      
      const winnerName = scoreA > scoreB ? teamAName : teamBName;
      console.log(`Processing: ${teamAName} vs ${teamBName} | Winner: ${winnerName}`);

      await processGameResult(teamAName, teamBName, winnerName);
    }

    console.log("Sync Complete.");
  } catch (err) {
    console.error("Sync Failed:", err);
    process.exit(1);
  }
}

async function processGameResult(nameA, nameB, winnerName) {
  // 1. Resolve Team IDs from names
  const teamsSnap = await db.collection('tournaments').doc(TOURNAMENT_ID).collection('teams').get();
  const allTeams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const findTeam = (name) => {
    // Fuzzy match: ESPN often adds school nicknames
    return allTeams.find(t => name.includes(t.name) || t.name.includes(name));
  };

  const teamA = findTeam(nameA);
  const teamB = findTeam(nameB);
  const winner = findTeam(winnerName);

  if (!teamA || !teamB || !winner) {
    console.log(`Skipping: Could not map teams (${nameA}/${nameB})`);
    return;
  }

  // 2. Find the Game in Firestore
  const gamesRef = db.collection('tournaments').doc(TOURNAMENT_ID).collection('games');
  const gamesSnap = await gamesRef
    .where('teamA_id', '==', teamA.id)
    .where('teamB_id', '==', teamB.id)
    .get();

  // Try reverse order too
  let gameDoc = gamesSnap.docs[0];
  if (!gameDoc) {
    const revSnap = await gamesRef
      .where('teamA_id', '==', teamB.id)
      .where('teamB_id', '==', teamA.id)
      .get();
    gameDoc = revSnap.docs[0];
  }

  if (!gameDoc) {
    console.log(`No active game found for ${teamA.id} vs ${teamB.id}`);
    return;
  }

  const gameData = gameDoc.data();
  if (gameData.winner_id === winner.id) {
    console.log(`Game ${gameDoc.id} already has winner ${winner.id}.`);
    return;
  }

  // 3. Update Winner
  console.log(`Updating Game ${gameDoc.id} with winner ${winner.id}`);
  await gameDoc.ref.update({ winner_id: winner.id });

  // 4. ADVANCE Logic
  await advanceWinner(gameDoc.id, gameData, winner.id);
}

async function advanceWinner(gameId, gameData, winnerId) {
  const { region, round, slot_index } = gameData;
  if (round >= 6) return; // Champion crowned

  let nextRound = round + 1;
  let nextSlot = Math.ceil(slot_index / 2);
  let nextField = (slot_index % 2 !== 0) ? 'teamA_id' : 'teamB_id';
  
  let nextGameId;
  if (round < 4) {
    // Intra-region advancement (R2, S16, E8)
    nextGameId = `${region.toLowerCase()}-r${nextRound}-g${nextSlot}`;
  } else if (round === 4) {
    // Elite 8 -> Final Four
    // Logic needs to match tournament structure
    // e.g. East Winner vs West Winner -> F4-G1
    // South Winner vs Midwest Winner -> F4-G2
    if (region === 'East' || region === 'West') {
      nextGameId = 'f4-g1';
      nextField = (region === 'East') ? 'teamA_id' : 'teamB_id';
    } else {
      nextGameId = 'f4-g2';
      nextField = (region === 'South') ? 'teamA_id' : 'teamB_id';
    }
  } else if (round === 5) {
    // Final Four -> Championship
    nextGameId = 'championship';
    nextField = (slot_index === 1) ? 'teamA_id' : 'teamB_id';
  }

  if (nextGameId) {
    console.log(`Advancing ${winnerId} to ${nextGameId}.${nextField}`);
    const nextGameRef = db.collection('tournaments').doc(TOURNAMENT_ID).collection('games').doc(nextGameId);
    await nextGameRef.set({ [nextField]: winnerId }, { merge: true });
  }
}

run();
