# WebPort v2

Next.js portfolio stack with **PostgreSQL + Prisma**, a public **web** surface, and a **CMS at `/cms`**.

Auth is **OTP + passkey only** (no password login). Allowlisted admin:

`rapeepongapic@gmail.com`

Design tokens and system rules live in `Design.md` and `Skill.md` (HydraDB reference: https://hydradb.com/).

## Stack

| Layer | Tech |
| --- | --- |
| Web + CMS + API | Next.js App Router |
| ORM | Prisma |
| Database | PostgreSQL (Docker) |
| Auth | Better Auth — `emailOTP` + `@better-auth/passkey` |

## Quick start

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install (if needed)
npm install

# 3. Migrate + seed admin
npm run db:push
npm run db:seed

# 4. Dev server
npm run dev
```

- Site: http://localhost:3000  
- CMS: http://localhost:3000/cms  
- Login: http://localhost:3000/cms/login  

### First login

1. Open `/cms/login`
2. Request an OTP for `rapeepongapic@gmail.com`
3. In development without SMTP, the code is printed in the **Next.js server console**
4. After sign-in, open **Passkeys** in the CMS and register a device passkey

## Environment

Copy `.env.example` → `.env`. Important keys:

- `DATABASE_URL` — Postgres connection (default host port `5433`)
- `BETTER_AUTH_SECRET` — long random secret
- `ADMIN_EMAIL` — allowlisted CMS email
- `PASSKEY_RP_ID` — `localhost` in dev; your domain in production
- Optional `SMTP_*` — otherwise OTP is logged to the console

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run db:push` | Push Prisma schema |
| `npm run db:migrate` | Create migration |
| `npm run db:seed` | Seed admin + sample project |
| `npm run db:studio` | Prisma Studio |

## Layout

```
src/app/page.tsx          → marketing web
src/app/cms/*             → CMS (subpath)
src/app/api/auth/[...all] → Better Auth
src/app/api/cms/*         → CMS APIs
prisma/schema.prisma      → auth + content models
Design.md / Skill.md      → design system
```
