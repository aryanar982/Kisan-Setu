# Farmer Procurement Platform — System Architecture
### SIH Problem Statement 26032 · 6-Member Team

Legend: **[MVP]** build now · **[P2]** Phase-2 AI, built later without touching MVP code · **Owner: M#** maps to the team roster below.

**Team roster**
- **M1** — Frontend
- **M2** — Backend APIs
- **M3** — Database / Mongoose
- **M4** — AI / Queue Prediction (dormant until Phase 2)
- **M5** — UI/UX + Integration
- **M6** — Testing + Deployment + Documentation

---

## 1. High-Level Architecture

```
                    ┌─────────────────────────────────────┐
                    │           CLIENT APPS                │
                    │  Farmer Web/App | Centre Dashboard    │
                    │  Admin Dashboard (all same React app, │
                    │  role-gated routes)                   │
                    └───────────────┬───────────────────────┘
                                    │ HTTPS (REST) + WSS (Socket.io)
                    ┌───────────────▼───────────────────────┐
                    │        EXPRESS.JS API GATEWAY          │
                    │  /auth /farmers /centres /slots        │
                    │  /bookings /queue /procurement         │
                    │  /payments /admin /analytics           │
                    │  ── Middleware: JWT auth, RBAC,        │
                    │     validation, rate-limit, logging    │
                    └───────────────┬───────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼────────┐ ┌──────────▼─────────┐ ┌─────────▼─────────┐
    │  Service Layer     │ │  Socket.io Layer    │ │  [P2] AI Service   │
    │  (business logic:   │ │  (live queue/slot   │ │  (separate process/│
    │  booking, token,    │ │  updates pushed to   │ │  microservice,      │
    │  queue, payment)    │ │  connected clients)  │ │  called via internal│
    │                      │ │                      │ │  REST — not inline) │
    └─────────┬────────────┘ └──────────┬───────────┘ └─────────┬──────────┘
              │                          │                       │
              └────────────┬─────────────┘                       │
                            │                                     │
                  ┌─────────▼──────────┐                ┌────────▼────────┐
                  │   MongoDB (Atlas)   │◄───────────────┤  reads history/  │
                  │   via Mongoose      │                │  features for   │
                  │   ODM                │                │  prediction     │
                  └─────────────────────┘                └─────────────────┘
```

**Why this shape:** one Express app, one MongoDB cluster, Socket.io bolted onto the same Node process for real-time — no message queue, no microservices for MVP. That's the "unnecessary enterprise complexity" this team should explicitly avoid. The AI service is drawn as a separate, optional caller specifically so **M4's work never blocks or risks the MVP** — more on that in §20.

---

## 2. The Three Workflows

**Farmer [MVP]** — Owner: M1 (UI) + M2 (API) + M3 (schema)
```
Register/Login (JWT)
  → Search centres (by location/crop)
  → View centre's available slots (capacity-aware, live count)
  → Book a slot → system issues Digital Token
  → Token status updates live: Booked → Checked-in → In-Queue → Being Served → Procured
  → Procurement record created (quantity, grade, price)
  → Payment status: Pending → Processing → Paid
```

**Centre Staff [MVP]** — Owner: M1 + M2
```
Login (role: centre_staff, scoped to their centreId)
  → Dashboard: today's bookings list
  → Slot management: create/edit slot capacity & timing
  → Queue management: call next token, mark served/no-show
  → Record procurement (qty, grade) against a token
  → Mark payment status
  → View centre utilization (booked vs capacity, today)
```

**Admin [MVP]** — Owner: M1 + M2
```
Login (role: admin, global scope)
  → Manage farmers, centres, staff accounts
  → View all bookings/queues/procurement/payments across centres
  → Analytics: utilization %, no-show rate, avg wait time, payment backlog
  → [P2] Demand forecasts, load-balancing suggestions surface here
```

---

## 3. Frontend Architecture — Owner: M1 (with M5 on integration)

**[MVP]** Single React app, role-based routing, not three separate apps.

```
/src
  /api          — axios instance + one file per resource (bookingApi.js, slotApi.js…)
  /auth         — JWT storage (httpOnly cookie preferred over localStorage), route guards
  /components   — shared UI (TokenCard, QueueList, SlotPicker, StatusBadge)
  /features
    /farmer     — search, booking, my-tokens, payment-status
    /centre     — dashboard, slot-mgmt, queue-mgmt, procurement-entry
    /admin      — farmers, centres, analytics
  /hooks        — useSocket, useAuth, useSlots
  /context      — AuthContext, SocketContext
```

