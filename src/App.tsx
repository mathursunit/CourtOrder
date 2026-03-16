import { useState, useEffect, useMemo } from 'react';
import { Trophy, LogOut } from 'lucide-react';
import { useBracketStore } from './store/useBracketStore';
import { useAuthStore } from './store/useAuthStore';
import { useTournament } from './hooks/useTournament';
import { Matchup } from './components/bracket/Matchup';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { calculateTotalScore } from './lib/scoring';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';

type ViewMode = 'bracket' | 'leaderboard' | 'admin';

function App() {
  const [view, setView] = useState<ViewMode>('bracket');
  const { user, login, logout } = useAuthStore();
  const { selections, setSelections } = useBracketStore();
  const { teams, games, loading } = useTournament();
  const [activeRegion, setActiveRegion] = useState('East');

  useEffect(() => {
    if (!user) return;
    const loadBracket = async () => {
      const docRef = doc(db, 'users', user.uid, 'brackets', '2026');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.selections) setSelections(data.selections);
      }
    };
    loadBracket();
  }, [user, setSelections]);

  useEffect(() => {
    if (!user || Object.keys(selections).length === 0) return;
    const saveBracket = async () => {
      const docRef = doc(db, 'users', user.uid, 'brackets', '2026');
      await setDoc(docRef, {
        selections,
        lastUpdated: serverTimestamp(),
        userName: user.displayName,
        userId: user.uid
      }, { merge: true });
    };
    const timer = setTimeout(saveBracket, 3000);
    return () => clearTimeout(timer);
  }, [selections, user]);

  const regions = ['East', 'West', 'South', 'Midwest'];
  const userScore = useMemo(() => calculateTotalScore(selections, games), [selections, games]);

  const getRegionGames = (region: string, round: number) => {
    return games.filter(g => g.region?.toLowerCase() === region.toLowerCase() && g.round === round)
      .sort((a, b) => (a.slot_index || 0) - (b.slot_index || 0));
  };

  const getTeamById = (id: string | null | undefined) => {
    if (!id) return undefined;
    return teams.find(t => t.id === id);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-brand font-black italic tracking-widest text-sm uppercase">Loading Feed...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A192F] flex flex-col">
      {/* Universal Header */}
      <header className="h-16 border-b border-white/5 bg-[#0A192F]/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('bracket')}>
            <Trophy className="w-6 h-6 text-brand" />
            <span className="text-xl font-display font-black italic text-white tracking-tighter">COURTORDER</span>
          </div>
          <nav className="flex items-center gap-1">
            {['BRACKET', 'LEADERBOARD', 'ADMIN'].map(m => (
              <button 
                key={m}
                onClick={() => setView(m.toLowerCase() as ViewMode)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  view === m.toLowerCase() ? 'bg-brand/10 text-brand' : 'text-slate-500 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-black text-brand leading-none mb-0.5">{userScore} PTS</p>
                <p className="text-xs font-black text-white leading-none opacity-80">{user.displayName?.split(' ')[0]}</p>
              </div>
              <button onClick={() => logout()} className="p-1 hover:text-rose-400 opacity-50"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => login()} className="btn-primary text-[10px] py-1.5">LOG IN TO PLAY</button>
          )}
        </div>
      </header>

      {/* View Content */}
      <main className="flex-1">
        {view === 'admin' ? <Admin /> : view === 'leaderboard' ? <Leaderboard /> : (
          <div className="h-full flex flex-col">
            {/* Region Switcher Bar */}
            <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                {regions.map(r => (
                  <button
                    key={r}
                    onClick={() => setActiveRegion(r)}
                    className={`text-2xl font-display font-black italic transition-all ${
                      activeRegion === r ? 'text-brand drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Picking Phase Live</span>
              </div>
            </div>

            {/* THE BRACKET TREE */}
            <div className="flex-1 overflow-x-auto p-12 scrollbar-hide">
              <div className="flex items-start gap-16 min-h-[800px]">
                {[1, 2, 3, 4].map((round) => {
                  const roundGames = getRegionGames(activeRegion, round);
                  
                  return (
                    <div key={round} className="flex flex-col h-full justify-around min-w-[220px]">
                      <div className="mb-8 pl-4">
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest opacity-60">Round {round}</p>
                        <h4 className="text-sm font-black text-white italic tracking-tight uppercase">
                          {round === 1 ? 'Round of 64' : round === 2 ? 'Round of 32' : round === 3 ? 'Sweet 16' : 'Elite 8'}
                        </h4>
                      </div>

                      <div className="flex flex-col justify-around gap-8 h-full">
                        {roundGames.map((game) => {
                          const teamA = getTeamById(selections[game.childA_id || ''] || game.teamA_id);
                          const teamB = getTeamById(selections[game.childB_id || ''] || game.teamB_id);
                          
                          return (
                            <div key={game.id} className="relative group">
                              <Matchup 
                                gameId={game.id} 
                                teamA={teamA} 
                                teamB={teamB}
                                winnerId={game.winner_id || undefined}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status */}
      <footer className="h-8 bg-black/40 border-t border-white/5 px-6 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <span>COURTORDER 2.0</span>
          <span>© 2026</span>
        </div>
        <div>STITCH BROADCAST DESIGN SYSTEM</div>
      </footer>
    </div>
  );
}

export default App;
