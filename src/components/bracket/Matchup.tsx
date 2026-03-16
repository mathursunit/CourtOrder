
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Trophy } from 'lucide-react';
import type { Team } from '../../hooks/useTournament';
import { useBracketStore } from '../../store/useBracketStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MatchupProps {
  gameId: string;
  teamA?: Team;
  teamB?: Team;
  winnerId?: string;
  isMaster?: boolean;
}

export function Matchup({ gameId, teamA, teamB, winnerId, isMaster }: MatchupProps) {
  const { selections, setPick } = useBracketStore();
  const userPick = selections[gameId];

  const handlePick = (teamId: string) => {
    if (isMaster) return;
    setPick(gameId, teamId);
  };

  const renderTeam = (team: Team | undefined, isBottom: boolean) => {
    const isSelected = userPick === team?.id;
    const isMasterWinner = winnerId && team?.id === winnerId;
    
    return (
      <button
        onClick={() => team && handlePick(team.id)}
        disabled={!team || isMaster}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left transition-all relative overflow-hidden",
          isBottom ? "border-t border-white/5" : "",
          isSelected ? "bg-brand/10" : "hover:bg-brand/5",
          !team && "opacity-30"
        )}
      >
        <div className="flex items-center gap-2 z-10">
          <span className={cn(
            "text-[9px] font-black w-4 opacity-50",
            isSelected ? "text-brand" : "text-slate-500"
          )}>
            {team?.seed || ''}
          </span>
          <span className={cn(
            "text-xs font-bold tracking-tight truncate max-w-[140px]",
            isSelected ? "text-brand" : "text-slate-100"
          )}>
            {team?.name || 'TBD'}
          </span>
        </div>

        {isSelected && (
          <Trophy className="w-3 h-3 text-brand shrink-0" />
        )}

        {isMasterWinner && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Official Result" />
        )}
      </button>
    );
  };

  return (
    <div className="glass-card overflow-hidden w-56 shadow-xl border-white/5 hover:border-brand/40 transition-all duration-300">
      {renderTeam(teamA, false)}
      {renderTeam(teamB, true)}
    </div>
  );
}