- Route guard reads JWT role claim → renders `/farmer/*`, `/centre/*`, or `/admin/*`.
- One shared `useSocket` hook opens a single Socket.io connection per session; features subscribe to relevant rooms (`centre:<id>:queue`, `farmer:<id>:token`).
- **Dependency:** M1 cannot build real screens until M2 publishes API contracts and M3 finalizes schema field names — so **week 1 output should be a shared OpenAPI/Postman contract**, not working endpoints. M1 builds against mocked responses from that contract in parallel with M2's implementation.

---

## 4. Backend Architecture — Owner: M2 (with M3 on models)

**[MVP]** Classic layered Express app — no need for anything fancier at this scale.

```
/src
  /config        — db.js, env.js, socket.js
  /models        — Farmer.js, Centre.js, Slot.js, Booking.js, Token.js,
                    Procurement.js, Payment.js, Admin.js  (owner: M3)
  /routes        — one router per resource, thin (just wiring)
  /controllers   — parse req, call service, shape response
  /services       — ALL business logic lives here (booking.service.js,
                    token.service.js, queue.service.js, payment.service.js)
  /middleware    — auth.js (JWT verify), rbac.js (role check),
                    validate.js (Joi/Zod schemas), errorHandler.js
  /sockets       — queue.socket.js, booking.socket.js (emit helpers)
  /utils         — tokenGenerator.js, apiResponse.js, logger.js
  server.js
```

**Rule the team should enforce from day 1:** controllers never touch Mongoose models directly — only services do. This is the single biggest thing that keeps 6 people from stepping on each other, and it's what lets M4's AI service later call the *same* service functions instead of duplicating logic.

---

## 5. MongoDB / Mongoose Architecture — Owner: M3

**[MVP]** Core collections (fields trimmed to essentials):

```js
Farmer     { name, phone, password_hash, village, crops[], createdAt }
Centre     { name, location {lat,lng}, cropsAccepted[], dailyCapacity,
             operatingHours, staffIds[] }
Slot       { centreId, date, startTime, endTime, capacity, bookedCount }
Booking    { farmerId, centreId, slotId, status: [booked|checked_in|
             cancelled|no_show|completed], createdAt }
Token      { bookingId, tokenNumber, status: [issued|in_queue|
             being_served|served], queuePosition, calledAt }
Procurement{ bookingId, farmerId, centreId, crop, quantity, grade,
             pricePerUnit, totalAmount, recordedBy, timestamp }
Payment    { procurementId, farmerId, amount, status: [pending|
             processing|paid|failed], mode, transactionRef, updatedAt }
Admin      { name, email, password_hash, role: [admin|centre_staff],
             centreId (null for admin) }
```

**Indexing (non-negotiable, this is where MVPs quietly die under demo load):**
- `Slot`: compound index `{ centreId: 1, date: 1 }`
- `Booking`: compound index `{ slotId: 1, status: 1 }`, plus `{ farmerId: 1 }`
- `Token`: `{ centreId: 1, status: 1, queuePosition: 1 }` for fast "next in queue" queries

**Relationships:** reference-based (ObjectId refs + `.populate()`), not embedding — bookings/tokens/procurement/payment change independently and need independent querying from three different dashboards. Embedding would force awkward denormalization for no real gain at this scale.

---

## 6. REST API Architecture — Owner: M2

**[MVP]** Resource-oriented, versioned from day one (`/api/v1/...`) so a breaking change later doesn't require a client rewrite.

| Resource | Key endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Centres | `GET /centres`, `GET /centres/:id`, `POST/PUT /centres` (admin) |
| Slots | `GET /centres/:id/slots?date=`, `POST/PUT /slots` (centre staff) |
| Bookings | `POST /bookings`, `GET /bookings/me`, `PATCH /bookings/:id/cancel` |
| Queue | `GET /centres/:id/queue`, `POST /queue/:tokenId/call-next`, `PATCH /queue/:tokenId/status` |
| Procurement | `POST /procurement`, `GET /procurement/:bookingId` |
| Payments | `PATCH /payments/:id/status`, `GET /payments/farmer/:id` |
| Admin/Analytics | `GET /admin/analytics/utilization`, `GET /admin/analytics/wait-times` |

Standard response envelope so M1 can build one generic API handler:
```json
{ "success": true, "data": {...}, "message": "" }
```

---

## 7. JWT Auth + Role-Based Access Control — Owner: M2

