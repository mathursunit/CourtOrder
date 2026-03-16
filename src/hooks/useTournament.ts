import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
  childA_id?: string | null; // ID of the game that produces teamA
  childB_id?: string | null; // ID of the game that produces teamB
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

    const unsubTeams = onSnapshot(teamsRef, (snapshot) => {
      const teamsList: Team[] = [];
      snapshot.forEach(doc => {
        teamsList.push(doc.data() as Team);
      });
      setTeams(teamsList);
    });

    const unsubGames = onSnapshot(query(gamesRef, orderBy('round'), orderBy('slot_index')), (snapshot) => {
      const gamesList: Game[] = [];
      snapshot.forEach(doc => {
        gamesList.push(doc.data() as Game);
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
