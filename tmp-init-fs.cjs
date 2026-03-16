const admin = require('firebase-admin');
const serviceAccount = require('./courtorder-ef262-firebase-adminsdk-fbsvc-75440bd62d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const teams = [
  // EAST REGION
  { id: 'duke', name: 'Duke', seed: 1, region: 'East' },
  { id: 'uconn', name: 'UConn', seed: 2, region: 'East' },
  { id: 'michigan-st', name: 'Michigan State', seed: 3, region: 'East' },
  { id: 'st-johns', name: 'St. Johns', seed: 4, region: 'East' },
  { id: 'kansas', name: 'Kansas', seed: 5, region: 'East' },
  { id: 'louisville', name: 'Louisville', seed: 6, region: 'East' },
  { id: 'ohio-st', name: 'Ohio State', seed: 7, region: 'East' },
  { id: 'tcu', name: 'TCU', seed: 8, region: 'East' },
  { id: 'south-fla', name: 'South Florida', seed: 9, region: 'East' },
  { id: 'cal-baptist', name: 'Cal Baptist', seed: 10, region: 'East' },
  { id: 'northern-iowa', name: 'Northern Iowa', seed: 11, region: 'East' },
  { id: 'ucla', name: 'UCLA', seed: 12, region: 'East' },
  { id: 'ucf', name: 'UCF', seed: 13, region: 'East' },
  { id: 'north-dakota-st', name: 'North Dakota St', seed: 14, region: 'East' },
  { id: 'furman', name: 'Furman', seed: 15, region: 'East' },
  { id: 'siena', name: 'Siena', seed: 16, region: 'East' },

  // SOUTH REGION
  { id: 'florida', name: 'Florida', seed: 1, region: 'South' },
  { id: 'houston', name: 'Houston', seed: 2, region: 'South' },
  { id: 'illinois', name: 'Illinois', seed: 3, region: 'South' },
  { id: 'saint-marys', name: 'Saint Marys', seed: 4, region: 'South' },
  { id: 'north-carolina', name: 'North Carolina', seed: 5, region: 'South' },
  { id: 'nebraska', name: 'Nebraska', seed: 6, region: 'South' },
  { id: 'vanderbilt', name: 'Vanderbilt', seed: 7, region: 'South' },
  { id: 'clemson', name: 'Clemson', seed: 8, region: 'South' },
  { id: 'iowa', name: 'Iowa', seed: 9, region: 'South' },
  { id: 'mcneese', name: 'McNeese', seed: 10, region: 'South' },
  { id: 'vcu', name: 'VCU', seed: 11, region: 'South' },
  { id: 'troy', name: 'Troy', seed: 12, region: 'South' },
  { id: 'penn', name: 'Penn', seed: 13, region: 'South' },
  { id: 'texas-am', name: 'Texas A&M', seed: 14, region: 'South' },
  { id: 'idaho', name: 'Idaho', seed: 15, region: 'South' },
  { id: 'lehigh', name: 'Lehigh', seed: 16, region: 'South' },

  // MIDWEST REGION
  { id: 'michigan', name: 'Michigan', seed: 1, region: 'Midwest' },
  { id: 'iowa-st', name: 'Iowa State', seed: 2, region: 'Midwest' },
  { id: 'kentucky', name: 'Kentucky', seed: 3, region: 'Midwest' },
  { id: 'virginia', name: 'Virginia', seed: 4, region: 'Midwest' },
  { id: 'tennessee', name: 'Tennessee', seed: 5, region: 'Midwest' },
  { id: 'alabama', name: 'Alabama', seed: 6, region: 'Midwest' },
  { id: 'texas-tech', name: 'Texas Tech', seed: 7, region: 'Midwest' },
  { id: 'georgia', name: 'Georgia', seed: 8, region: 'Midwest' },
  { id: 'saint-louis', name: 'Saint Louis', seed: 9, region: 'Midwest' },
  { id: 'akron', name: 'Akron', seed: 10, region: 'Midwest' },
  { id: 'hofstra', name: 'Hofstra', seed: 11, region: 'Midwest' },
  { id: 'miami-oh', name: 'Miami (OH)', seed: 12, region: 'Midwest' },
  { id: 'wright-st', name: 'Wright State', seed: 13, region: 'Midwest' },
  { id: 'santa-clara', name: 'Santa Clara', seed: 14, region: 'Midwest' },
  { id: 'tennessee-st', name: 'Tennessee State', seed: 15, region: 'Midwest' },
  { id: 'howard', name: 'Howard', seed: 16, region: 'Midwest' },

  // WEST REGION
  { id: 'arizona', name: 'Arizona', seed: 1, region: 'West' },
  { id: 'purdue', name: 'Purdue', seed: 2, region: 'West' },
  { id: 'wisconsin', name: 'Wisconsin', seed: 3, region: 'West' },
  { id: 'texas', name: 'Texas', seed: 4, region: 'West' },
  { id: 'villanova', name: 'Villanova', seed: 5, region: 'West' },
  { id: 'byu', name: 'BYU', seed: 6, region: 'West' },
  { id: 'miami-fl', name: 'Miami (FL)', seed: 7, region: 'West' },
  { id: 'utah-st', name: 'Utah State', seed: 8, region: 'West' },
  { id: 'missouri', name: 'Missouri', seed: 9, region: 'West' },
  { id: 'nc-state', name: 'NC State', seed: 10, region: 'West' },
  { id: 'gonzaga', name: 'Gonzaga', seed: 11, region: 'West' },
  { id: 'hawaii', name: 'Hawaii', seed: 12, region: 'West' },
  { id: 'kennesaw-st', name: 'Kennesaw St', seed: 13, region: 'West' },
  { id: 'queens-nc', name: 'Queens (NC)', seed: 14, region: 'West' },
  { id: 'liu', name: 'LIU', seed: 15, region: 'West' },
  { id: 'high-point', name: 'High Point', seed: 16, region: 'West' },
];