**[MVP]**
- `bcrypt` (cost factor 10–12) for password hashing at registration.
- On login, issue a JWT with payload `{ id, role, centreId? }`, short expiry (e.g. 15 min access token) + longer-lived refresh token.
- `auth.middleware.js` verifies signature + expiry → attaches `req.user`.
- `rbac.middleware.js` takes an allowed-roles array per route: `rbac(['admin'])`, `rbac(['centre_staff','admin'])`.
- Centre staff additionally get **scoped** access — middleware checks `req.user.centreId === req.params.centreId` so one centre can't see another's queue.
- Store refresh tokens httpOnly + secure cookie, not localStorage (XSS mitigation).

---

## 8. Slot-Booking Logic — Owner: M2 + M3 — ⚠️ RISKIEST PIECE (part 1)

The core danger: **two farmers booking the last slot at the same instant** → overbooking, which directly defeats the whole point of the app ("capacity-aware"). This is worth solving properly, not casually.

### Approach A — Application-level check-then-write
```js
const slot = await Slot.findById(slotId);
if (slot.bookedCount >= slot.capacity) throw new Error('Full');
await Booking.create({...});
slot.bookedCount += 1;
await slot.save();
```
- ✅ Simple, easy for a student team to reason about and debug.
- ❌ Race condition: two requests can both pass the check before either writes. Under real concurrent load (or even a rapid double-tap on a bad connection) this **will** overbook.

### Approach B — Atomic conditional update (recommended)
```js
const slot = await Slot.findOneAndUpdate(
  { _id: slotId, $expr: { $lt: ["$bookedCount", "$capacity"] } },
  { $inc: { bookedCount: 1 } },
  { new: true }
);
if (!slot) throw new Error('Slot full'); // update simply didn't match
await Booking.create({ slotId, farmerId, centreId, status: 'booked' });
```
- MongoDB guarantees the find+update+condition happens atomically at the document level — no race window.
- ✅ Correct under concurrency, no extra infrastructure (no Redis lock, no transaction needed for this specific check).
- ➕ If you need booking-creation and counter-increment to be strictly all-or-nothing, wrap in a Mongo **multi-document transaction** (`session.startTransaction()`) — worth doing once `Booking.create` fails after the increment succeeds (rare, but wrap it for the demo judges poking at edge cases).
- ❌ Slightly less obvious to a beginner than Approach A; team needs to actually understand *why* it's needed, not just paste it.

**Recommendation: Approach B.** This is the one piece of "boring correctness" that will make or take down a live demo where the panel deliberately double-books to test you. Assign this specific function to whoever on M2/M3 is strongest with Mongo — it's small (30 lines) but must be right.

---

## 9. Digital Token Generation — Owner: M2

**[MVP]** Generated at booking time, scoped per centre per day:
```js
const count = await Token.countDocuments({ centreId, date: today });
const tokenNumber = `${centreCode}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
// e.g. CTR07-20260902-014
```
Human-readable, sortable, and collision-free per centre/day without a separate counter collection. Store `queuePosition` separately from `tokenNumber` — position changes (no-shows shift the queue), the token identity shouldn't.

---

## 10. Real-Time Queue Management — Owner: M2 + M1 — ⚠️ RISKIEST PIECE (part 2)

This is the feature that makes it feel "intelligent and live" rather than a static booking form — and it's the piece most likely to eat unplanned time.

### Approach A — Client-side polling
Frontend hits `GET /centres/:id/queue` every 5–10 seconds.
- ✅ Trivial to build, zero new infrastructure, easy to debug (it's just HTTP), works fine even if a client has a flaky connection.
- ❌ Wasteful (most polls return unchanged data), feels laggy (up to poll-interval delay), doesn't scale well number-of-clients × poll-frequency — though at SIH-demo scale (dozens of concurrent users, not thousands) this ceiling is far away.

### Approach B — Socket.io push (recommended)
Server emits on state change; clients just listen.
```js
// server, inside queue.service.js after a status change:
io.to(`centre:${centreId}:queue`).emit('queueUpdated', updatedQueue);

