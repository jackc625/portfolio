# Optimize AI

A full-stack personal fitness platform for tracking workouts, nutrition, habits, and body composition. Built with Next.js 15, Supabase, and TypeScript, with a focus on data correctness, user isolation, and production-grade security.

---

## Overview

Optimize AI is a self-hosted fitness dashboard where users manage their workout programs, log training sessions with set-level detail, track daily habits with streak calculations, monitor weight trends over time, and calculate personalized macro nutrition targets based on their body metrics and goals.

The application enforces strict data isolation at the database layer through PostgreSQL Row-Level Security policies on every table, validates all data at runtime with Zod schemas, and uses a layered hook-based architecture that keeps business logic cleanly separated from UI.

<!-- CASE-STUDY-START -->

## Problem

Personal fitness data is sensitive — body weight, body composition, and training history. Most multi-tenant fitness apps enforce tenant isolation in the application layer: a WHERE clause on every query, an authorization check in every handler, middleware that hopes no one hits the API directly. One forgotten filter in one hot code path becomes an enumeration vulnerability for every other user's data, and that bug class has shipped in enough real products to be embarrassing. I wanted a fitness platform where cross-user data leakage was structurally impossible even if the application code had bugs: authorization had to live in the database, every runtime value had to be schema-checked before it hit the component tree, and the streak logic had to survive a user in any timezone without the UTC-midnight off-by-one that breaks consecutive-day math.

## Approach & Architecture

I built Optimize AI as a Next.js 15 App Router application with Supabase providing Postgres, auth, and storage — zero custom API routes. All data operations go hooks → Supabase PostgREST → Postgres, with Row-Level Security handling what would otherwise be middleware authorization checks.

The defining decision is the RLS policy set across all nine tables: `user_profiles`, `habits`, `habit_logs`, `weight_logs`, `user_macros`, `workouts`, `workout_exercises`, `workout_logs`, `workout_log_exercises`. Tables with a direct `user_id` column enforce `(SELECT auth.uid()) = user_id`. Child tables (`workout_exercises`, `workout_log_exercises`) derive ownership through `EXISTS` subqueries against their parent, so exercises inherit isolation from the workout that owns them without denormalizing `user_id` onto every row. Even if a hook accidentally omits a filter, Postgres returns only the rows the caller's JWT authorizes.

The data layer is hook-per-domain on TanStack React Query v5. Each hook — `useHabits`, `useWeightLogs`, `useWorkouts`, `useMacros`, `useUser` — encapsulates its Supabase query, Zod `safeParse`, cache key, and mutation logic. The UI layer never touches Supabase directly, so every call has exactly one place where schemas are enforced. No unsafe `as` assertions; TypeScript strict is enabled project-wide.

The macro calculator is a four-function pipeline: `calculateBMR` runs Mifflin-St Jeor with sex-specific offsets (`+5` male, `-161` female), `calculateTDEE` multiplies BMR by activity factor (sedentary 1.2×, moderate 1.55×, active 1.9×), goal adjustment applies a per-goal offset (fat loss −400 kcal, muscle gain +250, recomp 0), and `getMacroSplit` divides the adjusted calories into protein/fat/carb grams using goal-tuned ratios. Each is a pure function with full Vitest coverage.

Habit streaks are the other hot-spot. I store all date-sensitive values as `YYYY-MM-DD` strings in the user's local timezone through a dedicated `getLocalDate()` utility, rather than UTC. The `useHabits` composite query fetches habits, fetches completion logs, walks backward from today through consecutive local dates to compute streaks, and fetches today's completions separately so the UI reflects taps instantly. Session management uses a cookie-bridge: Next.js middleware checks the Supabase session cookie on every `/dashboard/*` route, and an `onAuthStateChange` listener clears the cookie on token expiry. Open-redirect injection on the login `?redirect=` parameter is blocked with a `startsWith("/") && !startsWith("//")` check.

## Tradeoffs

RLS imposes a per-query policy evaluation that a middleware-only design would skip, so every read pays the planner cost of the `auth.uid()` subquery — small for the workloads a personal fitness app sees, and it eliminates a bug class that middleware cannot. Supabase locks me into Postgres, their PostgREST conventions, and their auth model; acceptable for a solo project where the alternative is maintaining a custom API tier. Storing dates as local `YYYY-MM-DD` strings makes cross-timezone aggregation harder if I ever wanted a global leaderboard, but for a personal tracker timezone correctness on the streak math is worth more than theoretical portability. Skipping server actions and API routes means every table change requires an RLS policy migration, not just a code change — a disciplined constraint that has kept the schema honest.

## Outcome

