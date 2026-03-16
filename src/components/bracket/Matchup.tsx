import { motion, AnimatePresence } from 'framer-motion';
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
  winnerId?: string; // For master results display
  isMaster?: boolean;
}

export function Matchup({ gameId, teamA, teamB, winnerId, isMaster }: MatchupProps) {
  const { selections, setPick } = useBracketStore();
  const userPick = selections[gameId];

  const handlePick = (teamId: string) => {
    if (isMaster) return; // Can't pick in master view
    setPick(gameId, teamId);
  };

  const renderTeam = (team: Team | undefined, isBottom: boolean) => {
    const isSelected = userPick === team?.id;
    const isMasterWinner = isMaster && winnerId === team?.id;
    const isCorrect = !isMaster && winnerId && userPick === winnerId && isSelected;
    const isWrong = !isMaster && winnerId && userPick !== winnerId && isSelected;

    return (
      <motion.button
        whileHover={team ? { x: 4 } : {}}
        onClick={() => team && handlePick(team.id)}
        disabled={!team || isMaster}
        className={cn(
          "w-full flex items-center justify-between p-3 transition-all duration-200 group relative overflow-hidden",
          isBottom ? "border-t border-glass-border" : "",
          isSelected ? "bg-brand/10" : "hover:bg-brand/5",
          !team && "opacity-40 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3 z-10">
          <span className={cn(
            "text-xs font-bold w-5",
            isSelected ? "text-brand" : "text-slate-500"
          )}>
            {team?.seed || '—'}
          </span>
          <span className={cn(
            "text-sm font-semibold transition-colors",
            isSelected ? "text-brand" : "text-slate-200"
          )}>
            {team?.name || 'TBD'}
          </span>
        </div>

        <AnimatePresence>
          {(isSelected || isMasterWinner) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="z-10"
            >
              <Trophy className={cn(
                "w-4 h-4",
                isCorrect ? "text-emerald-400" : isWrong ? "text-rose-500" : "text-brand"
              )} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Glow Indicator */}
        {isSelected && (
          <motion.div 
            layoutId={`glow-${gameId}`}
            className="absolute inset-0 bg-brand/5 pointer-events-none"
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className="glass-card overflow-hidden w-64 shadow-2xl border-glass-border hover:border-brand/30 transition-colors">
      {renderTeam(teamA, false)}
      {renderTeam(teamB, true)}
    </div>
  );
}
