import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Team {
  id: string;
  name: string;
  seed: number;
  region: string;
}

export interface Game {
  id: string;
  round: number;
  region: string;
  teamA_id?: string | null;
  teamB_id?: string | null;
  childA_id?: string | null;
  childB_id?: string | null;
  winner_id: string | null;
  slot_index: number;
}

export function useTournament(year: string = '2026') {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamsRef = collection(db, 'tournaments', year, 'teams');
    const gamesRef = collection(db, 'tournaments', year, 'games');

    // Fetch teams
    const unsubTeams = onSnapshot(teamsRef, (snapshot) => {
      const teamsList: Team[] = [];
      snapshot.forEach(doc => {
        teamsList.push(doc.data() as Team);
      });
      setTeams(teamsList);
    });

    // Fetch ALL games for the tournament and handle sorting/filtering in-memory
    // This avoids needing complex composite indexes for every query permutation
    const unsubGames = onSnapshot(gamesRef, (snapshot) => {
      const gamesList: Game[] = [];
      snapshot.forEach(doc => {
        gamesList.push(doc.data() as Game);
      });
      
      // Sort: Round first, then slot_index
      gamesList.sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return (a.slot_index || 0) - (b.slot_index || 0);
      });

      setGames(gamesList);
      setLoading(false);
    });

    return () => {
      unsubTeams();
      unsubGames();
    };
  }, [year]);

  return { teams, games, loading };
}
