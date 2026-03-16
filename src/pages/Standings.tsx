import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, TrendingUp, User as UserIcon } from 'lucide-react';
import { calculateTotalScore } from '../lib/scoring';
import { useTournament } from '../hooks/useTournament';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  picks: Record<string, string>;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [debugLog, setDebugLog] = useState<string>("Initializing...");
  const { games } = useTournament();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setDebugLog("Connecting to Broadcast Feed...");
        
        // Use the Consolidated Public Mirror to bypass permission issues
        const leaderboardRef = doc(db, 'tournaments', '2026', 'public', 'leaderboard');
        const snap = await getDoc(leaderboardRef);
        
        if (snap.exists()) {
          const data = snap.data();
          const rawEntries = data.entries || [];
          setDebugLog(`Feed Sync Complete. Entries: ${rawEntries.length}`);
          
          // Re-calculate scores locally with current games data
          const calculatedEntries = rawEntries.map((e: any) => ({
             ...e,
             score: calculateTotalScore(e.picks || {}, games)
          }));
          
          setEntries(calculatedEntries.sort((a: any, b: any) => b.score - a.score));
        } else {
          setDebugLog("Broadcast Feed not found. Checking Fallback...");
          // Fallback to direct collection query if public mirror isn't ready
          const usersRef = collection(db, 'users');
          const querySnapshot = await getDocs(usersRef);
          
          const allEntries: LeaderboardEntry[] = [];
          for (const userDoc of querySnapshot.docs) {
            const userData = userDoc.data();
            allEntries.push({
              userId: userDoc.id,
              userName: userData.displayName || 'Anonymous',
              picks: {},
              score: 0
            });
          }
          setEntries(allEntries);
          setDebugLog(`Fallback Query: ${querySnapshot.docs.length} found`);
        }
      } catch (err: any) {
        console.error("Leaderboard error:", err);
        setDebugLog(`ERROR: ${err.message || 'PERMISSION DENIED'}`);
      } finally {
        setLoadingEntries(false);
      }
    };

    fetchLeaderboard();
  }, [games]);

  if (loadingEntries) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium italic">Syncing with Tournament Feed...</p>
        <p className="text-[10px] text-brand/40 uppercase font-black">{debugLog}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-brand/20 rounded-2xl border border-brand/30">
          <Trophy className="w-8 h-8 text-brand" />
        </div>
        <div>
          <h1 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase">Leaderboard V4.2.9</h1>
          <p className="text-slate-400 font-medium italic">Official 2026 March Madness Standings</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contestant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.length > 0 ? entries.map((entry, index) => (
              <tr key={entry.userId} className="group hover:bg-brand/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-black italic ${
                      index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-slate-500"
                    }`}>
                      #{index + 1}
                    </span>
                    {index < 3 && <TrendingUp className="w-4 h-4 text-brand animate-pulse" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-brand transition-colors">
                        {entry.userName}
                      </div>
                      <div className="text-xs text-slate-500 uppercase font-black tracking-tighter">
                        Verified Contestant
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-2xl font-black text-brand tabular-nums">
                    {entry.score}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-6 py-24 text-center">
                  <p className="text-slate-400 italic mb-4">No brackets submitted yet. Be the first to enter!</p>
                  <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800/50 border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    System Diagnostic: {debugLog}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
