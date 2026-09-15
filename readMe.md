# Session Booker

A web app for university students to book studio time. Students book fixed 45-minute
slots in a single studio room; admins have oversight of all bookings.

## Stack

- **Backend:** Node.js / Express
- **Database:** MongoDB
- **ODM:** Mongoose
- **Frontend:** Vite / React
- **Language:** TypeScript (strict mode)

## Booking Rules

- Single studio room (no multi-room support in v1)
- Fixed 45-minute slots, starting on the hour, **8:00am–4:00pm, Monday–Friday** (9 slots/day)
- Students can book a **maximum of 3 slots per week**, resetting every **Monday**
- Bookings are **instantly confirmed** — no approval step
- **Double-booking is not allowed** for any given day + slot combination
- No recurring bookings in v1
- Auth is handled in-house via **JWT session tokens**

## Actors

- **Student** — books own sessions, subject to the weekly cap
- **Admin** — can view all bookings, delete any booking, and see usage stats (e.g. sessions booked this week, who booked what)

## Data Model Design

### `Booking`

A booking is represented by two fields rather than a single timestamp:

- `date: Date` — the calendar day, **normalized to midnight UTC** via a Mongoose setter.
  This is *not* the slot's start time — it identifies which day, nothing more.
- `slotIndex: Number` (0–8) — which of the 9 fixed daily slots (8:00, 9:00, ... 4:00) the
  booking is for.

**Why split it this way instead of storing a single slot timestamp?**
Storing an exact `Date` for the slot start (e.g. `2026-09-01T08:00:00`) is fragile —
if the client and server ever disagree on timezone, "8:00am" can silently drift into
a different time, corrupting slot matching. Splitting `date` (day only, always
normalized server-side) from `slotIndex` (a plain integer, immune to timezone math)
removes that entire class of bug, while still keeping `date` as a real `Date` so range
queries (e.g. "all bookings this week") stay simple.

**Double-booking prevention:** a compound **unique index** on `{ date: 1, slotIndex: 1 }`
is enforced by MongoDB itself, atomically, on every write. This closes the
race condition where two students could both submit a booking for the same day+slot
within milliseconds of each other — the database rejects the second write outright,
rather than relying on an application-level "check then write" pattern that has a gap
between the check and the write.

**Date normalization** happens via a Mongoose **setter** on the `date` field
(using `setUTCHours`, not `setHours`, to avoid server-timezone-dependent midnight
values), so any code path that assigns `date` gets it normalized automatically. The
same normalization logic is reused when building query filters, so stored data and
query values always compare correctly.

**The frontend never constructs the `Date` object.** It sends a plain
`{ date: "2026-09-01", slotIndex: 3 }` payload; the backend is the source of truth for
normalization, since a client-constructed `Date` is a common source of subtle
timezone-related bugs.

### `User`

Standard fields: `name`, `email` (unique), `passwordHash` (never plaintext), and
`role` (`'student' | 'admin'`).

### Interfaces vs. schemas

TypeScript interfaces (`IUser`, `IBooking`) are defined **separately** from the
Mongoose schemas, rather than inferred from them. This is more explicit and decouples
domain types from the DB document shape — useful later if a type needs to diverge from
the raw document (e.g. a "populated" booking with `student` expanded to a full `IUser`
instead of an `ObjectId`).

## Business Rules vs. Data Validation

- **Schema-level validation** (`required`, `min`/`max`, `enum`, the unique index) lives
  on the Mongoose schema — these are properties of what a *valid document* looks like.
- **Business rules** that require cross-document context — like the weekly 3-slot cap —
  live in a **separate service layer**, called from route handlers before hitting the
  database. This keeps the rule testable in isolation, keeps the model focused on data
  shape, and leaves room for exceptions later (e.g. an admin override) without touching
  the schema.

### Weekly cap race condition

