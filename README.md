# Wolfie Lists — CSE 316 Homework 4

The Wolfie Lists application from HW3, now with **user accounts**, written in
**TypeScript**, and storing its data in **PostgreSQL**, a relational database,
instead of MongoDB. It is still a React client (Vite, now with React Router) in
front of an Express API.

- Anybody can create an account with an email address, a password and an
  avatar image. We manage the accounts ourselves; there is no single sign-on.
- Passwords are stored only as **bcrypt** hashes.
- Logging in hands the browser a **JSON Web Token** in an **httpOnly cookie**,
  and our own Express middleware checks it on every request for a user's data.
- Every list has an **owner**, and a user can only ever see, open, change or
  delete their own lists.

You are given a partly built application. Your job is to finish it, style one
page with Tailwind, and write one Playwright test file. The full instructions
are in the HW4 handout; this file is the quick reference.

---

## Running it

You need **Node 20.19 or later** and **PostgreSQL 16 or later**. The EDB
installer for Windows and macOS also installs **pgAdmin**, a program for looking
inside your databases. **Write down the password the installer asks you to choose
for the `postgres` user.** You will need it, and nothing remembers it for you.

Create the database once, in pgAdmin (right click *Databases*, then *Create*,
then *Database...*, named `wolfie_lists`, encoding UTF8) or with psql:

```sql
CREATE DATABASE wolfie_lists ENCODING 'UTF8';
```

Then:

```
npm install                          # installs shared, server and client (npm workspaces)
copy server\.env.example server\.env # macOS/Linux: cp server/.env.example server/.env
                                     # then put your postgres password and a JWT_SECRET in it
npm run seed                         # makes the tables, wipes them, and makes the example accounts
npm run dev                          # Express on 4000 and Vite on 9000, together
```

Open http://localhost:9000. Port 5432 is PostgreSQL itself, not a web page.

Once seeding works, these are the example accounts, from
`server/data/starter_accounts.json`:

| Email | Password | Lists |
|---|---|---|
| joe@shmo.com | 12345678 | Events to Attend, CSE 316 Homework 1 |
| jane@doe.com | abcdefgh | Stony Brook University Bucket List |

**On a fresh checkout very little works, on purpose.** The splash screen and
the sign up form appear, but `npm run seed` and Create Account both stop with
`hashPassword has not been written yet`, and nobody can log in. Each task below
brings back another part of the application, so do them in order.

---

## What you do

1. **Write the migration `server/migrations/002_add_item_details.sql`.** The
   `items` table has no `priority`, `target_date` or `completed` column.
   Add them with `ALTER TABLE`: `priority` is text, never null, `'Low'` by
   default, and only ever `'High'`, `'Medium'` or `'Low'`; `target_date` is a
   date that may be null; `completed` is a boolean, never null, false by default.
2. **Hash passwords.** In `server/src/auth/passwords.ts`, write `hashPassword`
   and `passwordMatches` with bcrypt, using `BCRYPT_ROUNDS` from `config.ts`.
   After this, `npm run seed` and Create Account work.
3. **Log in.** Add `POST /api/auth/login` to `authRoutes.ts` and a `login`
   controller to `authController.ts`, and write `login` in the client's
   `api.ts`. `register` is your example.
4. **Authenticate every request.** Write the `authenticate` middleware in
   `server/src/middleware/authenticate.ts` and mount it in `app.ts` so that it
   guards `/api/users` and `/api/lists` but not `/api/auth`.
5. **Guard the pages and log out.** In `client/src/layouts/AppLayout.tsx`, show
   `Loading…` until the server has said who is logged in, and send anybody who
   is not to `/`. `PublicLayout.tsx` is your example. Then write `logout` in
   `SessionContext.tsx`.
6. **Write the SQL for three list routes** in `listController.ts`, and add them
   to `listRoutes.ts`: `GET /api/lists`, `PUT /api/lists/:id` and
   `POST /api/lists/:id/duplicate`. `getList`, `createList` and `deleteList`
   are your examples, and `copyItems` is written for you.
7. **Change a password.** Add `PUT /api/users/me/password` and its controller,
   and write `changePassword` in `api.ts`.
8. **Style the Account page with Tailwind.** `AccountContainer.tsx` and
   `AvatarPicker.tsx` have lost their classes. Make the page match the
   screenshot in the handout.
9. **Write `tests/e2e/isolation.spec.ts`.** Two tests are written; write the
   nine marked `test.fixme`.

---

## The tests are the specification

```
npm test            # the server's tests, then the client's (Vitest)
npm run test:e2e    # the whole application in a real Chrome (Playwright)
npm run typecheck   # tsc over both packages
```

The whole test suite ships with this project and describes the finished
application. On a fresh checkout most of it fails. **Making it pass is the
assignment**, along with the styling and your own end to end tests. You are
done when `npm test`, `npm run test:e2e` and `npm run typecheck` are all clean,
the Account page matches the screenshot, and your nine tests are written.

| Tier | Where | What runs |
|---|---|---|
| server unit | `server/tests/unit` | the rules, the DTOs, bcrypt, tokens and `authenticate`, no database |
| server integration | `server/tests/integration` | real HTTP requests (Supertest) against the real app and a real PostgreSQL; also the schema itself |
| client unit | `client/tests/unit` | the model, `api.ts`, hooks, small components |
| client integration | `client/tests/integration` | the real `<App />` and its routes, against a fake server that stands in for `fetch` |
| end to end | `tests/e2e` | Chrome, Vite, Express and PostgreSQL together |

None of the tests touch your `wolfie_lists` database. The server and end to
end tests start a throwaway PostgreSQL of their own (the `embedded-postgres`
package), so they work even before your own database is set up.

---

## Where things are

```
shared/              the contract: DTO types and the rules both sides share
server/              the Express API, in TypeScript, run by tsx
  migrations/          numbered SQL files; the server runs any it has not run yet
  src/db.ts            the connection pool, query() and withTransaction()
  src/controllers/     auth, user and list controllers, with their SQL
  src/routes/          which URL goes to which controller
  src/dto/             exactly what crosses the network
  src/auth/            bcrypt (passwords.ts) and JWTs (tokens.ts)
  src/middleware/      authenticate, uploadAvatar, request logger, 404, errors
  src/app.ts           the middleware chain; server.ts starts it
client/              the React app (Vite, React Router, Tailwind)
  src/App.tsx          every route, and the layouts around them
  src/layouts/         PublicLayout and AppLayout
  src/pages/           one thin component per URL
  src/containers/      components that fetch, navigate and decide
  src/components/      components that only draw what they are given
  src/context/         ModalContext, SessionContext, CurrentListContext
  src/lib/api.ts       the one door to the server
tests/e2e/           Playwright specs, config and helpers
```
