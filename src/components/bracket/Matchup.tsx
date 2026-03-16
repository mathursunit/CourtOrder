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
          "w-full flex items-center justify-between px-4 py-3 text-left transition-all relative group/team",
          isBottom ? "border-t border-white/5" : "",
          isSelected ? "bg-brand/10" : "hover:bg-white/[0.04]",
          !team && "opacity-30"
        )}
      >
        <div className="flex items-center gap-4 z-10">
          <span className={cn(
            "text-[11px] font-black w-5 text-center transition-colors",
            isSelected ? "text-brand" : "text-slate-600"
          )}>
            {team?.seed || '—'}
          </span>
          <span className={cn(
            "text-sm font-black tracking-tight uppercase truncate max-w-[160px] transition-colors",
            isSelected ? "text-white" : "text-slate-300 group-hover/team:text-white"
          )}>
            {team?.name || 'TBD'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isSelected && (
            <Trophy className="w-4 h-4 text-brand drop-shadow-neon animate-in zoom-in duration-300" />
          )}
          {isMasterWinner && (
            <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-warm animate-pulse" title="Official Winner" />
          )}
        </div>
        
        {isSelected && (
          <div className="absolute inset-y-0 left-0 w-1 bg-brand shadow-neon" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-surface-soft/60 backdrop-blur-xl border border-glass-border rounded-xl overflow-hidden w-72 shadow-2xl hover:border-brand/40 hover:shadow-brand/5 transition-all duration-500 group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {renderTeam(teamA, false)}
      {renderTeam(teamB, true)}
    </div>
  );
}
