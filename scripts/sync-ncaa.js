import admin from 'firebase-admin';

/**
 * NCAA Sync for CourtOrder 2026
 * Using official GraphQL endpoints discovered from NCAA March Madness Live.
 */

const TOURNAMENT_ID = '2026';
const GRAPHQL_URL = 'https://sdataprod.ncaa.com/';

// NCAA GraphQL Hashes
const SCORE_HASH = 'e5746c1f7317fbbb07928dee293eb92e7fa30cc349e5ed0c20e45fa94aacc22e';
const BRACKET_HASH = '58cd1e8be6f2902dd6d7fed23392b885c7349ea6ff04b740f95cfe8f8c226595';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fetchNCAA(hash) {
  const url = `${GRAPHQL_URL}?operationName=official_bracket_web&variables={"seasonYear":2025}&extensions={"persistedQuery":{"version":1,"sha256Hash":"${hash}"}}`;
  const res = await fetch(url);
  return res.json();
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting NCAA Official Sync...`);

  try {
    const bracketData = await fetchNCAA(BRACKET_HASH);
    const contests = bracketData.data.mmlContests;

    // 1. Process Teams First (to ensure they exist)
    const teamsSeen = new Set();
    const batch = db.batch();
    
    for (const contest of contests) {
      for (const team of contest.teams) {
        if (!team.name || teamsSeen.has(team.name)) continue;
        
        const regionRaw = contest.region?.title?.trim() || 'First Four';
        const region = mapRegion(regionRaw);
        const teamId = slugify(team.name);
        
        const teamRef = db.collection('tournaments').doc(TOURNAMENT_ID).collection('teams').doc(teamId);
        batch.set(teamRef, {
          id: teamId,
          name: team.name,
          seed: parseInt(team.seed) || 16,
          region: region
        }, { merge: true });
        
        teamsSeen.add(team.name);
      }
    }
    await batch.commit();
    console.log(`Sync'd ${teamsSeen.size} teams.`);

    // 2. Process Games
    const gameBatch = db.batch();
    for (const contest of contests) {
      const ncaaRound = contest.round.roundNumber;
      if (ncaaRound < 2) continue; // Skip First Four for now (or handle if needed)

      const appRound = ncaaRound - 1; // NCAA R2 = App R1
      const regionRaw = contest.region?.title?.trim() || 'Final Four';
      const region = mapRegion(regionRaw);
      
      // Generate our internal Game ID logic or use bracketId
      // In our app, we used region-r1-g1, etc.
      // But NCAA has contestId/bracketId. We'll stick to a mapping if possible
      // Match by teams for safety
      const teamA = contest.teams[0];
      const teamB = contest.teams[1];
      
      const gameId = mapGameId(contest.bracketId, region, appRound);
      const gameRef = db.collection('tournaments').doc(TOURNAMENT_ID).collection('games').doc(gameId);
      
      const winner = contest.teams.find(t => t.isWinner);
      
      gameBatch.set(gameRef, {
        id: gameId,
        round: appRound,
        region: region,
        teamA_id: teamA?.name ? slugify(teamA.name) : null,
        teamB_id: teamB?.name ? slugify(teamB.name) : null,
        winner_id: winner ? slugify(winner.name) : null,
        ncaa_bracket_id: contest.bracketId
      }, { merge: true });
    }

    await gameBatch.commit();
    console.log("NCAA Sync Complete.");

  } catch (err) {
    console.error("NCAA Sync Failed:", err);
    process.exit(1);
  }
}

function mapRegion(raw) {
  const r = raw.toUpperCase().trim();
  if (r.includes('EAST')) return 'East';
  if (r.includes('WEST')) return 'West';
  if (r.includes('SOUTH')) return 'South';
  if (r.includes('MIDWEST')) return 'Midwest';
  return 'Final Four';
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Maps NCAA bracketId to our internal gameId for the Round of 64
 * NCAA 201-208: East R1
 * NCAA 209-216: South R1
 * NCAA 225-232: Midwest R1
 * NCAA 217-224: West R1
 */
function mapGameId(bracketId, region, round) {
  if (round === 1) {
    let slot = 1;
    if (bracketId >= 201 && bracketId <= 208) slot = bracketId - 200;
    else if (bracketId >= 209 && bracketId <= 216) slot = bracketId - 208;
    else if (bracketId >= 217 && bracketId <= 224) slot = bracketId - 216;
    else if (bracketId >= 225 && bracketId <= 232) slot = bracketId - 224;
    return `${region.toLowerCase()}-r1-g${slot}`;
  }
  
  // For higher rounds, we can use a generic mapping or just the bracketId
  return `${region.toLowerCase()}-round-${round}-ncaa-${bracketId}`;
}

run();
