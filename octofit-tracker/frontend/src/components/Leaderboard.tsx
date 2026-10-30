import { ApiResource } from './ApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  return (
    <ApiResource<LeaderboardResponse>
      title="Leaderboard"
      path="/api/leaderboard"
      emptyMessage="No leaderboard scores yet."
      isEmpty={(data) => data.leaderboard.length === 0}
      render={({ leaderboard }) => (
        <ol>
          {leaderboard.map((entry) => (
            <li key={entry.teamName}>
              <strong>{entry.teamName}</strong> — {entry.totalPoints} points (rank {entry.rank})
            </li>
          ))}
        </ol>
      )}
    />
  );
}
