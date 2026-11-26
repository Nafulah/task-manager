# Task Manager frontend

React and Vite provide the browser interface for Task Manager. For database setup, backend commands and deployment details, see the [root README](../README.md).

## Start development

From the repository root, install both applications:

```bash
npm install
```

Configure `Backend/.env` as described in the root README. Keep the backend running in a separate terminal:

```bash
npm run dev:backend
```

In your frontend terminal, starting from the repository root:

```bash
cd Frontend
npm run dev
```

Open the URL printed by Vite. `vite.config.js` proxies `/api` requests to `http://localhost:5000`; keep this target aligned with the backend port. No frontend environment variables are currently required. Never put database credentials or signing secrets in client code.

## Frontend commands

Run these from `Frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite with hot updates. |
| `npm test` | Run `node --test src/session.test.js`. |
| `npm run lint` | Run ESLint for JavaScript/JSX. |
| `npm run build` | Build the static app into `dist/`. |
| `npm run preview` | Preview the build locally. |

The development API proxy is configured under `server.proxy`, not `preview`. To check the production build with the API, build the frontend and run `npm start` from the repository root, then open the backend URL.

On Windows, use `npm.cmd` if PowerShell execution policy blocks `npm.ps1`.

## Application map

| File | Responsibility |
| --- | --- |
| `index.html` | HTML root, viewport, title and favicon. |
| `src/main.jsx` | Mount React in StrictMode and import global styles. |
| `src/App.jsx` | Select login, registration or dashboard; manage History API navigation, logout and inactivity tracking. |
| `src/components/Register.jsx` | Registration validation and request; notify App after success. |
| `src/components/Login.jsx` | Login request and browser session storage. |
| `src/components/Dashboard.jsx` | Task list, add/edit/delete forms, deadlines, filters and sorting. |
| `src/session.js` | API helper, session expiry checks and storage cleanup. |
| `src/session.test.js` | Focused tests with mocked browser storage and fetch. |
| `src/index.css` | Active shared styles and responsive rules. |
| `eslint.config.js` | Recommended JavaScript, React Hooks and React Refresh checks. |

## Pages and session behavior

- `/login` shows only the login form, followed by “Don’t have an account? Create one”.
- `/register` shows the separate registration form and a link back to login. Successful registration redirects to `/login` with a confirmation message.
- Successful login redirects to `/dashboard`. Signed-out dashboard visits return to login; signed-in visits to authentication pages resolve to the dashboard.
- Navigation uses the browser History API without a routing dependency. Hosting must serve `index.html` for these page paths so direct links and refreshes work.

`src/session.js` sends JSON requests to relative `/api` URLs and includes `x-auth-token` when signed in. `localStorage` holds `token`, `userName`, `userEmail` and `lastActivity`; `sessionStorage` holds the login/logout notice. Do not treat stored browser state as authorization: the backend checks every protected request against a signed token and persistent MongoDB session.

The inactivity limit is two minutes. `App.jsx` tracks visible-page interaction, synchronizes activity to the backend and checks expiry on focus, visibility changes, storage events and page restoration. A session-ending response clears the login state. JWTs also have a one-hour server-side lifetime.

## Task behavior and validation

The dashboard loads `/api/tasks`, sends mutations to the same API and reloads the list after a successful change. It prevents overlapping actions and displays loading/error feedback.

Tasks have a required title of up to 200 characters, a description of up to 5,000 characters, an optional deadline and one of three statuses: Pending, In Progress or Completed. Title/status filtering and newest/title/deadline/status sorting run on the loaded list in the browser. Deadline display uses UTC to preserve the selected calendar date; missing deadlines sort last.

Registration requires a name, a valid email and a password of at least eight characters and at most 72 bytes. Preserve form validation and the backend's independent checks when changing fields. Failed requests should retain the form and display a useful error; redirect only after success.

## Styling and accessibility

Use the existing green theme and shared `.auth-form`, `.error`, `.notice` and `.auth-navigation` classes. Global styles use Arial, a centered shell with a 780 px maximum width, full-width form controls and visible keyboard focus. The dashboard also defines inline panel/card styles with a 650 px panel maximum.

At widths up to 480 px, padding shrinks and filters stack. Headers and action rows wrap. Preserve labels, alert/status roles, busy/disabled states and edit-focus restoration. `src/App.css` and some assets are starter leftovers, not the active theme; do not use them as the design reference.

The frontend uses function components, hooks and ES modules. There is no separate formatter configuration; match surrounding code and run lint after changes.

## Verification checklist

1. Run `npm test`, `npm run lint` and `npm run build` from this directory. Run root `npm test` as well when changing API/session behavior.
2. Check that login and registration are separate, links work, registration returns to login and login opens the dashboard.
3. Check invalid form input, duplicate registration, incorrect credentials and network/server errors without losing the user's input.
4. Check direct links, refreshes and browser back/forward navigation on all three pages.
5. Check task add/edit/delete, deadlines, filtering and all sorting choices.
6. Check logout and inactivity expiry, including a refresh after expiry.
7. Check keyboard focus, narrow screens and long text.

The committed frontend tests cover session helpers, not rendered components or real MongoDB integration. Use a test account/database for manual writes, or controlled API responses for isolated browser checks.

## Hosting connections

- **Render:** Express serves the built frontend and `/api` from the same origin.
- **Vercel:** the root `vercel.json` builds this frontend, rewrites page navigation to `index.html` and forwards `/api` to the Render backend. Vercel deployment protection can restrict public access independently of application login.

Keep deployment settings in the root README and `vercel.json` aligned when changing hosts or API paths.
