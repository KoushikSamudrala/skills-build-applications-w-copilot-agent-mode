# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record the plan before implementation and keep each change within the tier that owns it.

- Presentation tier decision: Use one React route per capability and the shared API client for relative `/api` requests. Each route exposes accessible loading, empty, success, and error states; components do not construct API URLs or call `fetch` directly.
- Logic tier decision: Keep HTTP request parsing and status codes in Express routes, and put validation and business behavior in service functions. Reject malformed or missing input with deliberate 4xx responses rather than leaking database cast errors or returning success-shaped fallbacks.
- Data tier decision: Use Mongoose models for users, teams, activities, and workouts. Express required fields, defaults, and references in schemas; keep seed data stable and idempotent with upserts, without clearing unrelated records.
- Activity tracking approach: Accept existing `userId` and `teamId` values, validate their format and existence, and create an activity linked to those records. Compute points from the submitted activity and minutes, and persist an occurrence date.
- Team management approach: List and create teams while preserving their submitted name and mascot. Default members to an empty array, and reject a missing name with `400`.
- Leaderboard approach: Aggregate activity points by team, sort from highest total to lowest, and return each team's name, total points, and 1-based rank.
- Workout suggestions approach: Find the user by email and use their fitness goal and recent activity to select and explain relevant workout suggestions. Return a deliberate 4xx response when no user matches.

## Test plan

Run the focused contract tests while implementing each tier, then run all checks before integration review. A failing assertion identifies a contract the current implementation does not yet satisfy; diagnose that assertion and change the owning tier rather than weakening the test.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — failures indicate missing model constraints/defaults or seed behavior that is incomplete, non-idempotent, or alters unrelated records.
- API tier: `npm run test:api --prefix octofit-tracker/backend` — failures indicate incorrect endpoint behavior, validation, status codes, relationships, ranking, or workout selection/reasons.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` — failures indicate missing API-backed content, incorrect requests, or absent/inaccessible loading, empty, or error states.
- Backend build: `npm run build --prefix octofit-tracker/backend` — failures indicate TypeScript or backend compilation errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — failures indicate frontend type-checking or production-bundling errors.
