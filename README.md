# KAIAVERSITY

KAIAVERSITY is a university-themed fan engagement app for KAIA and ZAIAs.
It uses Next.js App Router, Auth.js v5 style authentication, Drizzle ORM, and Turso.

## Tech Stack

- Next.js (App Router)
- Auth.js v5 style (`next-auth`)
- Drizzle ORM + Turso/libSQL
- Tailwind + shadcn components

## Prerequisites

- Node.js 20+
- A Turso database + auth token
- GitHub OAuth app (optional for local guest-only usage)
- Google OAuth app (optional for local guest-only usage)

## Environment Variables

Create `.env.local` in the project root:

```bash
AUTH_SECRET=your-secret
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# OAuth (both naming styles supported)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=

TURSO_DATABASE_URL=libsql://xxxx.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

## Install

```bash
npm install
```

## Database Setup

Push schema to Turso:

```bash
npm run db:push
```

Seed baseline members, quests, achievements, and sample posts:

```bash
npm run db:seed
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build Check

```bash
npm run build
```

## shadcn CLI Note

Use the current CLI name:

```bash
npx shadcn@latest init
npx shadcn@latest add button card badge progress checkbox tabs avatar dialog toast sheet form input textarea select separator skeleton
```

Do not use the deprecated `shadcn-ui` package name.

## Deployment (Vercel)

```bash
vercel --prod
```

Then set the same environment variables in the Vercel project dashboard.
