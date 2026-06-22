# grad-invite server

Minimal Express + SQLite (better-sqlite3) API backing the RSVP flow on
`index.html` and `rsvp.html`.

## Endpoints

- `POST /api/rsvp` — body `{ "name": "...", "status": "yes" | "no" }`. Upserts
  by name, case-insensitive (no duplicate guests).
- `GET /api/rsvps` — returns all RSVPs, `yes` first, then by `created_at` ascending.
- `DELETE /api/rsvps` — clears all RSVPs. Requires header `X-Clear-Secret: <CLEAR_SECRET>`.

## Local development

```bash
cd server
cp .env.example .env   # then edit CLEAR_SECRET to something private
npm install
npm start
```

The server listens on `PORT` (default `3000`) and stores data in
`server/data.db` (SQLite file, gitignored).

## Deploying (Render free tier)

Render's free web service tier supports an attached persistent disk, which
SQLite needs to survive restarts/deploys — Railway and Fly's free tiers do
not reliably offer this anymore, so Render is the recommended path.

1. Push this repo to GitHub (already done).
2. Go to [render.com](https://render.com) → **New** → **Web Service**, connect
   this repository.
3. Configure the service:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Add a **persistent disk** (Render dashboard → service → Disks):
   - **Mount Path:** `/data`
   - **Size:** 1 GB is plenty
5. Set environment variables on the service:
   - `CLEAR_SECRET` — a long random string, kept private
   - `DB_PATH` — set to `/data/data.db` so the SQLite file lives on the disk
     (update `server.js`'s `new Database(...)` call to use
     `process.env.DB_PATH || path.join(__dirname, 'data.db')` if you add this)
6. Deploy. Render will give you a public URL like
   `https://grad-invite-api.onrender.com`.
7. Copy that URL into `API_BASE` near the top of the `<script>` in both
   `index.html` and `rsvp.html`.

Note: Render's free tier spins the service down after inactivity, so the
first request after a while may take a few seconds to respond — the frontend
fails silently on errors, so this just shows as a slightly slow first RSVP.

### Fallback: managed Postgres

If persistent disk storage isn't available on your plan, swap SQLite for a
free managed Postgres database (e.g. [Neon](https://neon.tech) or
[Supabase](https://supabase.com)) and use the `pg` package instead of
`better-sqlite3`. The route logic (upsert by lowercased name, sort yes-first)
stays the same — only the `db.prepare(...).run()/.all()` calls change to
parameterized SQL queries against Postgres.
