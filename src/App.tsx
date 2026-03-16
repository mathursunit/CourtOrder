import { useState, useEffect, useMemo } from 'react';
import { Trophy, Zap, LogOut } from 'lucide-react';
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

  // Load user bracket on login
  useEffect(() => {
    if (!user) return;
    const loadBracket = async () => {
      const docRef = doc(db, 'users', user.uid, 'brackets', '2026');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.selections && Object.keys(data.selections).length > 0) {
          setSelections(data.selections);
        }
      }
    };
    loadBracket();
  }, [user, setSelections]);

  // Auto-save bracket on change
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
    const timer = setTimeout(saveBracket, 2000); // 2s debounce
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

  const handleQuickFill = (type: 'random' | 'higher-seed') => {
    if (type === 'higher-seed') {
      const newPicks: Record<string, string> = {};
      const r1Games = games.filter(g => g.round === 1);
      r1Games.forEach(g => {
        const tA = getTeamById(g.teamA_id);
        const tB = getTeamById(g.teamB_id);
        if (tA && tB) {
          newPicks[g.id] = (tA.seed || 16) <= (tB.seed || 16) ? tA.id : tB.id;
        }
      });
      setSelections({...selections, ...newPicks});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="text-2xl font-display font-black text-white italic">Initializing CourtOrder</h2>
            <p className="text-slate-500 font-medium">Fetching 2026 Tournament Data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-glass-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('bracket')}>
              <Trophy className="w-8 h-8 text-brand drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
              <span className="text-2xl font-display font-black tracking-tighter italic text-white uppercase leading-none">
                CourtOrder
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setView('bracket')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'bracket' ? 'bg-brand/10 text-brand' : 'text-slate-400 hover:text-white'}`}
              >
                BRACKET
              </button>
              <button 
                onClick={() => setView('leaderboard')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'leaderboard' ? 'bg-brand/10 text-brand' : 'text-slate-400 hover:text-white'}`}
              >
                LEADERBOARD
              </button>
              <button 
                onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'admin' ? 'bg-brand/10 text-brand' : 'text-slate-400 hover:text-white'}`}
              >
                ADMIN
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-brand uppercase leading-none mb-1">{userScore} PTS</span>
                  <span className="text-sm font-black text-white leading-none">{user.displayName?.split(' ')[0]}</span>
                </div>
                <button onClick={() => logout()} className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-full transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => login()} className="px-6 py-2 bg-brand text-slate-900 font-black rounded-lg text-sm hover:scale-105 transition-all shadow-neon">
                LOGIN TO SAVE
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8">
        {view === 'admin' ? (
          <Admin />
        ) : view === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          <div className="px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-brand/20 text-brand text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-brand/20 animate-pulse">
                    Selection Sunday Live
                  </span>
                </div>
                <h1 className="text-5xl font-display font-black text-white italic tracking-tighter uppercase leading-[0.9]">
                  2026 March Madness<br/>
                  <span className="text-brand">Championship Bracket</span>
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => handleQuickFill('higher-seed')} className="btn-secondary flex items-center gap-2 text-xs uppercase font-black tracking-widest">
                  <Zap className="w-4 h-4 text-amber-400" /> Chalk Fill
                </button>
                <button onClick={() => setSelections({})} className="btn-secondary flex items-center gap-2 text-xs uppercase font-black tracking-widest text-rose-400">
                  Reset
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r)}
                  className={`px-8 py-3 rounded-xl font-display font-black text-sm tracking-widest uppercase transition-all whitespace-nowrap ${
                    activeRegion === r 
                    ? 'bg-brand text-slate-900 shadow-neon-strong' 
                    : 'bg-white/5 text-slate-500 border border-white/5 hover:border-brand/20'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-12 overflow-x-auto pb-12 items-start scrollbar-hide">
              {[1, 2, 3, 4].map(round => (
                <div key={round} className="flex flex-col gap-8 flex-shrink-0 min-w-[256px]">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Round</span>
                    <h3 className="text-2xl font-display font-black italic text-white leading-none">
                      {round === 1 ? 'Round of 64' : round === 2 ? 'Round of 32' : round === 3 ? 'Sweet 16' : 'Elite 8'}
                    </h3>
                  </div>
                  <div className={`flex flex-col justify-around h-full gap-4 ${round === 2 ? 'mt-12' : round === 3 ? 'mt-32' : round === 4 ? 'mt-64' : ''}`}>
                    {getRegionGames(activeRegion, round).map(game => {
                      const teamA = getTeamById(selections[game.childA_id || ''] || game.teamA_id);
                      const teamB = getTeamById(selections[game.childB_id || ''] || game.teamB_id);
                      return (
                        <Matchup 
                          key={game.id} 
                          gameId={game.id} 
                          teamA={teamA} 
                          teamB={teamB}
                          winnerId={game.winner_id || undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 py-2 px-6 bg-surface/90 border-t border-glass-border flex justify-between items-center text-[10px] uppercase font-black tracking-widest z-50">
        <div className="flex items-center gap-4 text-slate-500">
          <span>2026 CourtOrder</span>
          <span className="w-1 h-1 bg-brand rounded-full"></span>
          <span>Broadcast Edition v2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-brand">Live Feed:</span>
          <span className="text-slate-200">courtorder.sunitmathur.com</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
      </footer>
    </div>
  );
}

export default App;
