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
 * against the official master results stored in the games array.
 */
export function calculateTotalScore(
  userSelections: Record<string, string>,
  games: { id: string, round: number, winner_id?: string | null }[]
): number {
  let score = 0;

  games.forEach(game => {
    const userWinner = userSelections[game.id];
    const actualWinner = game.winner_id;

    if (userWinner && actualWinner && userWinner === actualWinner) {
      score += ROUND_WEIGHTS[game.round] || 0;
    }
  });

  return score;
}
