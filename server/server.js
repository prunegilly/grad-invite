require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const PORT = process.env.PORT || 3000;
const CLEAR_SECRET = process.env.CLEAR_SECRET;

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_lower TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK(status IN ('yes', 'no')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/rsvp', (req, res) => {
  const { name, status } = req.body || {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (status !== 'yes' && status !== 'no') {
    return res.status(400).json({ error: "status must be 'yes' or 'no'" });
  }

  const trimmedName = name.trim();
  const nameLower = trimmedName.toLowerCase();

  const existing = db.prepare('SELECT id FROM rsvps WHERE name_lower = ?').get(nameLower);

  if (existing) {
    db.prepare('UPDATE rsvps SET name = ?, status = ? WHERE id = ?')
      .run(trimmedName, status, existing.id);
  } else {
    db.prepare('INSERT INTO rsvps (name, name_lower, status) VALUES (?, ?, ?)')
      .run(trimmedName, nameLower, status);
  }

  res.json({ ok: true });
});

app.get('/api/rsvps', (req, res) => {
  const rows = db.prepare(`
    SELECT name, status, created_at
    FROM rsvps
    ORDER BY (status = 'yes') DESC, created_at ASC
  `).all();

  res.json(rows);
});

app.delete('/api/rsvps', (req, res) => {
  const secret = req.headers['x-clear-secret'];

  if (!CLEAR_SECRET || secret !== CLEAR_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  db.prepare('DELETE FROM rsvps').run();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`grad-invite server listening on port ${PORT}`);
});