Optimize AI ships across nine PostgreSQL tables, all with RLS enabled, covering five fitness domains (workouts, nutrition, habits, weight, profile). The macro pipeline runs BMR → TDEE → goal adjustment → macro split as four pure functions with full Vitest coverage. The data layer is hook-per-domain on React Query v5, wrapping Supabase queries with Zod `safeParse`. Styling is Tailwind CSS 3.4 over a CSS-variable token system that gives both light and dark themes through next-themes. Framer Motion 12 handles page transitions. Vitest 4 with Testing Library and MSW covers BMR variants, TDEE multipliers, macro splits, date correctness, Zod schema edges, and component renders through a shared `renderWithProviders` wrapper. CI runs ESLint and type-check on every push through GitHub Actions.

## Learnings

The subtlest bug was in streak calculation. My first implementation stored completion timestamps in UTC, so a user completing a habit at 11pm EST had the log land on the next calendar day in UTC — their streak appeared broken even though they had hit it on time. The fix was switching every date-sensitive column to `YYYY-MM-DD` strings in local time and routing every read through `getLocalDate()`. The broader lesson was that timezone correctness is not a storage detail to paper over with formatters — it is a schema decision made once, up front, enforced everywhere. The second lesson came from designing RLS for child tables. My first draft added `user_id` to every table, which felt simple but denormalized ownership and meant three places to keep in sync on every write. The `EXISTS`-subquery pattern against the parent's `user_id` kept the schema normalized, the policy readable, and made new tables cheap. Authorization became a schema shape, not a code path.

<!-- CASE-STUDY-END -->

---

## Key Features

### Workout Management
- Create reusable workout templates with named exercises, set/rep schemes, and rest intervals
- Log workout sessions against templates, recording actual reps completed and weight used per set
- Full CRUD on templates and exercises with ordered display

### Macro Nutrition Calculator
- Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation (sex-specific)
- Derives Total Daily Energy Expenditure with configurable activity multipliers (sedentary 1.2x, moderate 1.55x, active 1.9x)
- Applies goal-specific calorie adjustments: fat loss (-400 kcal), muscle gain (+250 kcal), recomposition (maintenance)
- Computes protein/fat/carb gram targets from goal-tuned macro ratios
- Supports manual overrides with a saved history of past calculations

### Habit Tracking
- Add custom daily habits with one-tap completion
- Automatic consecutive-day streak calculation using timezone-safe local dates
- Today's completion state tracked separately for instant UI feedback

### Weight Tracking
- Daily weight logging with duplicate-per-day prevention
- Paginated history (30 entries per page) with inline edit and delete
- Recharts line chart with goal weight reference line for visual progress

### Body Profile
- Collects height, weight, age, biological sex, fitness goal, and activity level
- Profile data feeds directly into macro calculations
- First-login gate redirects new users to profile setup before dashboard access

### Authentication & Session Management
- Supabase Auth with email/password
- Middleware-protected dashboard routes via cookie bridge pattern
- Real-time session expiry detection with automatic redirect and user notification
- Open-redirect prevention on login redirect paths

### UI System
- Light/dark mode with system preference detection, persisted to localStorage
- CSS variable-based design token system (no hardcoded colors anywhere)
- Framer Motion page transitions and staggered card reveal animations
- Canvas confetti effects on habit completion
- Responsive layout: collapsible sidebar on desktop, bottom tab bar on mobile

---

## Technical Highlights

### Database-Level Data Isolation
All 9 PostgreSQL tables enforce Row-Level Security. Tables with a direct `user_id` column use `(SELECT auth.uid()) = user_id` policies. Child tables without a `user_id` (like `workout_exercises` and `workout_log_exercises`) use `EXISTS` subqueries against their parent table's ownership, keeping data denormalization minimal while still enforcing access control at every level.

### Runtime Validation at Every Boundary
Every Supabase response is validated through Zod `safeParse` before entering the application. No unsafe `as` type assertions. TypeScript strict mode is enforced project-wide. This catches schema drift and unexpected nulls before they propagate.

### Hook-Based Data Layer
All data access flows through custom React hooks built on TanStack React Query v5. Each hook encapsulates its Supabase query, Zod validation, cache key, mutation logic, and toast feedback. The UI layer never touches Supabase directly.

### Timezone-Safe Date Handling
Habit logs, weight logs, and workout logs all store dates as `YYYY-MM-DD` strings in the user's local timezone rather than UTC timestamps. A dedicated `getLocalDate()` utility ensures streak calculations and "already logged today" checks are correct regardless of server timezone.

### Structured Error Handling
A `logError` utility provides structured error logging with context labels, timestamps, and automatic Supabase error code detection. All mutations surface user-facing feedback via toast notifications on both success and error paths.

---

## Architecture

