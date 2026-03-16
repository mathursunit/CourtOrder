import React from 'react';
import { useBracketStore } from '../../store/useBracketStore';
import type { Team } from '../../hooks/useTournament';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MatchupProps {
  gameId: string;
  team1: Team | undefined;
  team2: Team | undefined;
}

export const Matchup: React.FC<MatchupProps> = ({ gameId, team1, team2 }) => {
  const { selections, setPick } = useBracketStore();
  const selectedId = selections[gameId];

  const handlePick = (teamId: string) => {
    setPick(gameId, teamId);
  };

  return (
    <div className="flex flex-col gap-1 p-2 glass-card border-white/5 w-full hover:border-sports-accent/30 transition-all group">
      <div 
        onClick={() => team1 && handlePick(team1.id)}
        className={cn(
          "flex items-center justify-between p-2 rounded cursor-pointer transition-all",
          selectedId === team1?.id ? "bg-sports-accent/20 border border-sports-accent" : "hover:bg-white/5",
          !team1 && "opacity-30 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 w-4">{team1?.seed}</span>
          <span className={cn("text-xs font-bold uppercase", selectedId === team1?.id ? "text-sports-accent" : "text-slate-200")}>
            {team1?.name || "TBD"}
          </span>
        </div>
        {selectedId === team1?.id && <div className="w-1.5 h-1.5 rounded-full bg-sports-accent shadow-[0_0_8px_#00F5FF]" />}
      </div>

      <div className="h-px bg-white/5 mx-2" />

      <div 
        onClick={() => team2 && handlePick(team2.id)}
        className={cn(
          "flex items-center justify-between p-2 rounded cursor-pointer transition-all",
          selectedId === team2?.id ? "bg-sports-accent/20 border border-sports-accent" : "hover:bg-white/5",
          !team2 && "opacity-30 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 w-4">{team2?.seed}</span>
          <span className={cn("text-xs font-bold uppercase", selectedId === team2?.id ? "text-sports-accent" : "text-slate-200")}>
            {team2?.name || "TBD"}
          </span>
        </div>
        {selectedId === team2?.id && <div className="w-1.5 h-1.5 rounded-full bg-sports-accent shadow-[0_0_8px_#00F5FF]" />}
      </div>
    </div>
  );
};
