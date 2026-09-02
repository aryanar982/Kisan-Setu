# Farmer Procurement Platform — SIH 26032

Intelligent, capacity-aware farmer procurement management system.

## Repo structure

```
/backend    — Node/Express/MongoDB API (see backend/README.md to run it)
/frontend   — React app (currently just the click-through demo prototype;
               real app scaffold goes here as M1 builds it)
/docs
  architecture.md — full system architecture, read this first
```

## Team

| # | Area | Owner |
|---|---|---|
| 1 | Frontend | — |
| 2 | Backend APIs | — |
| 3 | Database/Mongoose | — |
| 4 | AI/Queue Prediction | — |
| 5 | UI/UX + Integration | — |
| 6 | Testing + Deployment + Docs | — |

(Fill in names above.)

## Branching

- `main` — always demoable, protected
- `dev` — integration branch, everyone merges here via PR
- `feat/<short-name>` — one branch per task, e.g. `feat/booking-api`, `feat/queue-ui`

Merge to `main` only before a milestone or demo.

## Getting started

```bash
git clone <this-repo-url>
cd <repo>
cd backend && npm install && cp .env.example .env   # fill in .env
npm run dev
```

See `docs/architecture.md` for everything else.