// client:
socket.on('queueUpdated', (queue) => setQueue(queue));
```
- ✅ Instant updates — this is the visible "wow" factor in a live demo (token moves the moment staff clicks "next").
- ✅ Also solves booking-availability updates (slot count) with the same mechanism.
- ❌ More moving parts: connection lifecycle, reconnect handling, room management, and it's one more thing to break during a live demo if the venue Wi-Fi is bad.

**Recommendation: Approach B as primary, with Approach A as a silent fallback** — client polls every 30s regardless of socket connection, purely as a safety net if the socket drops. This is cheap to add and means a flaky demo network degrades gracefully instead of freezing the queue screen. Assign the socket layer to whichever of M2/M1 is comfortable with events — it should be built and demo-tested **early**, not bolted on the week before evaluation, since it's the one piece that touches both frontend and backend simultaneously.

---

## 11. Procurement & Payment Status Flow — Owner: M2 + M3

**[MVP]** Linear state machine, enforced in the service layer (not just trusted from the client):
```
Booking:      booked → checked_in → completed  (or cancelled / no_show)
Token:        issued → in_queue → being_served → served
Procurement:  created once token = served (qty, grade, price entered by staff)
Payment:      pending → processing → paid  (or failed)
```
Each transition is a small service function (`markCheckedIn`, `recordProcurement`, `updatePaymentStatus`) that validates the *current* state before allowing the *next* one — e.g. you cannot record procurement on a token that isn't `served`. This state-machine discipline is what "transparent tracking" actually means technically — it's not a UI feature, it's a backend invariant.

---

## 12. Centre Capacity Management — Owner: M2 + M3

**[MVP]** `Centre.dailyCapacity` + per-`Slot.capacity` give two levels of control: a centre can cap total daily throughput while also shaping it across time-of-day slots (avoiding the classic "everyone books the 9am slot" congestion problem). Utilization is simply computed, not stored:
```js
utilization = (sum of bookedCount across today's slots) / dailyCapacity
```
This single derived number is what feeds both the centre dashboard and, later, the admin's cross-centre view.

---

## 13. Admin Analytics Architecture — Owner: M2 + M3 (M1 for charts)

**[MVP]** — keep this simple: aggregation queries, not a separate analytics store.
```js
// MongoDB aggregation pipeline example: avg wait time per centre
Token.aggregate([
  { $match: { status: 'served', date: today } },
  { $group: { _id: '$centreId', avgWait: { $avg: '$waitDurationMinutes' } } }
])
```
Expose as `GET /admin/analytics/*` endpoints returning pre-aggregated numbers; frontend just renders charts (recharts/chart.js) — no client-side number-crunching.

**[P2]** This is also the natural home for demand-forecast charts and load-balancing recommendations once M4's model exists (§20).

---

## 14. How the 6 Members' Modules Interact

```
M3 (schema) ──► M2 (services/APIs) ──► M1 (UI consuming APIs) ──► M5 (polish/integration glue)
                     │
                     └──► sockets ──► M1 (live updates)
M6 (testing/deploy) wraps around all of the above continuously, not "at the end"
M4 (AI) reads from M3's collections + calls into M2's service layer — starts only after MVP is stable
```

**Critical-path dependency order:**
1. M3 finalizes schemas (blocks everyone) — do this in week 1, freeze it early.
2. M2 builds auth + core CRUD (blocks M1's real integration).
3. M1 builds against a mocked API contract *in parallel* with step 2 (don't block on M2 finishing).
4. M5 integrates M1+M2 once both are minimally working — this role should sit in daily standups with both, not just show up at the end.
5. M6 writes integration tests as each module lands, not one big test pass at the end — and owns the deploy pipeline from week 1 so "deploying" isn't a surprise the night before demo.
6. M4 stays dormant until 2–3, building the prediction model offline against exported/sample data, and only wires into the live system in the final phase (§20).

---

## 15. Recommended Git / Folder Structure

```
/repo
  /backend
    /src (as in §4)
    .env.example
  /frontend
    /src (as in §3)
  /ai-service          [P2] — kept fully separate, own package.json
  /docs
    api-contract.md    — source of truth, updated whenever an endpoint changes
    architecture.md     — this document
  docker-compose.yml    — mongo + backend + frontend for one-command local run
```
**Branching:** `main` (always demoable) ← `dev` ← feature branches per person (`feat/booking-api`, `feat/queue-ui`). M6 gates merges to `dev` with CI running tests. Nobody merges to `main` except before a milestone/demo.

---

## 16. API-to-Database Data Flow (worked example)

`POST /bookings` request →
1. `auth.middleware` verifies JWT → `req.user`
2. `bookings.controller` validates request body shape (Joi)
3. `booking.service.createBooking()`:
   - atomic `Slot.findOneAndUpdate` (§8 Approach B)
   - `Booking.create()`
   - `token.service.generateToken()` → `Token.create()`
   - emits `socket` event to centre's queue room + farmer's own room
4. Controller wraps result in standard envelope, returns 201.
5. Frontend `bookingApi.create()` resolves → navigates farmer to "My Token" screen, which is *also* listening on the socket, so it's already live-updating from the moment it mounts.

---

## 17. Real-Time Communication Approach

Decided in §10: **Socket.io as primary, polling as fallback.** One Socket.io server attached to the same Express HTTP server (no separate real-time service needed at this scale). Rooms are the isolation mechanism — a centre's staff join `centre:<id>:queue`, a farmer joins `farmer:<id>:token` — so events never leak across tenants and you don't have to filter on the client.

---

## 18. Security Considerations — Owner: M6 (cross-cutting, everyone implements)

**[MVP], all must-haves for a system handling payment status:**
- bcrypt for all passwords, never store plaintext.
- JWT short-lived + refresh token flow; refresh in httpOnly cookie.
- RBAC enforced server-side on *every* protected route — never trust a hidden frontend button as the only gate.
- Input validation (Joi/Zod) on every write endpoint — don't trust client-side validation alone.
- Rate-limiting on `/auth/login` (brute-force protection) — `express-rate-limit` is a 10-minute add.
- CORS locked to known frontend origin(s), not `*`.
- Centre-scoping middleware (§7) so one centre's staff literally cannot query another centre's data, even by guessing IDs.
- No sensitive data (payment details, phone numbers) in logs.
- `.env` for all secrets, never committed — `.env.example` committed instead.

---

## 19. Deployment Architecture — Owner: M6

**[MVP] — simplest thing that reliably demos:**
```
Frontend  → Vercel / Netlify (static build)
Backend   → Render / Railway (Node app, auto-deploy from `dev`/`main`)
Database  → MongoDB Atlas (free tier is enough for SIH scale)
```
- `docker-compose.yml` for local dev parity (mongo + backend + frontend), so "works on my machine" issues die early.
- Basic CI (GitHub Actions): run tests + lint on every PR to `dev`.
- Environment separation: at minimum a `staging` and a `prod`-ish deployed URL, so the demo build is never the one you're actively breaking with new commits.
- No Kubernetes, no separate load balancer, no message broker — genuinely not needed at this scale, and building it would just eat time you need for the core flow and the AI layer.

---

## 20. How Phase-2 AI Integrates Without Disturbing the MVP — Owner: M4

This is the part that determines whether "intelligent, capacity-aware" is a real claim or just marketing copy in your PPT — so it's worth designing the seam now even though M4 won't build the models until later.

**Design principle: AI is an *additive caller*, never a *required dependency*.** Every AI feature must have the MVP working identically with the AI service turned off.

```
/ai-service  (separate Node/Python process, own repo folder)
  - reads historical Booking/Token/Procurement data from MongoDB
    (read-only access, or a read replica if you want to be careful)
  - exposes its own small internal API:
      GET /predict/wait-time?centreId=&slotId=
      GET /predict/demand?centreId=&date=
      GET /recommend/slot-allocation?farmerId=&centreId=
  - MVP backend calls these as *optional enrichment*:
      try { waitEstimate = await aiClient.getWaitTime(...) }
      catch { waitEstimate = null }  // UI just hides the estimate, nothing breaks
```

**Phase-2 features and where they plug in:**
| Feature | Plugs into | MVP fallback if AI is down |
|---|---|---|
| Waiting-time prediction | Farmer's token status screen | Show queue position only, no ETA |
| Smart slot allocation | Booking flow, as a *suggestion* not a lock | Farmer picks slot manually (already works) |
| Demand forecasting | Admin analytics dashboard | Show only historical stats, not forecast |
| Centre load balancing | Admin dashboard alert/suggestion | No alert shown, admin manages manually |
| AI farmer assistant / smart search | New optional chat widget | Regular search bar still works |
| Weather/crop/price info | New info panel | Panel simply doesn't render |

Because §4 mandated that all business logic lives in `/services`, M4's AI service can call `queue.service.js` / `booking.service.js` functions directly (if run in-process) or hit the same REST layer (if run as a separate process) — it never needs to duplicate booking or queue logic, only add prediction on top of data that already exists.

---

## Build Order Summary

1. **Week 1:** M3 finalizes schemas · M2 scaffolds auth + RBAC · M1 sets up project + mocked API contract · M6 sets up repo/CI/docker-compose.
2. **Weeks 2–3:** M2 builds slot/booking/token APIs (atomic booking, §8B) · M1 builds farmer + centre screens against contract · M6 writes tests as each lands.
3. **Week 4:** Socket.io real-time queue (§10B) built and demo-tested end-to-end · M5 integrates frontend+backend fully.
4. **Week 5:** Procurement/payment flow, admin analytics, security hardening (§18) · M6 deploys staging.
5. **Week 6+ (only once MVP is stable and demoed internally):** M4 starts on AI service — wait-time prediction first (highest visible payoff, lowest risk), then demand forecasting, then the rest of §20's table.
