# Farmer Procurement Platform — Backend Scaffold

This is a skeleton, not the full MVP. It gives you:
- Full folder structure per the architecture doc (§4)
- All 8 Mongoose models, matching the frozen schema in §5
- JWT auth + RBAC middleware, working end-to-end
- **One complete reference flow: farmer registration/login → book a slot**,
  including the atomic booking pattern from §8 (Approach B)
- Socket.io wired into the server (not yet emitting real events — that's
  the next piece to build, see §10)

Everything else (centres CRUD, queue management, procurement, payments,
admin analytics) is *not* built yet — copy the booking flow's pattern
(model → service → controller → route, validated with zod, wrapped in
`asyncHandler`) for each of them. See `src/routes/index.js` for the list.

## Running it locally

```bash
cd backend
npm install
cp .env.example .env   # fill in a real MONGO_URI and two JWT secrets
npm run dev
```

## Seeded demo accounts

Run `npm run seed` to create 10 farmers, 2 procurement officers, and 1 admin.
All seeded accounts use the password `password123`.

- Farmers: phone numbers `9876500001` through `9876500010`
- Officers: `officer.lucknow@kisansetu.gov.in`, `officer.kanpur@kisansetu.gov.in`
- Admin: `admin.lucknow@kisansetu.gov.in`

Needs a MongoDB **replica set** (not a bare standalone) because
`booking.service.js` uses a multi-document transaction — a free MongoDB
Atlas cluster is a replica set by default, so this works out of the box
with Atlas. If you run Mongo locally instead, initialize it as a
single-node replica set or the transaction will fail.

## Try the reference flow

```bash
# 1. Register a farmer
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ramesh Kumar","phone":"9876543210","password":"password123","village":"Sirsa"}'

# copy the accessToken from the response, then:

# 2. Create a centre + slot directly in MongoDB (no admin endpoints yet —
#    that's the next module to build), then book it:
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"centreId":"<centreId>","slotId":"<slotId>"}'
```

A second identical request against the same slot once it's at capacity
returns `409 This slot is full or no longer available` — that's the
atomic check from §8 doing its job, not a bug.

## What to build next (suggested order, matches the architecture doc §"Build Order Summary")

1. Centres + Slots CRUD (admin/centre_staff only) — same layered pattern
2. Queue endpoints + real Socket.io emits from `queue.service.js`
3. Procurement + Payment endpoints (models already exist)
4. Admin analytics aggregation endpoints
5. Everything after that is Phase-2 AI (§20) — a separate service, called
   optionally from the services above, never a hard dependency.
