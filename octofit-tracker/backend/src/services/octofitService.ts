import { Activity, Team, User, Workout } from '../models/index.js';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required', 400);

  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw httpError('Valid userId and teamId are required', 400);
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw httpError('Activity type is required', 400);
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError('Activity minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw httpError('The specified user or team does not exist', 404);

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required', 400);

  const { name, mascot } = input;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw httpError('Team name is required', 400);
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw httpError('Team mascot is required', 400);
  }

  let members: string[] = [];
  if (input.members !== undefined) {
    if (!Array.isArray(input.members) || !input.members.every(isObjectId)) {
      throw httpError('Team members must be an array of valid user IDs', 400);
    }
    members = [...new Set(input.members)];
    const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
    if (existingMembers.length !== members.length) {
      throw httpError('One or more team members do not exist', 404);
    }
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members });
  return team.toObject();
}

export async function getLeaderboard() {
  const [teams, activities] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.find().select('team points').lean(),
  ]);
  const pointsByTeam = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    pointsByTeam.set(teamId, (pointsByTeam.get(teamId) ?? 0) + activity.points);
  }

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('fitnessGoal').lean();
  if (!user) throw httpError('No user found for that email address', 404);

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityType = recentActivity?.type.trim().toLowerCase();
  const rankedWorkouts = [...workouts].sort((left, right) => {
    const score = (focus: string) => {
      const normalizedFocus = focus.trim().toLowerCase();
      return normalizedFocus === goal ? 0 : normalizedFocus === activityType ? 1 : 2;
    };
    return score(left.focus) - score(right.focus) || left.title.localeCompare(right.title);
  });

  return rankedWorkouts.map((workout) => {
    const focus = workout.focus.trim().toLowerCase();
    const reason = focus === goal
      ? `Matches your ${user.fitnessGoal} fitness goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`
      : focus === activityType
        ? `Based on your recent ${recentActivity?.type} activity.`
        : `A general suggestion to support your ${user.fitnessGoal} fitness goal.`;
    return { ...workout, reason };
  });
}

export { User };
