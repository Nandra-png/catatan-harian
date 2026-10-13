

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia-dev-ganti-di-produksi';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function loadDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    return {
      users: Array.isArray(db.users) ? db.users : [],
      notes: Array.isArray(db.notes) ? db.notes : [],
      nextUserId: db.nextUserId || (db.users?.length || 0) + 1,
      nextNoteId: db.nextNoteId || (db.notes?.length || 0) + 1,
    };
  } catch {
    return { users: [], notes: [], nextUserId: 1, nextNoteId: 1 };
  }
}

function saveDB(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

let db = loadDB();

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
});

function getToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function auth(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'tokennnya gak ada, login dulu' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'usernya gak ketemu, login ulang aja' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'tokennya gak valid atau udah kadaluarsa' });
  }
}

function publicUser(user) {
  return { id: user.id, username: user.username, nama: user.nama, createdAt: user.createdAt };
}

app.get('/', (req, res) => {
  res.json({
    nama: 'catatan-harian API',
    versi: '1.0.0',
    deskripsi: 'API catatan harian pribadi: daftar, login, CRUD catatan.',
    endpoints: {
      health: 'GET /health',
      register: 'POST /daftar  { username, password, nama? }',
      login: 'POST /masuk  { username, password }',
      me: 'GET /aku  (butuh token)',
      listNotes: 'GET /catatan?search=&page=&limit=  (butuh token)',
      getNote: 'GET /catatan/:id  (butuh token)',
      createNote: 'POST /catatan  { judul, isi, mood? }  (butuh token)',
      updateNote: 'PUT /catatan/:id  { judul?, isi?, mood? }  (butuh token)',
      deleteNote: 'DELETE /catatan/:id  (butuh token)',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), users: db.users.length, notes: db.notes.length });
});

app.post('/daftar', async (req, res) => {
  const { username, password, nama } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username sama password harus diisi' });
  }
  if (String(username).trim().length < 3) {
    return res.status(400).json({ error: 'username minimal 3 huruf' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'password minimal 6 karakter' });
  }

  const uname = String(username).trim().toLowerCase();
  if (db.users.some((u) => u.username === uname)) {
    return res.status(409).json({ error: 'username udah dipake' });
  }

  const user = {
    id: db.nextUserId++,
    username: uname,
    nama: nama ? String(nama).trim() : uname,
    passwordHash: await bcrypt.hash(String(password), 10),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB(db);

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  res.status(201).json({ message: 'berhasil daftar', token, user: publicUser(user) });
});

app.post('/masuk', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username sama password harus diisi' });
  }

  const uname = String(username).trim().toLowerCase();
  const user = db.users.find((u) => u.username === uname);
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return res.status(401).json({ error: 'username atau password salah' });
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  res.json({ message: 'berhasil masuk', token, user: publicUser(user) });
});

app.get('/aku', auth, (req, res) => {
  const total = db.notes.filter((n) => n.userId === req.user.id).length;
  res.json({ user: publicUser(req.user), totalCatatan: total });
});

app.get('/catatan', auth, (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;

  let items = db.notes.filter((n) => n.userId === req.user.id);

  const q = String(search).trim().toLowerCase();
  if (q) {
    items = items.filter(
      (n) =>
        n.judul.toLowerCase().includes(q) ||
        n.isi.toLowerCase().includes(q) ||
        (n.mood || '').toLowerCase().includes(q)
    );
  }

  items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const total = items.length;
  const start = (pageNum - 1) * limitNum;
  const data = items.slice(start, start + limitNum);

  res.json({
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data,
  });
});

app.get('/catatan/:id', auth, (req, res) => {
  const note = findOwnNote(req);
  if (!note) return res.status(404).json({ error: 'catatannya gak ketemu' });
  res.json({ data: note });
});

app.post('/catatan', auth, (req, res) => {
  const { judul, isi, mood } = req.body || {};

  if (!judul || !String(judul).trim()) {
    return res.status(400).json({ error: 'judulnya harus diisi' });
  }

  const now = new Date().toISOString();
  const note = {
    id: db.nextNoteId++,
    userId: req.user.id,
    judul: String(judul).trim(),
    isi: isi ? String(isi) : '',
    mood: mood ? String(mood).trim() : 'netral',
    createdAt: now,
    updatedAt: now,
  };

  db.notes.push(note);
  saveDB(db);
  res.status(201).json({ message: 'catatannya udah disimpen', data: note });
});

app.put('/catatan/:id', auth, (req, res) => {
  const note = findOwnNote(req);
  if (!note) return res.status(404).json({ error: 'catatannya gak ketemu' });

  const { judul, isi, mood } = req.body || {};
  const adaPerubahan = ['judul', 'isi', 'mood'].some((k) => req.body?.[k] !== undefined);
  if (!adaPerubahan) {
    return res.status(400).json({ error: 'gak ada yang diubah' });
  }
  if (judul !== undefined && !String(judul).trim()) {
    return res.status(400).json({ error: 'judulnya jangan kosong' });
  }

  if (judul !== undefined) note.judul = String(judul).trim();
  if (isi !== undefined) note.isi = String(isi);
  if (mood !== undefined) note.mood = String(mood).trim() || 'netral';
  note.updatedAt = new Date().toISOString();

  saveDB(db);
  res.json({ message: 'catatannya udah diubah', data: note });
});

app.delete('/catatan/:id', auth, (req, res) => {
  const note = findOwnNote(req);
  if (!note) return res.status(404).json({ error: 'catatannya gak ketemu' });

  db.notes = db.notes.filter((n) => n.id !== note.id);
  saveDB(db);
  res.json({ message: 'catatannya udah dihapus', data: note });
});

function findOwnNote(req) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return null;
  return db.notes.find((n) => n.id === id && n.userId === req.user.id) || null;
}

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} tidak ada.` });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'body nya harus json' });
  }
  console.error(err);
  res.status(500).json({ error: 'ada error di server' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`catatan-harian API jalan di http://localhost:${PORT}`);
    console.log(`Data tersimpan di: ${DB_FILE}`);
  });
}

module.exports = app;
