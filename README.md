# Task Manager

A MERN task management application by Adelight Masibo (Nafulah).

- [Public website on Render](https://task-manager-nafulah.onrender.com/login)
- [Frontend on Vercel](https://task-manager-nafulah.vercel.app) (access depends on the project's deployment protection settings)
- [Frontend development notes](Frontend/README.md)

## Features

- Separate login and registration pages. Registration returns to login; login opens the dashboard.
- Create, edit and delete your own tasks.
- Set an optional deadline and a status: Pending, In Progress or Completed.
- Filter tasks by title or status; sort by newest, title, deadline or status. Tasks without deadlines sort last when sorting by deadline.
- Responsive green-themed interface with labeled controls, loading/error messages and keyboard focus support.
- Password hashing, protected API routes and database-backed login sessions with inactivity expiry.

Deadlines and filters are implemented. Reminders, separate task categories and dark mode are not implemented.

## Stack and structure

The frontend uses React, Vite and CSS. The backend uses Node.js, Express, Mongoose, MongoDB, bcryptjs and JSON Web Tokens (JWTs). MongoDB Atlas can host the database.

```text
task-manager/
  Backend/
    models/          User, Task and Session schemas
    routes/          Authentication and task API handlers
    middleware/      Token and session verification
    config/db.js     Separate connection helper; server.js connects directly
    server.js        API entry point and built frontend serving
    session.test.js  Backend session and validation tests
  Frontend/
    src/
      components/    Login, Register and Dashboard
      App.jsx        Page selection, navigation and session lifecycle
      main.jsx       React entry point
      session.js     Shared API helper and browser session checks
      session.test.js
      index.css      Active global styles
    vite.config.js   Development API proxy
    README.md        Frontend development notes
  package.json       Root command shortcuts
  vercel.json        Frontend hosting and Render API rewrites
```

## Local setup

You need Node.js, npm and an accessible MongoDB database. The repository does not pin a Node version; use a version compatible with the installed Vite release.

```bash
git clone https://github.com/Nafulah/task-manager.git
cd task-manager
npm install
```

The root `postinstall` installs both backend and frontend dependencies.

Create `Backend/.env` with your private configuration:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Required MongoDB connection string. |
| `JWT_SECRET` | Required secret for signing and verifying JWTs. |
| `PORT` | Optional backend port; defaults to `5000`. |
| `NODE_ENV` | Set to `development` locally or `production` when deployed. The application does not explicitly branch on it. |

Do not commit `.env` or secret values. The frontend uses relative `/api` URLs and does not currently require frontend environment variables.

Start the backend from the project root in one terminal:

```bash
npm run dev:backend
```

Start the frontend from the project root in a second terminal:

```bash
npm run dev
```

Open the URL Vite prints. `Frontend/vite.config.js` forwards `/api` to `http://localhost:5000`. Update that proxy if you change the backend port. The backend command runs `node server.js`; restart it manually after backend edits.

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`.

## Commands and verification

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm test` | Run backend tests, then frontend tests if backend tests pass. |
| `npm run lint` | Run frontend ESLint checks. |
| `npm run build` | Generate `Frontend/dist`. |
| `npm start` | Start the backend, which also serves `Frontend/dist` when built. |
| `npm run preview` | Preview the Vite build locally; no API proxy is explicitly configured for preview. |

To run one test suite:

```bash
npm --prefix Backend test
npm --prefix Frontend test
```

Both suites use Node's built-in test runner. Backend tests exercise session expiry/renewal, logout, validation and ownership checks using mocked model methods and a local HTTP server. Frontend tests use mocked storage/fetch to check session restoration, timeouts and request errors. They do not validate a real database or the complete browser flow.

Before release, manually check registration, login, task creation/editing/deletion, deadlines, filters, sorting, logout and inactivity expiry. Check direct visits and refreshes at `/login`, `/register` and `/dashboard`, plus keyboard and narrow-screen behavior.

For a local check of the built frontend and API together, run `npm run build`, then `npm start`, and visit the backend URL (normally `http://localhost:5000`).

## Authentication and data flow

1. Registration validates the submitted fields and stores a bcrypt password hash. It does not sign the user in.
2. Login creates a MongoDB `Session` record and a JWT containing the user and session IDs. The JWT has a one-hour lifetime.
3. The browser stores the token, display name, email and last activity time in `localStorage`. The shared API helper sends the token in `x-auth-token`.
4. Protected routes verify both the JWT and an unexpired database session. Browser interaction refreshes an active session through `/api/auth/activity`; ordinary task reads do not renew it.
5. Two minutes of inactivity ends the session. MongoDB's TTL index eventually removes expired session records, but middleware checks expiry immediately without waiting for cleanup. Logout clears browser state and requests server-side session deletion.

The frontend checks stored activity on reload and revalidates the profile with the backend. Browser storage alone does not grant API access. A JWT can still expire after one hour even with activity; there is no token refresh endpoint.

All task routes are protected and scope reads/updates/deletes to the authenticated owner. Tasks are stored in MongoDB; filtering and sorting happen in the browser. The dashboard uses `status`; the model's separate `completed` boolean is not synchronized by the dashboard. Review that distinction before adding reporting or migrations.

Implementation: `Frontend/src/session.js`, `Frontend/src/App.jsx`, `Backend/routes/authRoutes.js`, `Backend/middleware/auth.js`, `Backend/routes/taskRoutes.js` and `Backend/models/`.

## Hosting

### Render serves the frontend and API

Configure a Render web service linked to this repository:

- Root directory: `Backend`
- Build command:

  ```bash
  npm install && cd ../Frontend && npm install && npm run build
  ```

- Start command:

  ```bash
  npm start
  ```

- Configure `MONGO_URI`, `JWT_SECRET` and `NODE_ENV=production` privately in Render. The server also respects the platform's `PORT`.

`Backend/server.js` serves `Frontend/dist` and returns `index.html` for client-side page navigation. The same origin handles `/api`. Configure automatic deployment for the intended Git branch in Render; that setting lives in the hosting account rather than this repository.

### Vercel serves the frontend with the API on Render

Import the repository at its root. `vercel.json` defines:

| Setting | Value |
| --- | --- |
| Install command | `npm --prefix Frontend ci` |
| Build command | `npm --prefix Frontend run build` |
| Output directory | `Frontend/dist` |
| API forwarding | `/api/:path*` to `https://task-manager-nafulah.onrender.com/api/:path*` |
| Client-side navigation | Non-API paths rewrite to `/index.html`. |
| API caching | `Cache-Control: private, no-store` |

The backend and its secrets remain on Render; Vercel does not run the Express backend in this arrangement. Keep the frontend lockfile synchronized for `npm ci`, and update the API destination when changing backend hosts. Configure deployment protection to match the intended audience; a successful Vercel deployment can still require Vercel sign-in.

## Maintenance

- Keep form validation and backend validation aligned; retain server-side ownership checks.
- Coordinate changes to the frontend inactivity constant and backend session timings, including their tests.
- Active styling is in `Frontend/src/index.css` and dashboard inline styles. `Frontend/src/App.css` is unused starter styling in the current import chain.
- No database migration, backup or seed workflow is defined here; plan those separately before changing stored data.

Copyright 2026 Adelight Masibo. All rights reserved.
