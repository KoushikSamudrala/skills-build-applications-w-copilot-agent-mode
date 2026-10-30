import { ApiResource } from './ApiResource.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  return (
    <ApiResource<TeamResponse>
      title="Teams"
      path="/api/teams"
      emptyMessage="No teams yet."
      isEmpty={(data) => data.teams.length === 0}
      render={({ teams }) => (
        <ul>
          {teams.map((team) => (
            <li key={team.name}>
              <strong>{team.name}</strong>
              {team.mascot && <> — Mascot: {team.mascot}</>}
              {' — '}
              {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
