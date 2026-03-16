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
import { RankingsSidebar } from './components/bracket/RankingsSidebar';
import { FullBracketView } from './components/bracket/FullBracketView';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewMode = 'bracket' | 'leaderboard' | 'admin' | 'dashboard' | 'history';

function App() {
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('courtorder_view');
    return (saved as ViewMode) || 'bracket';
  });
  const { user, login, logout } = useAuthStore();
  const { selections, setSelections } = useBracketStore();
  const { teams, games, loading } = useTournament();
  const [activeRegion, setActiveRegion] = useState('East');
  const [isFullView, setIsFullView] = useState(true);

  useEffect(() => {
    localStorage.setItem('courtorder_view', view);
  }, [view]);

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
    <div className="min-h-screen bg-surface text-white font-body selection:bg-brand/30">
      {/* Broadcast Header */}
      <header className="h-20 border-b border-glass-border bg-surface/80 backdrop-blur-2xl sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setView('bracket')}>
            <Trophy className="w-8 h-8 text-brand drop-shadow-neon transition-transform group-hover:scale-110" />
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black italic tracking-tighter leading-none text-white group-hover:text-brand transition-colors">COURTORDER</span>
              <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 leading-none mt-1">BROADCAST EDITION</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {['DASHBOARD', 'BRACKET', 'LEADERBOARD', 'HISTORY', 'ADMIN'].map(m => (
              <button 
                key={m}
                onClick={() => setView(m.toLowerCase() as any)}
                className={cn(
                  "px-6 py-2 rounded-lg text-[11px] font-black tracking-widest transition-all",
                  view === m.toLowerCase() ? "bg-brand/10 text-brand border border-brand/20 shadow-neon" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {m}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 bg-glass border border-glass-border pl-6 pr-2 py-2 rounded-2xl shadow-xl">
              <div className="text-right border-r border-white/10 pr-4">
                <p className="text-[11px] font-black text-brand leading-none mb-1 uppercase tracking-wider">{userScore} TOTAL PTS</p>
                <div className="flex items-center justify-end gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-sm font-black text-white leading-none">{user.displayName}</p>
                </div>
              </div>
              <button onClick={() => logout()} className="p-2 hover:bg-accent/10 hover:text-accent rounded-xl transition-all group">
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          ) : (
            <button onClick={() => login()} className="btn-primary">LOG IN TO PLAY</button>
          )}
        </div>
      </header>

      {/* Live Status Banner */}
      <div className="bg-accent/10 border-b border-accent/20 h-10 flex items-center justify-center gap-3 overflow-hidden">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Tournament in Progress - All Brackets Locked!</span>
        </span>
        <span className="text-white/20">|</span>
        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Next Round: Sweet 16 Begins Thursday, Mar 26</span>
      </div>

      <main className="flex-1">
        {view === 'admin' ? <Admin /> : 
         view === 'leaderboard' ? <Leaderboard /> :
         view === 'dashboard' || view === 'history' ? (
           <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
             <Trophy className="w-16 h-16 text-brand/20" />
             <h2 className="text-2xl font-display font-black italic text-brand">FEATURE COMING SOON</h2>
             <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Broadcast Feed Under Construction</p>
           </div>
         ) : (
          <div className="h-full flex flex-col pt-6 px-8">
            <div className="flex items-center justify-between mt-8 mb-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-5xl font-display font-black italic tracking-tighter text-white">MY 2026 BRACKET</h2>
                <div className="flex items-center gap-4 mt-2">
                   <button 
                      onClick={() => setIsFullView(true)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                        isFullView ? "bg-brand text-surface border-brand shadow-neon" : "bg-white/5 border-white/10 text-slate-400"
                      )}
                    >
                      Full Bracket
                    </button>
                  <div className="flex bg-surface-soft p-1 rounded-xl border border-white/5">
                    {regions.map(r => (
                      <button
                        key={r}
                        onClick={() => { setActiveRegion(r); setIsFullView(false); }}
                        className={cn(
                          "px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                          (!isFullView && activeRegion === r) ? "bg-brand text-surface shadow-neon" : "text-slate-500 hover:text-white"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                 <div className="flex flex-col items-end gap-1 px-6 border-r border-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Filters</span>
                    <button className="flex items-center gap-2 bg-glass px-3 py-1.5 rounded-lg border border-glass-border">
                       <span className="text-xs font-black text-white uppercase">User selections</span>
                       <Trophy className="w-3 h-3 text-brand" />
                    </button>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 bg-brand rounded shadow-neon" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Winning Selection</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 bg-accent rounded shadow-warm" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tournament Result</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* THE BRACKET COMMAND CENTER */}
            <div className="flex-1 flex gap-12 overflow-hidden">
               {isFullView ? (
                  <FullBracketView games={games} teams={teams} selections={selections} />
               ) : (
                  <>
                    <div className="flex-1 overflow-x-auto pb-12 scrollbar-hide">
                      <div className="flex flex-row flex-nowrap items-stretch gap-12 min-h-[900px] w-max pt-4">
                      {[1, 2, 3, 4].map((round) => {
                        const roundGames = getRegionGames(activeRegion, round);
                        
                        return (
                          <div key={round} className="flex flex-col min-w-[280px]">
                            <div className="mb-6">
                              <p className="text-[9px] font-black text-brand uppercase tracking-widest opacity-60">Round {round}</p>
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
                                    
                                    {round < 4 && (
                                      <div className="absolute right-0 top-1/2 w-12 h-[2px] bg-brand/20 shadow-[0_0_8px_rgba(0,242,255,0.1)]" />
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
                  </>
               )}

              {/* Sidebar - Integrated as per Gemini design */}
              <div className="hidden 2xl:block">
                <RankingsSidebar />
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
           <span>V4.2.5-STITCH</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
