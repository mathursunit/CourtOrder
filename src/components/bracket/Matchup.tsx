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
          "w-full flex items-center justify-between px-3 py-2.5 text-left transition-all relative group/team",
          isBottom ? "border-t border-white/5" : "",
          isSelected ? "bg-[#00f2ff]/10" : "hover:bg-white/[0.03]",
          !team && "opacity-20"
        )}
      >
        <div className="flex items-center gap-3 z-10 transition-transform group-hover/team:translate-x-1">
          <span className={cn(
            "text-[10px] font-black w-4 text-center",
            isSelected ? "text-[#00f2ff]" : "text-slate-500"
          )}>
            {team?.seed || ''}
          </span>
          <span className={cn(
            "text-xs font-black tracking-tight uppercase truncate max-w-[150px]",
            isSelected ? "text-white" : "text-slate-400 group-hover/team:text-slate-200"
          )}>
            {team?.name || 'TBD'}
          </span>
        </div>

        {isSelected && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
             <Trophy className="w-3 h-3 text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
          </div>
        )}

        {isMasterWinner && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]" title="Official Result" />
        )}
        
        {isSelected && (
          <div className="absolute inset-y-0 left-0 w-1 bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-[#112240]/40 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden w-64 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:border-[#00f2ff]/30 hover:shadow-[#00f2ff]/5 transition-all duration-500">
      {renderTeam(teamA, false)}
      {renderTeam(teamB, true)}
    </div>
  );
}
