import { openDatabase } from './database.js';
import { hashPassword } from './index.js';
import { resolve } from 'node:path';
const [action, email, role] = process.argv.slice(2);
const db = openDatabase(resolve('data/campus.sqlite'));
try {
  if (action === 'promote' && ['student', 'organizer', 'admin'].includes(role)) {
    const result = db.prepare('UPDATE users SET role=? WHERE email=?').run(role, email);
    if (!result.changes) throw new Error('Register the account in the app first.');
    console.log(`Role updated to ${role}. Log out and log in again.`);
  } else if (action === 'create' && process.env.CAMPUS_ADMIN_PASSWORD && email) {
    const password = process.env.CAMPUS_ADMIN_PASSWORD;
    if (password.length < 10 || password.length > 128) throw new Error('Use 10–128 characters.');
    db.prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')").run(
      'Campus Administrator',
      email,
      hashPassword(password)
    );
    console.log('Administrator created.');
  } else
    throw new Error(
      'Usage: node server/account.js promote EMAIL student|organizer|admin, or set CAMPUS_ADMIN_PASSWORD and run node server/account.js create EMAIL'
    );
} finally {
  db.close();
}
