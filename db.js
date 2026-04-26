import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'users.db'));

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL
)`);

const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (count === 0) {
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  insert.run('Эльвира Иванова', 'ivan@example.com');
  insert.run('Иван Бобров', 'bober@example.com');
  insert.run('Карина Овечковна', 'ovca@example.com');
  insert.run('TODO LIST:', '...');
  insert.run('#1', 'Отправить на репу');
}

export default db;