```
Pages (src/app/)
  └── Components (src/components/)
        └── Hooks (src/hooks/)
              └── Supabase Client (src/lib/)
                    └── PostgreSQL + RLS (Supabase)
```

- **Pages** — Next.js App Router pages handle routing, auth guards, and page-level composition
- **Components** — Presentational and feature components (ProfileForm, MacroSummary, WeightChart, Sidebar, etc.)
- **Hooks** — React Query queries and mutations encapsulating all Supabase calls with Zod validation
- **Utils** — Pure business logic (BMR/TDEE/macro calculations, date formatting, structured logging)
- **Schemas** — Zod schemas for profile, macro, and workout data validation
- **Middleware** — Next.js edge middleware protecting `/dashboard/*` routes via cookie check

The application has no custom API routes or server actions. All data operations go directly from client-side hooks to Supabase's PostgREST API, with RLS policies enforcing authorization at the database layer.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.3.2 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI Library | React 19 |
| Styling | Tailwind CSS 3.4 with CSS variable tokens |
| Components | shadcn/ui + Radix UI primitives |
| State / Data Fetching | TanStack React Query 5 |
| Validation | Zod 3.25 |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password) |
| Charts | Recharts 3.8 |
| Animations | Framer Motion 12, canvas-confetti |
| Icons | Lucide React |
| Theme | next-themes (class-based dark mode) |
| Notifications | react-hot-toast |
| Testing | Vitest 4, Testing Library, MSW |
| CI | GitHub Actions (ESLint + TypeScript type-check) |

---

## Feature Deep Dive

### Macro Calculator Pipeline

The macro calculation flows through four pure functions:

1. **`calculateBMR`** — Mifflin-St Jeor formula: `10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161)`
2. **`calculateTDEE`** — Multiplies BMR by activity level factor
3. **Goal adjustment** — Applies calorie offset based on goal (fat loss: -400, muscle gain: +250, recomp: +0)
4. **`getMacroSplit`** — Splits adjusted calories into protein/fat/carb grams using goal-specific ratios (e.g., fat loss: 40% protein, 30% fat, 30% carbs)

Each calculation is a standalone pure function with full Vitest coverage. The `MacroSummary` component allows users to override any computed value before saving to their macro history.

### Workout System

The workout domain uses a template-and-log pattern across four tables:

- **`workouts`** — Named templates (e.g., "Push Day", "5x5 Strength")
- **`workout_exercises`** — Exercises within a template, ordered by `display_order`, with set count, rep scheme, and rest time
- **`workout_logs`** — Dated session records tied to a template
- **`workout_log_exercises`** — Per-set records within a logged session capturing `exercise_name`, `set_number`, `reps_completed`, and `weight`

This design supports future progressive overload tracking by preserving granular set-level history.

### Habit Streak Engine

The `useHabits` hook performs a composite query:
1. Fetches all user habits
2. Fetches all completed habit logs
3. Groups logs by habit and calculates streaks by walking backward from today through consecutive dates
4. Separately fetches today's completions for instant UI state

Streak calculation uses local-timezone dates to avoid the common bug where UTC midnight causes a user's streak to appear broken or doubled.

---

## Data Model

```
user_profiles
  ├── habits ──────── habit_logs
  ├── weight_logs
  ├── user_macros
  ├── workouts ────── workout_exercises
  └── workout_logs ── workout_log_exercises
```

**9 tables total**, all with Row-Level Security enabled:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | Identity + fitness metrics | name, age, height_cm, weight_kg, sex, goal, activity_level, goal_weight_kg |
| `habits` | User-defined daily habits | title |
| `habit_logs` | Daily completion records | habit_id, date, completed |
| `weight_logs` | Body weight entries | date, weight_kg |
| `user_macros` | Saved macro calculations | calories, protein_grams, fat_grams, carb_grams |
| `workouts` | Workout templates | name |
| `workout_exercises` | Exercises in a template | name, sets_count, reps, rest_seconds, display_order |
| `workout_logs` | Logged training sessions | workout_id, log_date, notes |
| `workout_log_exercises` | Per-set performance data | exercise_name, set_number, reps_completed, weight |

All tables use UUID primary keys. Tables with user-owned data include a `user_id` foreign key. Child tables (`workout_exercises`, `workout_log_exercises`) derive ownership through their parent table via `EXISTS` subquery RLS policies.

---

## Security & Production Considerations

