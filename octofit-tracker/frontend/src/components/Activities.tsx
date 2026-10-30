import { ApiResource } from './ApiResource.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  return (
    <ApiResource<ActivityResponse>
      title="Activities"
      path="/api/activities"
      emptyMessage="No activities yet."
      isEmpty={(data) => data.activities.length === 0}
      render={({ activities }) => (
        <ul>
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${index}`}>
              <strong>{activity.type}</strong> — {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    />
  );
}
