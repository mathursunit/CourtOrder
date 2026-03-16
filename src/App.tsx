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
    <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#00f2ff] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[#00f2ff] font-display font-black italic tracking-widest text-xs uppercase animate-pulse">Establishing Feed...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A192F] text-slate-100 font-sans selection:bg-[#00f2ff]/30">
      {/* Premium Header */}
      <header className="h-16 border-b border-white/5 bg-[#0A192F]/90 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('bracket')}>
            <Trophy className="w-6 h-6 text-[#00f2ff]" />
            <span className="text-xl font-display font-black italic tracking-tighter uppercase">COURTORDER</span>
          </div>
          <nav className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            {['BRACKET', 'LEADERBOARD', 'ADMIN'].map(m => (
              <button 
                key={m}
                onClick={() => setView(m.toLowerCase() as ViewMode)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  view === m.toLowerCase() ? 'bg-[#00f2ff] text-[#0A192F]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 pl-4 pr-2 py-1.5 rounded-full">
              <div className="text-right">
                <p className="text-[10px] font-black text-[#00f2ff] leading-none mb-0.5">{userScore} PTS</p>
                <p className="text-xs font-black text-white leading-none opacity-80">{user.displayName?.split(' ')[0]}</p>
              </div>
              <button onClick={() => logout()} className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-full transition-colors"><LogOut className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => login()} className="bg-[#00f2ff] text-[#0A192F] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">LOG IN TO PLAY</button>
          )}
        </div>
      </header>

      <main className="flex-1">
        {view === 'admin' ? <Admin /> : view === 'leaderboard' ? <Leaderboard /> : (
          <div className="h-full flex flex-col pt-6 px-8">
            {/* Context & Region Bar */}
            <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-[#00f2ff] rounded-full animate-pulse shadow-[0_0_8px_#00f2ff]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selection Sunday Live</span>
                </div>
                <div className="flex items-center gap-8">
                  {regions.map(r => (
                    <button
                      key={r}
                      onClick={() => setActiveRegion(r)}
                      className={`text-4xl font-display font-black italic transition-all ${
                        activeRegion === r ? 'text-white' : 'text-slate-700 hover:text-slate-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest">East Regional Hub</p>
                <p className="text-xs font-bold italic">Madison Square Garden, NY</p>
              </div>
            </div>

            {/* THE BRACKET TREE - Explicit horizontal flow */}
            <div className="flex-1 overflow-x-auto pb-12 scrollbar-hide">
              <div className="flex flex-row flex-nowrap items-stretch gap-12 min-h-[900px] w-max">
                {[1, 2, 3, 4].map((round) => {
                  const roundGames = getRegionGames(activeRegion, round);
                  
                  return (
                    <div key={round} className="flex flex-col min-w-[280px]">
                      <div className="mb-6">
                        <p className="text-[9px] font-black text-[#00f2ff] uppercase tracking-widest opacity-60">Round {round}</p>
                        <h4 className="text-lg font-display font-black text-white italic tracking-tight uppercase">
                          {round === 1 ? 'Round of 64' : round === 2 ? 'Round of 32' : round === 3 ? 'Sweet 16' : 'Elite 8'}
                        </h4>
                      </div>

                      <div className="flex-1 flex flex-col justify-around py-4">
                        {roundGames.map((game) => {
                          const teamA = getTeamById(selections[game.childA_id || ''] || game.teamA_id);
                          const teamB = getTeamById(selections[game.childB_id || ''] || game.teamB_id);
                          
                          return (
                            <div key={game.id} className="relative py-4 pr-12">
                              <Matchup 
                                gameId={game.id} 
                                teamA={teamA} 
                                teamB={teamB}
                                winnerId={game.winner_id || undefined}
                              />
                              
                              {/* Horizontal Connector Out */}
                              {round < 4 && (
                                <div className="absolute right-0 top-1/2 w-12 h-[2px] bg-[#00f2ff]/20 shadow-[0_0_8px_rgba(0,242,255,0.1)]" />
                              )}
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

      <footer className="h-10 bg-black/20 border-t border-white/5 px-6 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <span>COURTORDER // BROADCAST EDITION</span>
          <span>EST. 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500">SYSTEM READY</span>
          <span className="w-1 h-1 bg-emerald-500 rounded-full" />
          <span>V4.2.0-STITCH</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