- **Row-Level Security** on all 9 tables with `(SELECT auth.uid()) = user_id` policies (direct or via parent join)
- **Middleware auth guard** on all `/dashboard/*` routes, checking session cookie before page load
- **Open-redirect prevention** — login redirect parameter validated against path injection (`startsWith("/") && !startsWith("//")`)
- **Session expiry detection** — `onAuthStateChange` listener detects mid-session token expiry, clears cookie, notifies user, and redirects
- **Zod safeParse at all data boundaries** — no unvalidated database responses enter the component tree
- **TypeScript strict mode** — catches null/undefined issues at compile time
- **SameSite=Lax cookies** — mitigates CSRF on the auth cookie
- **No secrets in client bundle** — only `NEXT_PUBLIC_` Supabase URL and anon key (safe for client use; authorization enforced by RLS)

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── auth/login, signup/       # Authentication pages
│   ├── dashboard/                # Protected application pages
│   │   ├── habits/               # Habit tracker
│   │   ├── weight/               # Weight tracker
│   │   ├── workouts/             # Workout templates + logging
│   │   │   ├── new/              # Create workout
│   │   │   └── [id]/            # Template detail + session logging
│   │   ├── macros/history/       # Macro calculation history
│   │   └── profile/setup, edit/  # Profile management
│   ├── layout.tsx                # Root layout with providers
│   └── providers.tsx             # React Query + Theme providers
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # Sidebar + BottomTabBar
│   ├── motion/                   # PageTransition, CardReveal, confetti
│   ├── profile/                  # ProfileForm
│   ├── macros/                   # MacroSummary
│   ├── weight/                   # WeightChart
│   └── theme/                    # ThemeToggle
├── hooks/                        # React Query hooks per domain
│   ├── habits/                   # useHabits, useAddHabit, useCompleteHabit, useDeleteHabit
│   ├── weight/                   # useWeightLogs, useGoalWeight, useAddWeightLog, useUpdateWeightLog, useDeleteWeightLog
│   ├── workouts/                 # useWorkouts, useWorkoutExercises, useWorkoutLogs
│   ├── macros/                   # useMacros
│   └── profile/                  # useUser
├── schemas/                      # Zod validation schemas
├── types/                        # TypeScript interfaces for DB tables
├── utils/
│   ├── macros/                   # BMR, TDEE, macro split calculations
│   ├── dates/                    # Timezone-safe date utilities
│   └── logger.ts                 # Structured error logging
├── lib/
│   ├── supabaseClient.ts         # Supabase singleton
│   └── utils.ts                  # Tailwind class merge utility
├── middleware.ts                  # Auth route protection
└── __tests__/                    # Vitest test suites
supabase/
└── migrations/                   # RLS policy migration
.github/
└── workflows/ci.yml              # Lint + type-check on push/PR
```

---

## User Flow

1. **Sign up / Log in** — Email + password via Supabase Auth
2. **Profile setup** — First-time users are redirected to enter body metrics and fitness goal
3. **Dashboard** — Overview of today's weight, habits completed, macro targets, and recent workouts
4. **Track habits** — Add habits, tap to complete daily, watch streaks grow
5. **Log weight** — Enter today's weight, view trend chart against goal
6. **Manage workouts** — Create templates with exercises, log sessions recording per-set performance
7. **Review macros** — View calculated targets, override as needed, save snapshots to history

---

## Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase project URL and anon key to .env.local

# Start development server
npm run dev

# Run tests
npx vitest run

# Lint + type-check
npm run lint && npm run type-check
```

Requires a [Supabase](https://supabase.com) project with the 9 tables and RLS policies applied (see `supabase/migrations/`).

---

## Testing

The project includes a Vitest test suite covering:

- **Macro calculations** — BMR formula (male/female), TDEE multipliers, macro splits for each goal type, full pipeline integration
- **Date utilities** — Local timezone formatting correctness
- **Zod schemas** — Validation edge cases for profile and workout data
- **Hooks** — React Query behavior with mocked Supabase client (pagination, error paths)
- **Components** — Render tests for ThemeToggle, Button variants, WeightChart

Test infrastructure includes Testing Library for component rendering, MSW for HTTP mocking, and a shared `renderWithProviders` wrapper that sets up QueryClient and ThemeProvider.

---

## Extensibility

The architecture was designed to support additional fitness modules without structural changes:

- **Hook-per-domain pattern** — New features (e.g., meal planning, sleep tracking) follow the same hooks/schemas/components structure
- **RLS policy template** — Adding tables with user isolation requires only a standard `user_id` column and the established policy pattern
- **Design token system** — New UI surfaces inherit the full light/dark theme automatically through CSS variables
- **React Query cache** — New domains get independent cache keys with built-in stale-while-revalidate behavior
- **Zod schema library** — Validation schemas are composable and extend to new data shapes

---

## Summary

Optimize AI is a production-oriented fitness platform that prioritizes data correctness and security at every layer. Row-Level Security ensures complete user data isolation. Zod validation catches schema issues before they reach the UI. The hook-based architecture keeps business logic testable and separated from presentation. The result is a system that is straightforward to extend, safe to deploy, and built on patterns that scale with the product.
