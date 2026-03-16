export const ROUND_WEIGHTS: Record<number, number> = {
  1: 1,  // Round of 64
  2: 2,  // Round of 32
  3: 4,  // Sweet 16
  4: 8,  // Elite 8
  5: 16, // Final Four
  6: 32  // Championship
};

/**
 * Calculates the total score for a bracket by comparing user selections
 * against the official master results.
 * 
 * @param userSelections - Map of gameId to teamId picked by the user
 * @param masterResults - Map of gameId to teamId that actually won
 * @param games - List of all games to determine rounds/weights
 */
export function calculateTotalScore(
  userSelections: Record<string, string>,
  masterResults: Record<string, string>,
  games: any[]
): number {
  let score = 0;

  games.forEach(game => {
    const userWinner = userSelections[game.id];
    const actualWinner = masterResults[game.id];

    if (userWinner && actualWinner && userWinner === actualWinner) {
      score += ROUND_WEIGHTS[game.round] || 0;
    }
  });

  return score;
}
