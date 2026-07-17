import express from 'express';
import { db, initDb } from './db.js';

const PORT = 3001;
const SAVE_ID = 'player1';

const app = express();
app.use(express.json({ limit: '1mb' }));
// sendBeacon Blob'ları farklı content-type ile gelebilir
app.use(express.text({ type: ['text/*', 'application/octet-stream'], limit: '1mb' }));

app.get('/api/save', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT data, updated_at FROM saves WHERE id = $1',
      [SAVE_ID]
    );
    if (rows.length === 0) return res.json(null);
    res.json({ data: rows[0].data, updatedAt: rows[0].updated_at });
  } catch (err) {
    console.error('[GET /api/save]', err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    let data = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return res.status(400).json({ error: 'invalid json' });
      }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'invalid save data' });
    }
    await db.query(
      `INSERT INTO saves (id, data, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [SAVE_ID, JSON.stringify(data)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/save]', err);
    res.status(500).json({ error: 'db error' });
  }
});

// Çevrimdışı kazanç testleri için: kaydın updated_at'ini geriye çeker.
// Sadece geliştirme ortamında var; production'da bu endpoint kaldırılmalı.
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/rewind', async (req, res) => {
    const hours = Number(req.body?.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      return res.status(400).json({ error: 'hours (pozitif sayı) gerekli' });
    }
    await db.query(
      `UPDATE saves SET updated_at = updated_at - make_interval(mins => $1) WHERE id = $2`,
      [Math.round(hours * 60), SAVE_ID]
    );
    res.json({ ok: true, rewoundHours: hours });
  });
}

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[server] DB başlatılamadı:', err);
    process.exit(1);
  });
