import { useState, useEffect } from 'react';
import { Trophy, Users, Settings, ChevronRight, ChevronLeft, Zap, LogOut, LogIn } from 'lucide-react';
import { useBracketStore } from './store/useBracketStore';
import { useAuthStore } from './store/useAuthStore';
import { useTournament } from './hooks/useTournament';
import { Matchup } from './components/bracket/Matchup';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import Admin from './pages/Admin';

type ViewMode = 'bracket' | 'admin';

function App() {
  const [view, setView] = useState<ViewMode>('bracket');
  const { user, login, logout } = useAuthStore();
  const { selections, resetBracket, setPick, setSelections } = useBracketStore();
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

  const handleQuickFill = (type: 'random' | 'higher-seed') => {
    games.forEach(game => {
      const t1 = teams[game.team_1_id];
      const t2 = teams[game.team_2_id];
      if (t1 && t2) {
        if (type === 'random') {
          setPick(game.id, Math.random() > 0.5 ? t1.id : t2.id);
        } else {
          setPick(game.id, t1.seed <= t2.seed ? t1.id : t2.id);
        }
      }
    });
  };

  const nextRegion = () => {
    const idx = regions.indexOf(activeRegion);
    setActiveRegion(regions[(idx + 1) % regions.length]);
  };

  const prevRegion = () => {
    const idx = regions.indexOf(activeRegion);
    setActiveRegion(regions[(idx - 1 + regions.length) % regions.length]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-sports-accent animate-pulse" />
          <p className="font-bold tracking-widest text-sports-accent uppercase">Loading Tournament Data...</p>
        </div>
      </div>
    );
  }

  if (view === 'admin') return <Admin />;

  // Helper to get winner for a game
  const getWinner = (gameId: string) => teams[selections[gameId]];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 glass-card rounded-none border-t-0 border-x-0 border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sports-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.4)]">
            <Trophy className="text-sports-navy w-6 h-6 border-none" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">
            Court<span className="text-sports-accent">Order</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setView('bracket')} 
            className={`font-bold transition-all px-2 py-1 ${view === 'bracket' ? "text-sports-accent border-b-2 border-sports-accent" : "text-slate-400 hover:text-white"}`}
          >
            BRACKET
          </button>
          <a href="#" className="font-bold text-slate-400 hover:text-white transition-colors">LEADERBOARD</a>
          <button 
            onClick={() => setView('admin')} 
            className={`font-bold transition-all px-2 py-1 ${(view as string) === 'admin' ? "text-sports-error border-b-2 border-sports-error" : "text-slate-400 hover:text-white"}`}
          >
            ADMIN
          </button>
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white uppercase">{user.displayName}</span>
                <span className="text-[10px] text-sports-accent font-medium">RANK #--</span>
              </div>
              <button 
                onClick={() => logout()}
                className="p-1.5 rounded-full hover:bg-white/5 transition-colors group"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-sports-error" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => login()}
              className="flex items-center gap-2 px-4 py-2 bg-sports-accent/10 border border-sports-accent/30 rounded-lg hover:bg-sports-accent/20 transition-all group"
            >
              <LogIn className="w-4 h-4 text-sports-accent" />
              <span className="text-xs font-bold text-sports-accent uppercase">Sign In</span>
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={resetBracket} className="text-sm font-bold text-slate-400 hover:text-sports-error transition-colors uppercase tracking-widest">
            Reset
          </button>
          <div className="w-10 h-10 rounded-full bg-sports-slate border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-20 md:w-64 glass-card rounded-none border-y-0 border-l-0 border-white/10 hidden sm:flex flex-col p-4 gap-4">
          <div className="p-4 glass-card border-sports-accent/30">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">My Score</h3>
            <p className="text-3xl font-black text-sports-accent">0</p>
            <p className="text-xs text-slate-500 uppercase tracking-tighter">Rank: #--</p>
          </div>
          
          <div className="mt-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Quick Actions</h3>
            <button 
              onClick={() => handleQuickFill('higher-seed')}
              className="w-full btn-primary flex items-center justify-center gap-2 group text-sm"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">Chalk (Higher Seed)</span>
            </button>
            <button 
              onClick={() => handleQuickFill('random')}
              className="w-full glass-card py-2 flex items-center justify-center gap-2 hover:border-sports-accent text-slate-400 text-sm"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Randomize</span>
            </button>
          </div>
        </aside>

        {/* Bracket Grid */}
        <section className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tight">Main Bracket</h2>
                <p className="text-slate-400 text-sm">2026 March Madness Live Entry</p>
              </div>
              
              <div className="flex gap-2 items-center">
                <button onClick={prevRegion} className="p-2 glass-card hover:border-sports-accent transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="px-6 py-2 glass-card border-sports-accent flex items-center justify-center min-w-[150px]">
                  <span className="font-bold tracking-widest uppercase text-sports-accent">{activeRegion} Region</span>
                </div>
                <button onClick={nextRegion} className="p-2 glass-card hover:border-sports-accent transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 items-start">
              {/* ROUND 1 */}
              <div className="space-y-4">
                <h4 className="text-center font-bold text-slate-500 uppercase tracking-widest text-xs mb-4">Round 1</h4>
                <div className="flex flex-col gap-4">
                  {games.filter(g => g.round === 1 && g.region === activeRegion).map(game => (
                    <Matchup 
                      key={game.id} 
                      gameId={game.id}
                      team1={teams[game.team_1_id]}
                      team2={teams[game.team_2_id]}
                    />
                  ))}
                </div>
              </div>

              {/* ROUND 2 */}
              <div className="space-y-4 pt-12 md:pt-24">
                <h4 className="text-center font-bold text-slate-500 uppercase tracking-widest text-xs mb-4">Round 2</h4>
                <div className="flex flex-col gap-[120px]"> 
                  {[1, 2, 3, 4].map(idx => {
                    const gId = `${activeRegion.toLowerCase()}-r2-g${idx}`;
                    const c1 = `${activeRegion.toLowerCase()}-r1-g${idx * 2 - 1}`;
                    const c2 = `${activeRegion.toLowerCase()}-r1-g${idx * 2}`;
                    return (
                      <Matchup 
                        key={gId}
                        gameId={gId}
                        team1={getWinner(c1)}
                        team2={getWinner(c2)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* SWEET 16 */}
              <div className="space-y-4 pt-24 md:pt-[240px]">
                <h4 className="text-center font-bold text-slate-500 uppercase tracking-widest text-xs mb-4">Sweet 16</h4>
                <div className="flex flex-col gap-[350px]">
                  {[1, 2].map(idx => {
                    const gId = `${activeRegion.toLowerCase()}-r3-g${idx}`;
                    const c1 = `${activeRegion.toLowerCase()}-r2-g${idx * 2 - 1}`;
                    const c2 = `${activeRegion.toLowerCase()}-r2-g${idx * 2}`;
                    return (
                      <Matchup 
                        key={gId}
                        gameId={gId}
                        team1={getWinner(c1)}
                        team2={getWinner(c2)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* ELITE 8 */}
              <div className="space-y-4 pt-48 md:pt-[450px]">
                <h4 className="text-center font-bold text-slate-500 uppercase tracking-widest text-xs mb-4">Elite 8</h4>
                <div className="flex flex-col gap-4">
                  <Matchup 
                    gameId={`${activeRegion.toLowerCase()}-r4-g1`}
                    team1={getWinner(`${activeRegion.toLowerCase()}-r3-g1`)}
                    team2={getWinner(`${activeRegion.toLowerCase()}-r3-g2`)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="h-10 bg-black border-t border-white/5 flex items-center px-6 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
          <span className="text-xs font-bold text-sports-accent uppercase">SYSTEM STATUS:</span>
          <span className="text-xs text-slate-400 uppercase tracking-widest">Firestore Connected</span>
          <span className="text-xs text-slate-400 uppercase tracking-widest">Tournament: 2026 Men's Division I</span>
          <span className="text-xs text-slate-400 uppercase tracking-widest">Entry Window: {Object.keys(selections).length === 63 ? 'COMPLETE' : 'PENDING'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
