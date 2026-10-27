import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { clubs, seedEvents } from './seed.js';

export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON;
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','organizer','admin')));
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS clubs (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, initials TEXT NOT NULL, color TEXT NOT NULL, description TEXT NOT NULL, contact TEXT NOT NULL, owner_id INTEGER REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, title TEXT NOT NULL, clubId INTEGER NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT, category TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, location TEXT NOT NULL, price REAL NOT NULL CHECK(price >= 0), capacity INTEGER NOT NULL CHECK(capacity > 0), description TEXT NOT NULL, artwork TEXT NOT NULL, owner_id INTEGER REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS likes (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, PRIMARY KEY(user_id,event_id));
    CREATE TABLE IF NOT EXISTS registrations (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, PRIMARY KEY(user_id,event_id));
    CREATE TABLE IF NOT EXISTS memberships (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE, PRIMARY KEY(user_id,club_id));
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  // A marker prevents deleted sample content from being recreated after restart.
  if (!db.prepare("SELECT value FROM settings WHERE key='seeded'").get()) {
    db.exec('BEGIN');
    try {
      const addClub = db.prepare(
        'INSERT INTO clubs(id,name,category,initials,color,description,contact) VALUES(?,?,?,?,?,?,?)'
      );
      clubs.forEach((c) =>
        addClub.run(c.id, c.name, c.category, c.initials, c.color, c.description, c.contact)
      );
      const addEvent = db.prepare(
        'INSERT INTO events(id,title,clubId,category,date,time,location,price,capacity,description,artwork) VALUES(?,?,?,?,?,?,?,?,?,?,?)'
      );
      seedEvents().forEach((e) =>
        addEvent.run(
          e.id,
          e.title,
          e.clubId,
          e.category,
          e.date,
          e.time,
          e.location,
          e.price,
          e.capacity,
          e.description,
          e.artwork
        )
      );
      db.prepare("INSERT INTO settings VALUES('seeded','1')").run();
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
  return db;
}
