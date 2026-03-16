import { useTournament } from '../hooks/useTournament';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, CheckCircle, Database, AlertTriangle } from 'lucide-react';

export default function Admin() {
  const { teams, games, loading } = useTournament();

  const handleUpdateWinner = async (gameId: string, winnerId: string) => {
    try {
      const gameRef = doc(db, 'tournaments', '2026', 'games', gameId);
      await updateDoc(gameRef, { winner_id: winnerId });
    } catch (err) {
      console.error(err);
      alert("Error updating result. Ensure you are signed in.");
    }
  };

  const seed2026Data = async () => {
    if (!confirm("This will overwrite the 2026 Tournament data using the official NCAA.com field. Proceed?")) return;
    
    try {
      const batch = writeBatch(db);
      const tournamentId = '2026';

      // NCAA Official Field 2026 (Slugified IDs)
      const teamData = [
        // EAST
        { id: 'duke', name: 'Duke', seed: 1, region: 'East' },
        { id: 'uconn', name: 'UConn', seed: 2, region: 'East' },
        { id: 'michigan-st', name: 'Michigan St.', seed: 3, region: 'East' },
        { id: 'st-johns-ny', name: 'St. John\'s (NY)', seed: 4, region: 'East' },
        { id: 'kansas', name: 'Kansas', seed: 5, region: 'East' },
        { id: 'louisville', name: 'Louisville', seed: 6, region: 'East' },
        { id: 'ucla', name: 'UCLA', seed: 7, region: 'East' },
        { id: 'ohio-st', name: 'Ohio St.', seed: 8, region: 'East' },
        { id: 'tcu', name: 'TCU', seed: 9, region: 'East' },
        { id: 'ucf', name: 'UCF', seed: 10, region: 'East' },
        { id: 'south-florida', name: 'South Florida', seed: 11, region: 'East' },
        { id: 'northern-iowa', name: 'Northern Iowa', seed: 12, region: 'East' },
        { id: 'cal-baptist', name: 'Cal Baptist', seed: 13, region: 'East' },
        { id: 'north-dakota-st', name: 'North Dakota St.', seed: 14, region: 'East' },
        { id: 'furman', name: 'Furman', seed: 15, region: 'East' },
        { id: 'siena', name: 'Siena', seed: 16, region: 'East' },
        // SOUTH
        { id: 'florida', name: 'Florida', seed: 1, region: 'South' },
        { id: 'houston', name: 'Houston', seed: 2, region: 'South' },
        { id: 'illinois', name: 'Illinois', seed: 3, region: 'South' },
        { id: 'nebraska', name: 'Nebraska', seed: 4, region: 'South' },
        { id: 'vanderbilt', name: 'Vanderbilt', seed: 5, region: 'South' },
        { id: 'north-carolina', name: 'North Carolina', seed: 6, region: 'South' },
        { id: 'saint-marys-ca', name: 'Saint Mary\'s (CA)', seed: 7, region: 'South' },
        { id: 'clemson', name: 'Clemson', seed: 8, region: 'South' },
        { id: 'iowa', name: 'Iowa', seed: 9, region: 'South' },
        { id: 'texas-am', name: 'Texas A&M', seed: 10, region: 'South' },
        { id: 'vcu', name: 'VCU', seed: 11, region: 'South' },
        { id: 'mcneese', name: 'McNeese', seed: 12, region: 'South' },
        { id: 'troy', name: 'Troy', seed: 13, region: 'South' },
        { id: 'penn', name: 'Penn', seed: 14, region: 'South' },
        { id: 'idaho', name: 'Idaho', seed: 15, region: 'South' },
        { id: 'first-four-winner-south', name: 'First Four South', seed: 16, region: 'South' },
        // MIDWEST
        { id: 'michigan', name: 'Michigan', seed: 1, region: 'Midwest' },
        { id: 'iowa-st', name: 'Iowa St.', seed: 2, region: 'Midwest' },
        { id: 'virginia', name: 'Virginia', seed: 3, region: 'Midwest' },
        { id: 'alabama', name: 'Alabama', seed: 4, region: 'Midwest' },
        { id: 'texas-tech', name: 'Texas Tech', seed: 5, region: 'Midwest' },
        { id: 'tennessee', name: 'Tennessee', seed: 6, region: 'Midwest' },
        { id: 'kentucky', name: 'Kentucky', seed: 7, region: 'Midwest' },
        { id: 'georgia', name: 'Georgia', seed: 8, region: 'Midwest' },
        { id: 'saint-louis', name: 'Saint Louis', seed: 9, region: 'Midwest' },
        { id: 'santa-clara', name: 'Santa Clara', seed: 10, region: 'Midwest' },
        { id: 'first-four-winner-midwest-11', name: 'First Four MW 11', seed: 11, region: 'Midwest' },
        { id: 'akron', name: 'Akron', seed: 12, region: 'Midwest' },
        { id: 'hofstra', name: 'Hofstra', seed: 13, region: 'Midwest' },
        { id: 'wright-st', name: 'Wright St.', seed: 14, region: 'Midwest' },
        { id: 'tennessee-st', name: 'Tennessee St.', seed: 15, region: 'Midwest' },
        { id: 'first-four-winner-midwest-16', name: 'First Four MW 16', seed: 16, region: 'Midwest' },
        // WEST
        { id: 'arizona', name: 'Arizona', seed: 1, region: 'West' },
        { id: 'purdue', name: 'Purdue', seed: 2, region: 'West' },
        { id: 'gonzaga', name: 'Gonzaga', seed: 3, region: 'West' },
        { id: 'arkansas', name: 'Arkansas', seed: 4, region: 'West' },
        { id: 'wisconsin', name: 'Wisconsin', seed: 5, region: 'West' },
        { id: 'byu', name: 'BYU', seed: 6, region: 'West' },
        { id: 'miami-fl', name: 'Miami (FL)', seed: 7, region: 'West' },
        { id: 'villanova', name: 'Villanova', seed: 8, region: 'West' },
        { id: 'utah-st', name: 'Utah St.', seed: 9, region: 'West' },
        { id: 'missouri', name: 'Missouri', seed: 10, region: 'West' },
        { id: 'first-four-winner-west', name: 'First Four West', seed: 11, region: 'West' },
        { id: 'high-point', name: 'High Point', seed: 12, region: 'West' },
        { id: 'hawaii', name: 'Hawaii', seed: 13, region: 'West' },
        { id: 'kennesaw-st', name: 'Kennesaw St.', seed: 14, region: 'West' },
        { id: 'queens-nc', name: 'Queens (NC)', seed: 15, region: 'West' },
        { id: 'long-island', name: 'Long Island', seed: 16, region: 'West' },
      ];

      // Set Teams
      teamData.forEach(t => {
        const ref = doc(db, 'tournaments', tournamentId, 'teams', t.id);
        batch.set(ref, t);
      });

      // R1 Pairings (matching NCAA Bracket IDs logic)
      const regions = ['East', 'South', 'Midwest', 'West'];
      const pairings = [[1,16], [8,9], [5,12], [4,13], [6,11], [3,14], [7,10], [2,15]];

      regions.forEach(region => {
        const regionTeams = teamData.filter(t => t.region === region);
        pairings.forEach((pair, idx) => {
          const teamA = regionTeams.find(t => t.seed === pair[0]);
          const teamB = regionTeams.find(t => t.seed === pair[1]);
          const gameId = `${region.toLowerCase()}-r1-g${idx + 1}`;
          const ref = doc(db, 'tournaments', tournamentId, 'games', gameId);
          batch.set(ref, {
            id: gameId, round: 1, region, slot_index: idx + 1,
            teamA_id: teamA?.id || null, teamB_id: teamB?.id || null, winner_id: null
          });
        });
      });

      await batch.commit();
      alert("Official NCAA Bracket Successfully Seeded!");
    } catch (err) {
      console.error(err);
      alert("Critical Error Seeding Data.");
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px]">
    <div className="w-12 h-12 border-4 border-[#00f2ff] border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-slate-500 font-display font-black uppercase italic">Accessing NCAA Feed...</p>
  </div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
            <Shield className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase">Admin Control</h1>
            <p className="text-slate-400 font-medium">Official NCAA Source Active</p>
          </div>
        </div>

        <button 
          onClick={seed2026Data}
          className="px-6 py-2 bg-slate-800 text-slate-100 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors border border-slate-700 text-xs font-black uppercase tracking-widest"
        >
          <Database className="w-4 h-4 text-[#00f2ff]" /> Reset to NCAA 2026 Data
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-8 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
        <p className="text-amber-200/80 text-sm">
          <strong>Caution:</strong> The ScoreBot automatically synchronizes with NCAA.com every 4 hours. 
          Manual updates here should only be used as a override.
        </p>
      </div>

      <div className="grid gap-4">
        {games.filter(g => g.round === 1).map(game => {
          const teamA = teams.find(t => t.id === game.teamA_id);
          const teamB = teams.find(t => t.id === game.teamB_id);
          
          return (
            <div key={game.id} className="bg-[#112240]/40 backdrop-blur-xl p-6 flex items-center justify-between border border-white/5 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">{game.id}</span>
                <span className="text-lg font-black text-white italic">{game.region} Round {game.round}</span>
              </div>

              <div className="flex gap-2">
                {[teamA, teamB].map(team => (
                  <button
                    key={team?.id}
                    onClick={() => team && handleUpdateWinner(game.id, team.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-3 border-2 ${
                      game.winner_id === team?.id 
                      ? "bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]" 
                      : "bg-white/5 border-transparent text-slate-400 hover:border-white/10"
                    }`}
                  >
                    <span className="text-xs opacity-50">{team?.seed}</span>
                    {team?.name || 'TBD'}
                    {game.winner_id === team?.id && <CheckCircle className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
