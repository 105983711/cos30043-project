import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.js';
import { categories, locations } from './seed.js';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function matches(password, stored) {
  const [salt, value] = stored.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(value, 'hex'));
}
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null);
const digest = (token) => createHash('sha256').update(token).digest('hex');
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const emailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function createApp({
  database = resolve('data/campus.sqlite'),
  secure = process.env.NODE_ENV === 'production',
} = {}) {
  const db = openDatabase(database);
  const attempts = new Map();
  const eventSelect = `SELECT e.*, c.name AS clubName, (SELECT COUNT(*) FROM likes WHERE event_id=e.id) AS likes, (SELECT COUNT(*) FROM registrations WHERE event_id=e.id) AS attendees FROM events e JOIN clubs c ON c.id=e.clubId`;
  function userFor(req) {
    const token = (req.headers.cookie || '')
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('campus_session='))
      ?.slice(15);
    if (!token) return null;
    return db
      .prepare(
        'SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?'
      )
      .get(digest(token), Date.now());
  }
  function authenticated(user) {
    if (!user) fail(401, 'Please log in to continue.');
  }
  function organizer(user) {
    authenticated(user);
    if (!['organizer', 'admin'].includes(user.role)) fail(403, 'An organizer account is required.');
  }
  function owns(user, row) {
    organizer(user);
    if (user.role !== 'admin' && row.owner_id !== user.id)
      fail(403, 'You can only manage content you created.');
  }
  function eventData(input) {
    const e = {
      title: text(input.title),
      clubId: Number(input.clubId),
      category: text(input.category),
      date: text(input.date),
      time: text(input.time),
      location: text(input.location),
      price: Number(input.price),
      capacity: Number(input.capacity),
      description: text(input.description),
      artwork: text(input.artwork) || 'art',
    };
    if (e.title.length < 5 || e.title.length > 100) fail(422, 'Title must have 5–100 characters.');
    if (!Number.isInteger(e.clubId) || !db.prepare('SELECT id FROM clubs WHERE id=?').get(e.clubId))
      fail(422, 'Choose an existing club.');
    if (!categories.includes(e.category) || !locations.includes(e.location))
      fail(422, 'Choose a valid category and location.');
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time) ||
      !Number.isFinite(Date.parse(e.date)) ||
      new Date(e.date).toISOString().slice(0, 10) !== e.date
    )
      fail(422, 'Enter a valid date and time.');
    if (
      !Number.isFinite(e.price) ||
      e.price < 0 ||
      e.price > 10000 ||
      !Number.isInteger(e.capacity) ||
      e.capacity < 1 ||
      e.capacity > 10000
    )
      fail(422, 'Enter a valid price and capacity (1–10,000).');
    if (e.description.length < 30 || e.description.length > 5000)
      fail(422, 'Description must have 30–5,000 characters.');
    if (!['art', 'tech', 'sport', 'social', 'career', 'green'].includes(e.artwork))
      fail(422, 'Choose a valid visual theme.');
    return e;
  }
  function clubData(input) {
    const c = {
      name: text(input.name),
      category: text(input.category),
      description: text(input.description),
      contact: text(input.contact),
      initials: text(input.initials).toUpperCase(),
      color: text(input.color),
    };
    if (
      c.name.length < 3 ||
      c.name.length > 80 ||
      c.description.length < 30 ||
      c.description.length > 5000 ||
      !emailValid(c.contact) ||
      c.contact.length > 254 ||
      !/^[A-Z0-9]{1,3}$/.test(c.initials) ||
      !categories.includes(c.category) ||
      !['peach', 'lavender', 'lime', 'pink', 'blue', 'mint'].includes(c.color)
    )
      fail(422, 'Check the club name, description, email, initials, category, and colour.');
    return c;
  }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    );
    function send(status, data) {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(data));
    }
    try {
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD')
          return send(405, { message: 'Method not allowed.' });
        const base = resolve('dist');
        const file = resolve(
          base,
          '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
        );
        if (!file.startsWith(base + sep)) fail(403, 'Invalid path.');
        const info = await stat(file).catch(() => null);
        if (!info?.isFile())
          fail(404, 'Page not found. Build the frontend with npm run build first.');
        const mime =
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.ico': 'image/x-icon',
          }[extname(file)] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(req.method === 'HEAD' ? undefined : await readFile(file));
        return;
      }
      // Same-origin cookie authentication: reject cross-site writes.
      if (!['GET', 'HEAD'].includes(req.method)) {
        const origin = req.headers.origin;
        if (
          req.headers['sec-fetch-site'] === 'cross-site' ||
          (origin && new URL(origin).host !== req.headers.host)
        )
          fail(403, 'Cross-site requests are not allowed.');
        if (!String(req.headers['content-type']).startsWith('application/json'))
          fail(415, 'Use JSON for API requests.');
      }
      let body = {};
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 32000) fail(413, 'Request is too large.');
        }
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          fail(400, 'Invalid JSON.');
        }
        if (!body || Array.isArray(body) || typeof body !== 'object')
          fail(400, 'Expected a JSON object.');
      }
      const user = userFor(req);
      const method = req.method;
      const path = url.pathname.slice(4);
      if (path === '/health' && method === 'GET')
        return send(200, { status: 'ok', database: 'SQLite' });
      if (path === '/session' && method === 'GET') return send(200, { user: publicUser(user) });
      if (['/register', '/login'].includes(path) && method === 'POST') {
        const key = req.socket.remoteAddress;
        const attempt = attempts.get(key) || { count: 0, until: Date.now() + 60000 };
        if (attempt.until < Date.now()) {
          attempt.count = 0;
          attempt.until = Date.now() + 60000;
        }
        attempt.count++;
        attempts.set(key, attempt);
        if (attempt.count > 30) fail(429, 'Too many attempts. Try again in a minute.');
        const email = text(body.email).toLowerCase();
        const password = typeof body.password === 'string' ? body.password : '';
        let account;
        if (path === '/register') {
          const name = text(body.name);
          if (
            name.length < 2 ||
            name.length > 80 ||
            !emailValid(email) ||
            email.length > 254 ||
            password.length < 10 ||
            password.length > 128
          )
            fail(
              422,
              'Use a name (2–80 characters), valid email, and password (10–128 characters).'
            );
          if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
            fail(409, 'This email is already registered.');
          const id = db
            .prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)')
            .run(name, email, hashPassword(password)).lastInsertRowid;
          account = db.prepare('SELECT * FROM users WHERE id=?').get(id);
        } else {
          account = db.prepare('SELECT * FROM users WHERE email=?').get(email);
          if (password.length > 128 || !account || !matches(password, account.password))
            fail(401, 'Email or password is incorrect.');
        }
        const token = randomBytes(32).toString('hex');
        db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
          digest(token),
          account.id,
          Date.now() + 7 * 86400000
        );
        res.setHeader(
          'Set-Cookie',
          `campus_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure ? '; Secure' : ''}`
        );
        return send(path === '/register' ? 201 : 200, { user: publicUser(account) });
      }
      if (path === '/logout' && method === 'POST') {
        const token = (req.headers.cookie || '')
          .split(';')
          .map((s) => s.trim())
          .find((s) => s.startsWith('campus_session='))
          ?.slice(15);
        if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
        res.setHeader('Set-Cookie', 'campus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
        return send(200, { ok: true });
      }
      if (path === '/me' && method === 'GET') {
        authenticated(user);
        return send(200, {
          user: publicUser(user),
          liked: db
            .prepare('SELECT event_id FROM likes WHERE user_id=?')
            .all(user.id)
            .map((r) => r.event_id),
          registered: db
            .prepare('SELECT event_id FROM registrations WHERE user_id=?')
            .all(user.id)
            .map((r) => r.event_id),
          clubs: db
            .prepare('SELECT club_id FROM memberships WHERE user_id=?')
            .all(user.id)
            .map((r) => r.club_id),
        });
      }
      if (path === '/events' && method === 'GET')
        return send(200, db.prepare(eventSelect + ' ORDER BY e.date,e.time').all());
      if (path === '/clubs' && method === 'GET')
        return send(
          200,
          db
            .prepare(
              'SELECT c.*, (SELECT COUNT(*) FROM memberships WHERE club_id=c.id) AS members FROM clubs c ORDER BY c.name'
            )
            .all()
        );
      let match = path.match(/^\/(events|clubs)\/(\d+)$/);
      if (match && method === 'GET') {
        const row = db
          .prepare(
            match[1] === 'events' ? eventSelect + ' WHERE e.id=?' : 'SELECT * FROM clubs WHERE id=?'
          )
          .get(Number(match[2]));
        if (!row) fail(404, 'Content not found.');
        return send(200, row);
      }
      if (['/events', '/clubs'].includes(path) && method === 'POST') {
        organizer(user);
        const type = path.slice(1);
        const item = type === 'events' ? eventData(body) : clubData(body);
        const fields = Object.keys(item);
        const result = db
          .prepare(
            `INSERT INTO ${type}(${fields.join(',')},owner_id) VALUES(${fields.map(() => '?').join(',')},?)`
          )
          .run(...Object.values(item), user.id);
        return send(201, { id: Number(result.lastInsertRowid), ...item, owner_id: user.id });
      }
      if (match && ['PUT', 'DELETE'].includes(method)) {
        const type = match[1],
          id = Number(match[2]);
        const row = db.prepare(`SELECT * FROM ${type} WHERE id=?`).get(id);
        if (!row) fail(404, 'Content not found.');
        owns(user, row);
        if (method === 'DELETE') {
          if (type === 'clubs' && db.prepare('SELECT id FROM events WHERE clubId=?').get(id))
            fail(409, 'Move or delete this club’s events before deleting the club.');
          db.prepare(`DELETE FROM ${type} WHERE id=?`).run(id);
          return send(200, { ok: true });
        }
        const item = type === 'events' ? eventData(body) : clubData(body);
        if (
          type === 'events' &&
          item.capacity <
            db.prepare('SELECT COUNT(*) AS n FROM registrations WHERE event_id=?').get(id).n
        )
          fail(409, 'Capacity cannot be below the number of registrations.');
        db.prepare(
          `UPDATE ${type} SET ${Object.keys(item)
            .map((k) => k + '=?')
            .join(',')} WHERE id=?`
        ).run(...Object.values(item), id);
        return send(200, { id, ...item, owner_id: row.owner_id });
      }
      match = path.match(/^\/events\/(\d+)\/(like|registration)$/);
      if (match && ['POST', 'DELETE'].includes(method)) {
        authenticated(user);
        const id = Number(match[1]);
        const e = db.prepare('SELECT * FROM events WHERE id=?').get(id);
        if (!e) fail(404, 'Event not found.');
        const table = match[2] === 'like' ? 'likes' : 'registrations';
        if (method === 'POST') {
          if (table === 'registrations') {
            if (new Date(`${e.date}T${e.time}:00+08:00`).getTime() < Date.now())
              fail(409, 'Registration has closed for this event.');
            if (
              !db
                .prepare('SELECT * FROM registrations WHERE user_id=? AND event_id=?')
                .get(user.id, id) &&
              db.prepare('SELECT COUNT(*) AS n FROM registrations WHERE event_id=?').get(id).n >=
                e.capacity
            )
              fail(409, 'This event is full.');
          }
          db.prepare(`INSERT OR IGNORE INTO ${table}(user_id,event_id) VALUES(?,?)`).run(
            user.id,
            id
          );
        } else db.prepare(`DELETE FROM ${table} WHERE user_id=? AND event_id=?`).run(user.id, id);
        return send(200, { ok: true });
      }
      match = path.match(/^\/clubs\/(\d+)\/membership$/);
      if (match && ['POST', 'DELETE'].includes(method)) {
        authenticated(user);
        const id = Number(match[1]);
        if (!db.prepare('SELECT id FROM clubs WHERE id=?').get(id)) fail(404, 'Club not found.');
        if (method === 'POST')
          db.prepare('INSERT OR IGNORE INTO memberships VALUES(?,?)').run(user.id, id);
        else db.prepare('DELETE FROM memberships WHERE user_id=? AND club_id=?').run(user.id, id);
        return send(200, { ok: true });
      }
      fail(404, 'API endpoint not found.');
    } catch (error) {
      if (!error.status) console.error(error);
      if (!res.headersSent)
        send(error.status || 500, {
          message: error.status ? error.message : 'Something went wrong. Please try again.',
        });
      else res.end();
    }
  });
  server.on('close', () => db.close());
  return { server, db };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server } = createApp();
  const port = Number(process.env.PORT || 3001);
  server.listen(port, '127.0.0.1', () =>
    console.log(`Campus Events Hub: http://127.0.0.1:${port}`)
  );
}
