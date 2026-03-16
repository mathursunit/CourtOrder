import { useMemo } from 'react';
import { Matchup } from './Matchup';
import type { Game, Team } from '../../hooks/useTournament';
import { Trophy } from 'lucide-react';

interface FullBracketViewProps {
  games: Game[];
  teams: Team[];
  selections: Record<string, string>;
}

export function FullBracketView({ games, teams, selections }: FullBracketViewProps) {
  const getTeamById = (id: string | null | undefined) => {
    if (!id) return undefined;
    return teams.find(t => t.id === id);
  };

  const getGames = (side: 'left' | 'right' | 'center', round: number) => {
    if (side === 'center') {
       return games.filter(g => g.round === round && (g.region?.toLowerCase() === 'final four' || !g.region));
    }

    const sideRegions = side === 'left' ? ['east', 'south'] : ['west', 'midwest'];
    return games.filter(g => 
      g.round === round && 
      sideRegions.includes(g.region?.toLowerCase() || '')
    ).sort((a, b) => (a.slot_index || 0) - (b.slot_index || 0));
  };

  const renderRound = (side: 'left' | 'right', round: number) => {
    const roundGames = getGames(side, round);
    return (
      <div className={`flex flex-col justify-around gap-4 py-8 ${side === 'right' ? 'items-end' : 'items-start'}`}>
        {roundGames.map(game => {
          const teamA = getTeamById(selections[game.childA_id || ''] || game.teamA_id);
          const teamB = getTeamById(selections[game.childB_id || ''] || game.teamB_id);
          
          return (
             <div key={game.id} className="relative group">
                <Matchup 
                  gameId={game.id} 
                  teamA={teamA} 
                  teamB={teamB} 
                  winnerId={game.winner_id || undefined}
                />
             </div>
          );
        })}
      </div>
    );
  };

  const championshipGame = useMemo(() => games.find(g => g.round === 6), [games]);
  const finalFourLeft = useMemo(() => games.find(g => g.round === 5 && g.slot_index === 0), [games]);
  const finalFourRight = useMemo(() => games.find(g => g.round === 5 && g.slot_index === 1), [games]);

  return (
    <div className="relative w-full min-w-[1600px] h-full px-8 py-12 bg-surface/40 backdrop-blur-3xl rounded-[3rem] border border-glass-border overflow-x-auto scrollbar-hide select-none">
      <div className="flex items-stretch justify-between h-full">
        {/* LEFT HALF: EAST & SOUTH */}
        <div className="flex gap-16 relative">
          <div className="absolute -top-6 left-0 flex flex-col gap-1">
             <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Conferences</span>
             <h3 className="text-xl font-display font-black text-white italic">EAST / SOUTH</h3>
          </div>
          {renderRound('left', 1)}
          {renderRound('left', 2)}
          {renderRound('left', 3)}
          {renderRound('left', 4)}
        </div>

        {/* CENTER: CHAMPIONSHIP PODIUM */}
        <div className="flex flex-col items-center justify-center gap-16 w-[400px] relative z-10">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-[0.03] pointer-events-none">
             <Trophy className="w-[400px] h-[400px] text-white" />
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[9px] font-black text-brand uppercase tracking-[0.5em] animate-pulse">Semifinal Alpha</span>
               <div className="h-[2px] w-12 bg-brand/30 mb-2" />
               {finalFourLeft && (
                  <Matchup 
                     gameId={finalFourLeft.id} 
                     teamA={getTeamById(selections[finalFourLeft.childA_id || ''] || finalFourLeft.teamA_id)}
                     teamB={getTeamById(selections[finalFourLeft.childB_id || ''] || finalFourLeft.teamB_id)}
                     winnerId={finalFourLeft.winner_id || undefined}
                  />
               )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 relative">
             <div className="absolute -top-12 -left-12 -right-12 -bottom-12 bg-brand/5 blur-3xl rounded-full animate-pulse" />
             <div className="flex flex-col items-center gap-6 relative z-10">
                <div className="px-6 py-1.5 rounded-full bg-accent text-[10px] font-black text-white uppercase tracking-[0.4em] shadow-warm mb-2">Championship</div>
                {championshipGame && (
                   <div className="scale-125 transform transition-transform hover:scale-150 duration-500">
                      <Matchup 
                         gameId={championshipGame.id} 
                         teamA={getTeamById(selections[championshipGame.childA_id || ''] || championshipGame.teamA_id)}
                         teamB={getTeamById(selections[championshipGame.childB_id || ''] || championshipGame.teamB_id)}
                         winnerId={championshipGame.winner_id || undefined}
                      />
                   </div>
                )}
                <div className="mt-16 flex flex-col items-center group cursor-pointer">
                   <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden group-hover:border-brand/40 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img src="https://www.ncaa.com/modules/custom/ncaa_mm_bracket/images/logo_mm.png" className="w-16 opacity-40 grayscale invert relative z-10 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110 transition-all" />
                   </div>
                   <h3 className="text-4xl font-display font-black text-white italic tracking-tighter group-hover:text-brand transition-colors">THE CROWN</h3>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2">MARCH MADNESS 2026</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center gap-8">
             <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-black text-brand uppercase tracking-[0.5em] animate-pulse">Semifinal Beta</span>
                <div className="h-[2px] w-12 bg-brand/30 mb-2" />
                {finalFourRight && (
                   <Matchup 
                      gameId={finalFourRight.id} 
                      teamA={getTeamById(selections[finalFourRight.childA_id || ''] || finalFourRight.teamA_id)}
                      teamB={getTeamById(selections[finalFourRight.childB_id || ''] || finalFourRight.teamB_id)}
                      winnerId={finalFourRight.winner_id || undefined}
                   />
                )}
             </div>
          </div>
        </div>

        {/* RIGHT HALF: WEST & MIDWEST */}
        <div className="flex gap-16 flex-row-reverse relative">
          <div className="absolute -top-6 right-0 flex flex-col gap-1 items-end">
             <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Conferences</span>
             <h3 className="text-xl font-display font-black text-white italic">WEST / MIDWEST</h3>
          </div>
          {renderRound('right', 1)}
          {renderRound('right', 2)}
          {renderRound('right', 3)}
          {renderRound('right', 4)}
        </div>
      </div>
    </div>
  );
}
