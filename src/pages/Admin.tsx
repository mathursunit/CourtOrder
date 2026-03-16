import { useTournament } from '../hooks/useTournament';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, CheckCircle } from 'lucide-react';

export default function Admin() {
  const { teams, games, loading } = useTournament();

  const handleUpdateWinner = async (gameId: string, winnerId: string) => {
    try {
      const gameRef = doc(db, 'tournaments', '2026', 'games', gameId);
      await updateDoc(gameRef, { winner_id: winnerId });
      alert(`Master result updated for ${gameId}`);
    } catch (err) {
      console.error(err);
      alert("Error updating result. Are you an admin?");
    }
  };

  if (loading) return <div className="p-20 text-center">Loading Master Data...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Shield className="w-10 h-10 text-sports-error" />
          <h1 className="text-4xl font-black italic uppercase">Master Control Panel</h1>
        </div>

        <div className="grid gap-6">
          {games.map(game => (
            <div key={game.id} className="glass-card p-6 flex items-center justify-between border-sports-error/30">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">{game.region} - Round {game.round}</p>
                <p className="text-xl font-bold">{game.id}</p>
              </div>

              <div className="flex gap-4">
                {[game.team_1_id, game.team_2_id].map(teamId => {
                  const team = teams[teamId];
                  const isWinner = game.winner_id === teamId;
                  return (
                    <button
                      key={teamId}
                      onClick={() => handleUpdateWinner(game.id, teamId)}
                      className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${
                        isWinner 
                        ? "bg-sports-success border-sports-success text-sports-navy" 
                        : "border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {team?.name || teamId}
                      {isWinner && <CheckCircle className="inline ml-2 w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
