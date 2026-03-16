import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculateTotalScore } from '../../lib/scoring';
import { useTournament } from '../../hooks/useTournament';
import { TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function RankingsSidebar() {
  const [entries, setEntries] = useState<any[]>([]);
  const { games } = useTournament();

  useEffect(() => {
    const fetchRankings = async () => {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const results: any[] = [];
      
      for (const userDoc of snap.docs) {
        const bracketRef = collection(db, 'users', userDoc.id, 'brackets');
        const bSnap = await getDocs(bracketRef);
        bSnap.forEach(d => {
          if (d.id === '2026') {
            const data = d.data();
            results.push({
              name: data.userName || 'Anonymous',
              score: calculateTotalScore(data.selections || {}, games)
            });
          }
        });
      }
      setEntries(results.sort((a, b) => b.score - a.score).slice(0, 5));
    };

    if (games.length > 0) fetchRankings();
  }, [games]);

  return (
    <div className="w-80 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Live Rankings</h3>
        <TrendingUp className="w-4 h-4 text-brand animate-pulse" />
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <div key={i} className="bg-glass border border-glass-border rounded-xl p-4 flex items-center justify-between group hover:border-brand/30 transition-all">
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-lg font-black italic w-6",
                i === 0 ? "text-brand" : i === 1 ? "text-slate-300" : "text-slate-600"
              )}>
                {i + 1}.
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white group-hover:text-brand transition-colors">{entry.name}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Verified Bracket</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-brand tabular-nums">{entry.score}</span>
              <p className="text-[9px] font-black text-slate-600 uppercase">Points</p>
            </div>
          </div>
        ))}
        
        {entries.length === 0 && (
          <p className="text-[10px] font-black text-slate-600 uppercase text-center py-8">Establishing Standings...</p>
        )}
      </div>
    </div>
  );
}
