import { useMemo } from 'react';
import { Matchup } from './Matchup';
import type { Game, Team } from '../../hooks/useTournament';

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
    // Mapping logic: 
    // Left: East & South regions
    // Right: West & Midwest regions
    // Center: Final Four (R5) and Championship (R6)
    
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
             <div key={game.id} className="relative">
                <Matchup 
                  gameId={game.id} 
                  teamA={teamA} 
                  teamB={teamB} 
                  winnerId={game.winner_id || undefined}
                />
                {/* Connectors would go here, matching the image's diagonal style */}
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
    <div className="flex items-stretch justify-between w-full min-w-[1600px] h-full px-4 overflow-x-auto scrollbar-hide py-12 bg-surface/40 backdrop-blur-3xl rounded-3xl border border-glass-border">
      {/* LEFT HALF */}
      <div className="flex gap-16">
        {/* Round 1 (L) */}
        {renderRound('left', 1)}
        {/* Round 2 (L) */}
        {renderRound('left', 2)}
        {/* Sweet 16 (L) */}
        {renderRound('left', 3)}
        {/* Elite 8 (L) */}
        {renderRound('left', 4)}
      </div>

      {/* CENTER: FINAL FOUR & CHAMPIONSHIP */}
      <div className="flex flex-col items-center justify-center gap-12 w-96">
        <div className="flex flex-col items-center gap-6">
          <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Final Four</span>
          <div className="flex gap-4">
             {finalFourLeft && (
                <Matchup 
                   gameId={finalFourLeft.id} 
                   teamA={getTeamById(selections[finalFourLeft.childA_id || ''] || finalFourLeft.teamA_id)}
                   teamB={getTeamById(selections[finalFourLeft.childB_id || ''] || finalFourLeft.teamB_id)}
                   winnerId={finalFourLeft.winner_id || undefined}
                />
             )}
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

        <div className="flex flex-col items-center gap-6 mt-12 scale-110">
           <span className="text-xs font-black text-accent uppercase tracking-[0.5em] animate-pulse">Championship</span>
           {championshipGame && (
              <Matchup 
                 gameId={championshipGame.id} 
                 teamA={getTeamById(selections[championshipGame.childA_id || ''] || championshipGame.teamA_id)}
                 teamB={getTeamById(selections[championshipGame.childB_id || ''] || championshipGame.teamB_id)}
                 winnerId={championshipGame.winner_id || undefined}
              />
           )}
           <div className="mt-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center mb-4">
                 <img src="https://www.ncaa.com/modules/custom/ncaa_mm_bracket/images/logo_mm.png" className="w-10 opacity-50 grayscale invert" />
              </div>
              <h3 className="text-2xl font-display font-black text-white italic tracking-tighter">WINNER</h3>
           </div>
        </div>
      </div>

      {/* RIGHT HALF */}
      <div className="flex gap-16 flex-row-reverse">
        {/* Round 1 (R) */}
        {renderRound('right', 1)}
        {/* Round 2 (R) */}
        {renderRound('right', 2)}
        {/* Sweet 16 (R) */}
        {renderRound('right', 3)}
        {/* Elite 8 (R) */}
        {renderRound('right', 4)}
      </div>
    </div>
  );
}
