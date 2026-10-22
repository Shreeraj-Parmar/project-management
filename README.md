# DevBoard

A personal, single-user project management workspace for developers, with a Trello-style UI.
One password unlocks everything – no accounts, no sign-ups.

## What is a board?

A **board is one project** (the same idea as a Trello board or a monday.com board). You create one board per
project – e.g. "Portfolio site", "Client API", "Side project" – and everything that belongs to that project
lives inside it. The home page lists all your boards (starred, recently active, all / archived) and a
workspace overview with open tasks, spending and stored secrets across every board.

When you create a board you pick a background color, a title and a list template (Kanban, Simple,
Software dev or Bug tracking) that decides which lists the Tasks page starts with. Lists can be
renamed, added or removed later.

Each board (project) has its own color-coded modules:

| Module | What it stores |
| --- | --- |
| **Tasks** | Kanban board with drag & drop lists, labels, priorities, due dates, checklists and markdown descriptions |
| **Environment** | `.env` variables per environment (development / staging / production / …), encrypted at rest, import & export as `.env` |
| **Passwords** | Server logins, DB users, API keys – AES-256-GCM encrypted, reveal/copy on demand, password generator |
| **Files** | Files uploaded straight to your **AWS S3** bucket via presigned URLs, with folders |
| **Notes** | Markdown notes with live preview, colors, pinning and autosave |
| **Spending** | Expenses per project with categories, recurring costs, monthly chart and category breakdown |
| **Git Repo** | Connect a GitHub repository to see commits, branches, open issues and PRs |

Everything is stored in **MongoDB**.

## Stack

- [Next.js 15](https://nextjs.org) (App Router, TypeScript) + React 19
- Tailwind CSS v4
- Mongoose / MongoDB
- `jose` for the session cookie (JWT), Node `crypto` for AES-256-GCM
- AWS SDK v3 (S3 presigned uploads/downloads)
- `@hello-pangea/dnd` for drag & drop, `recharts` for charts, `react-markdown` for notes

## Getting started

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `APP_PASSWORD` | ✅ | The single password used to unlock the workspace |
| `SESSION_SECRET` | ✅ | Random string (16+ chars) used to sign the login cookie |
| `ENCRYPTION_KEY` | ✅ | 64 hex chars (32 bytes). Encrypts env values, passwords and git tokens at rest |
| `MONGODB_URI` | ✅ | MongoDB connection string (local or Atlas) |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | optional | Enables the Files module |
| `GITHUB_TOKEN` | optional | Personal access token so private repos can be read in the Git module (you can also set a per-project token in the UI) |

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### S3 bucket CORS

Uploads go from the browser directly to S3, so the bucket needs a CORS rule that allows `PUT` from your app origin:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Security notes

- The app is meant for **one person**. There is no user model – the password in `APP_PASSWORD` gates every page and API route via middleware.
- Login is rate limited (5 wrong attempts → 1 minute lockout per IP).
- Secrets (env values, passwords, git tokens) are stored encrypted with AES-256-GCM using `ENCRYPTION_KEY`. Losing the key means losing access to those values – back it up.
- List endpoints never return secret values; they are decrypted only when you click **Reveal**, **Copy** or **Export**.
- Run it behind HTTPS in production (the session cookie is `Secure` when `NODE_ENV=production`).

## Project structure

```
src/
  app/
    login/                 password screen
    (app)/boards/          dashboard + board grid
    (app)/boards/[id]/     board shell (sidebar) + module pages
    api/                   REST routes (projects, tasks, env, passwords, files, notes, spending, git)
  components/              UI primitives, board shell, task components
  lib/                     db, auth, crypto, s3, github, constants, client helpers
  models/                  Mongoose schemas
  middleware.ts            auth guard
```

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # run the production build
```