async function initialize() {
  const tournamentId = '2026';
  
  // 1. Upload Teams
  console.log('Uploading teams...');
  for (const team of teams) {
    await db.collection('tournaments').doc(tournamentId).collection('teams').doc(team.id).set(team);
  }

  // 2. Generate Round 1 Games
  console.log('Generating Round 1 games...');
  const regions = ['East', 'South', 'Midwest', 'West'];
  const pairings = [[1,16], [8,9], [5,12], [4,13], [6,11], [3,14], [7,10], [2,15]];

  for (const region of regions) {
    const regionTeams = teams.filter(t => t.region === region);
    pairings.forEach((pair, idx) => {
      const teamA = regionTeams.find(t => t.seed === pair[0]);
      const teamB = regionTeams.find(t => t.seed === pair[1]);
      
      const gameId = `${region.toLowerCase()}-r1-g${idx + 1}`;
      db.collection('tournaments').doc(tournamentId).collection('games').doc(gameId).set({
        id: gameId,
        round: 1,
        region: region,
        slot_index: idx + 1,
        teamA_id: teamA.id,
        teamB_id: teamB.id,
        winner_id: null
      });
    });

    // Generate Round 2 placeholders
    for (let i = 1; i <= 4; i++) {
       const gameId = `${region.toLowerCase()}-r2-g${i}`;
       db.collection('tournaments').doc(tournamentId).collection('games').doc(gameId).set({
         id: gameId,
         round: 2,
         region: region,
         slot_index: i,
         childA_id: `${region.toLowerCase()}-r1-g${i*2-1}`,
         childB_id: `${region.toLowerCase()}-r1-g${i*2}`,
         winner_id: null
       });
    }

    // Round 3
    for (let i = 1; i <= 2; i++) {
        const gameId = `${region.toLowerCase()}-r3-g${i}`;
        db.collection('tournaments').doc(tournamentId).collection('games').doc(gameId).set({
          id: gameId,
          round: 3,
          region: region,
          slot_index: i,
          childA_id: `${region.toLowerCase()}-r2-g${i*2-1}`,
          childB_id: `${region.toLowerCase()}-r2-g${i*2}`,
          winner_id: null
        });
    }

    // Round 4 (Regional Final)
    const gameId4 = `${region.toLowerCase()}-r4-g1`;
    db.collection('tournaments').doc(tournamentId).collection('games').doc(gameId4).set({
      id: gameId4,
      round: 4,
      region: region,
      slot_index: 1,
      childA_id: `${region.toLowerCase()}-r3-g1`,
      childB_id: `${region.toLowerCase()}-r3-g2`,
      winner_id: null
    });
  }

  // 3. Final Four
  console.log('Generating Final Four placeholders...');
  db.collection('tournaments').doc(tournamentId).collection('games').doc('semi-r5-g1').set({
    id: 'semi-r5-g1',
    round: 5,
    region: 'Final Four',
    slot_index: 1,
    childA_id: 'east-r4-g1',
    childB_id: 'west-r4-g1',
    winner_id: null
  });
  db.collection('tournaments').doc(tournamentId).collection('games').doc('semi-r5-g2').set({
    id: 'semi-r5-g2',
    round: 5,
    region: 'Final Four',
    slot_index: 2,
    childA_id: 'south-r4-g1',
    childB_id: 'midwest-r4-g1',
    winner_id: null
  });

  // Final
  db.collection('tournaments').doc(tournamentId).collection('games').doc('final-r6-g1').set({
    id: 'final-r6-g1',
    round: 6,
    region: 'Championship',
    slot_index: 1,
    childA_id: 'semi-r5-g1',
    childB_id: 'semi-r5-g2',
    winner_id: null
  });

  console.log('Tournament 2026 populated successfully!');
}

initialize().catch(console.error);