A naive "count existing bookings, then create if under 3" check has a race condition:
two requests from the same student, milliseconds apart, could both pass the count
check before either one saves. This is solved with a **Mongoose transaction**
(`session.withTransaction(...)`), which wraps the count-check and the create into a
single atomic unit — if the create fails or the callback throws, nothing in the
transaction is persisted.

Note: the double-booking case (two *different* students colliding on the same slot)
does **not** need a transaction — the unique index alone handles that atomically,
independent of transactions. The transaction specifically protects the weekly-cap
check, which is a read-then-write pattern.

**Requirement:** Mongoose transactions require MongoDB to be running as a **replica
set** (even a single-node one) — they do not work against a standalone `mongod`. MongoDB
Atlas clusters are replica sets by default, so this is a non-issue in production; local
dev and CI need to be configured accordingly (see Testing below).

## TypeScript Setup

- **`tsx`** for local dev (`tsx watch src/index.ts`) — faster than `ts-node-dev`,
  no extra config needed for auto-restart.
- **Strict mode is enabled from the start** — easier to build a project strict from day
  one than retrofit it later.
- `types` is **explicitly declared** in `tsconfig.json` (`["jest", "node"]`) rather than
  relying on TypeScript's automatic `@types/*` discovery, after running into a project-wide
  issue where Jest's global types (`describe`, `it`, `expect`, etc.) weren't being picked
  up automatically despite `@types/jest` being correctly installed. Explicit `types` is a
  more reliable pattern in general and is worth keeping as a default.

## Testing

- **`@swc/jest`**, not `ts-jest`, is used to transform TypeScript for tests. This was a
  deliberate swap: pinning the TypeScript compiler version down to satisfy `ts-jest`'s
  peer dependency range would have meant the test build and the production build
  behaved differently. `@swc/jest` only transpiles (strips types, doesn't check them),
  which is fast but means **type-checking is no longer part of running tests**.
- To avoid losing type-safety coverage, **`npm run typecheck` (`tsc --noEmit`) runs before
  `jest`** in the `test` script, so a type error still fails the run — just as a separate,
  explicit step rather than bundled into Jest itself.
- **`mongodb-memory-server`**, configured via `MongoMemoryReplSet` (not the plain
  `MongoMemoryServer`), boots an in-memory **single-node replica set** for tests — needed
  specifically because the weekly-cap logic depends on transactions, which standalone
  MongoDB instances don't support.
- The replica set is started **once globally** for the entire test run (Jest
  `globalSetup`/`globalTeardown`), not per test file, since well-isolated tests (each
  clearing their own data via `afterEach`) don't need a fresh server per file — this
  is faster overall.
  - `globalSetup`/`globalTeardown` run in Jest's main process and can share state via
    `globalThis`. Individual test files run in **separate worker processes** and can
    only receive data passed through `process.env`, which is why the replica set's
    connection URI is passed via `process.env.MONGO_URI` rather than `globalThis`.
- **`--runInBand`** is used to run all test files serially in a single process, rather
  than Jest's default parallel worker pool. This is required because all test files
  share the same in-memory database — running them in parallel workers would cause
  cross-file races (one file's `afterEach` cleanup wiping data another file just wrote).
  The trade-off is slower total test runtime as the suite grows; a future option if that
  becomes a problem is giving each test file its own database name within the same
  shared `mongod` instance.

## CI / Git Hooks

- **Husky** runs `npm run typecheck` on `pre-commit` — fast enough to not discourage
  committing, catching type errors before they even reach a PR.
- **GitHub Actions** (`.github/workflows/ci.yml`) runs `typecheck` and a non-watch test
  script (`test:ci`, using `jest --runInBand --coverage` without `--watchAll`) on push
  and PR against `main`. The `test` script (with `--watchAll`) is for local interactive
  use only — it would hang indefinitely if used in CI.

## Open / Not Yet Decided

- Routes (booking CRUD, admin views) — not yet designed
- Whether students can cancel their own bookings, or only admins can delete bookings