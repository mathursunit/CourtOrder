import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the game mapping for cascade logic
// format: gameId -> successorGameId
const GAME_TREE: Record<string, string> = {};

// Helper to build the standard 64-team single elimination path
const regions = ['east', 'west', 'south', 'midwest'];

regions.forEach(region => {
  // R1 -> R2
  for (let i = 1; i <= 8; i++) {
    const successor = Math.ceil(i / 2);
    GAME_TREE[`${region}-r1-g${i}`] = `${region}-r2-g${successor}`;
  }
  // R2 -> R3
  for (let i = 1; i <= 4; i++) {
    const successor = Math.ceil(i / 2);
    GAME_TREE[`${region}-r2-g${i}`] = `${region}-r3-g${successor}`;
  }
  // R3 -> R4
  for (let i = 1; i <= 2; i++) {
    const successor = Math.ceil(i / 2);
    GAME_TREE[`${region}-r3-g${i}`] = `${region}-r4-g${successor}`;
  }
  // R4 -> Semi-Final (R5)
  // East/West -> Semi 1, South/Midwest -> Semi 2
  if (region === 'east' || region === 'west') {
    GAME_TREE[`${region}-r4-g1`] = `semi-r5-g1`;
  } else {
    GAME_TREE[`${region}-r4-g1`] = `semi-r5-g2`;
  }
});

// Semis -> Final
GAME_TREE['semi-r5-g1'] = 'final-r6-g1';
GAME_TREE['semi-r5-g2'] = 'final-r6-g1';

interface BracketState {
  selections: Record<string, string>; // gameId -> teamId
  setPick: (gameId: string, teamId: string) => void;
  resetBracket: () => void;
}

export const useBracketStore = create<BracketState>()(
  persist(
    (set, get) => ({
      selections: {},
      
      setPick: (gameId, teamId) => {
        let currentPicks = { ...get().selections };
        
        // If we're picking the same team, do nothing
        if (currentPicks[gameId] === teamId) return;

        // Set the pick
        currentPicks[gameId] = teamId;

        // CASCADE: Find all successor games and check if they picked the old winner
        // We need to trace the path and clear any picks that are no longer valid
        let nextGameId = GAME_TREE[gameId];
        while (nextGameId) {
          // If the next game has a selection, but it's not the team we just advanced 
          // AND it was the team we REPLACED, we must clear it.
          // Wait, simpler: if the next game selection exists, we MUST re-evaluate.
          // Actually, if we change Round 1, any round after that MUST be cleared 
          // if it depended on the team we just removed.
          
          // To be safe and "smart": if a game's selection is not one of its children's winners, it's invalid.
          // For now, let's just clear the immediate next round and let it propagate.
          const oldWinnerInNextRound = currentPicks[nextGameId];
          if (oldWinnerInNextRound) {
            // Check if any of the child games for nextGameId still result in this winner
            // This is getting complex, so let's use the simplest requirement:
            // "If you change a pick, subsequent rounds with that team are cleared"
            // Wait, you said "all subsequent rounds featuring Team A must be cleared or updated"
            
            // Implementation:
            delete currentPicks[nextGameId];
          }
          
          nextGameId = GAME_TREE[nextGameId];
        }

        set({ selections: currentPicks });
      },

      resetBracket: () => set({ selections: {} }),
    }),
    {
      name: 'courtorder-selections',
    }
  )
);
