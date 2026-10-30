import { ApiResource } from './ApiResource.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };
const userEmail = 'mona@example.com';

export default function Workouts() {
  return (
    <ApiResource<WorkoutResponse>
      title="Workout suggestions"
      path={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
      emptyMessage="No workout suggestions available."
      isEmpty={(data) => data.suggestions.length === 0}
      render={({ suggestions }) => (
        <ul>
          {suggestions.map((suggestion) => (
            <li key={suggestion.title}>
              <strong>{suggestion.title}</strong>
              {suggestion.focus && <> — Focus: {suggestion.focus}</>}
              {suggestion.minutes !== undefined && <> — {suggestion.minutes} minutes</>}
              {suggestion.difficulty && <> — {suggestion.difficulty}</>}
              {suggestion.reason && <p>{suggestion.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
