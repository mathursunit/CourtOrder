import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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
        setDebugLog("Connecting to Firebase...");
        const usersRef = collection(db, 'users');
        
        // Force server source to bypass any local cache issues
        const querySnapshot = await getDocs(usersRef);
        
        setDebugLog(`Query complete. Docs: ${querySnapshot.docs.length}`);
        
        if (querySnapshot.empty) {
          setDebugLog("Collection 'users' is empty or inaccessible.");
        }

        const allEntries: LeaderboardEntry[] = [];
        
        for (const userDoc of querySnapshot.docs) {
          const userData = userDoc.data();
          const bracketRef = collection(db, 'users', userDoc.id, 'brackets');
          const bracketSnap = await getDocs(bracketRef);
          
          let foundBracket = false;
          bracketSnap.forEach(doc => {
            if (doc.id === '2026') {
              foundBracket = true;
              const data = doc.data();
              const score = calculateTotalScore(data.selections || {}, games);
              allEntries.push({
                userId: userDoc.id,
                userName: data.userName || userData.displayName || 'Anonymous',
                picks: data.selections || {},
                score: score
              });
            }
          });

          if (!foundBracket) {
             allEntries.push({
                userId: userDoc.id,
                userName: userData.displayName || 'Anonymous',
                picks: {},
                score: 0
             });
          }
        }

        setEntries(allEntries.sort((a, b) => b.score - a.score));
      } catch (err: any) {
        console.error("Leaderboard error:", err);
        setDebugLog(`Error: ${err.message || 'Unknown error'}`);
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
        <p className="text-slate-400 font-medium italic">Calculating Global Standings...</p>
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
          <h1 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase">Leaderboard V4.2.7</h1>
          <p className="text-slate-400 font-medium">Official 2026 March Madness Rankings</p>
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
                    System Diagnostic: {entries.length} Contestants Loaded
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

