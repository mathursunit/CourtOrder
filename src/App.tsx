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

  const handleQuickFill = () => {
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
  };

  // Bracket Layout Helper
  const MATCHUP_HEIGHT = 110; // Matchup card height + margin
  const getRoundSpacing = (round: number) => Math.pow(2, round - 1) * MATCHUP_HEIGHT;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-display font-black text-white italic">SYCHRONIZING FEED...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#0A192F]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('bracket')}>
              <Trophy className="w-8 h-8 text-brand" />
              <span className="text-2xl font-display font-black italic text-white leading-none">COURTORDER</span>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              {['BRACKET', 'LEADERBOARD', 'ADMIN'].map(nav => (
                <button 
                  key={nav}
                  onClick={() => setView(nav.toLowerCase() as ViewMode)}
                  className={`text-xs font-black tracking-[0.2em] transition-all ${view === nav.toLowerCase() ? 'text-brand' : 'text-slate-500 hover:text-white'}`}
                >
                  {nav}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
               <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-brand leading-none mb-1">{userScore} PTS</p>
                    <p className="text-xs font-black text-white leading-none">{user.displayName}</p>
                  </div>
                  <button onClick={() => logout()} className="p-1 hover:text-rose-400 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
               </div>
            ) : (
              <button onClick={() => login()} className="btn-primary text-xs uppercase tracking-widest">LOG IN</button>
            )}
          </div>
        </div>
      </header>

      <main className="p-8">
        {view === 'admin' ? (
          <Admin />
        ) : view === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          <div className="max-w-[1440px] mx-auto">
            {/* Region & Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-brand/10 text-brand text-[10px] font-black px-2 py-1 border border-brand/20 rounded">LIVE BRACKET</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{activeRegion} Regional</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex gap-4">
                  {regions.map(r => (
                    <button 
                      key={r}
                      onClick={() => setActiveRegion(r)}
                      className={`text-3xl font-display font-black italic transition-all ${activeRegion === r ? 'text-white' : 'text-slate-700 hover:text-slate-500'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={handleQuickFill} className="btn-secondary text-xs flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand" /> AUTO FILL CHALK
                </button>
              </div>
            </div>

            {/* Bracket Tree */}
            <div className="relative overflow-x-auto pb-20 scrollbar-hide min-h-[900px]">
              <div className="flex items-start gap-0">
                {[1, 2, 3, 4].map((round, rIndex) => (
                  <div key={round} className="w-[320px] shrink-0 pt-10">
                    <div className="px-6 mb-8">
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest opacity-50 mb-1">Round {round}</p>
                      <h3 className="text-xl font-display font-black italic text-white uppercase italic">
                        {round === 1 ? 'Round of 64' : round === 2 ? 'Round of 32' : round === 3 ? 'Sweet 16' : 'Elite 8'}
                      </h3>
                    </div>

                    <div className="flex flex-col h-full relative" style={{ gap: `${getRoundSpacing(round) - MATCHUP_HEIGHT}px`, marginTop: `${(getRoundSpacing(round) / 2) - (MATCHUP_HEIGHT / 2)}px` }}>
                      {getRegionGames(activeRegion, round).map((game, gIndex) => {
                        const teamA = getTeamById(selections[game.childA_id || ''] || game.teamA_id);
                        const teamB = getTeamById(selections[game.childB_id || ''] || game.teamB_id);
                        
                        return (
                          <div key={game.id} className="relative bracket-game-container px-6">
                            <Matchup 
                              gameId={game.id} 
                              teamA={teamA} 
                              teamB={teamB}
                              winnerId={game.winner_id || undefined}
                            />
                            
                            {/* Connectors to next round */}
                            {round < 4 && (
                              <div className="bracket-connector-out" style={{ right: '0', top: '50%' }} />
                            )}
                            
                            {/* Inbound vertical connectors */}
                            {round > 1 && (
                              <>
                                <div className="bracket-connector-in" style={{ left: '-24px', top: '50%' }} />
                                <div className="bracket-connector-vertical" 
                                  style={{ 
                                    left: '-24px', 
                                    height: `${getRoundSpacing(round-1)}px`,
                                    top: gIndex % 2 === 0 ? '50%' : 'auto',
                                    bottom: gIndex % 2 === 1 ? '50%' : 'auto'
                                  }} 
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
