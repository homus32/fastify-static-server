import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import {fileURLToPath} from 'url';
import path from 'path';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify();

app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});


app.get('/api/users', (req, reply) => {
  const users = db.prepare('SELECT * FROM users').all();
  return reply.send(users);
});

app.get('/api/users/count', (req, reply) => {
  const {c: count} = db.prepare('SELECT COUNT(*) as c FROM users').get();
  return reply.send({count});
});

app.get('/api/users/:id', (req, reply) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return reply.code(404).send({error: 'User not found'});
  return reply.send(user);
});

app.post('/api/users', (req, reply) => {
  const {name, email} = req.body;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return reply.code(400).send({error: 'Name must be a non-empty string'});
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return reply.code(400).send({error: 'Email must contain @'});
  }

  const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);
  return reply.code(201).send(user);
});

app.put('/api/users/:id', (req, reply) => {
  const {name, email} = req.body;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return reply.code(404).send({error: 'User not found'});

  if (typeof name !== 'string' || name.trim().length === 0) {
    return reply.code(400).send({error: 'Name must be a non-empty string'});
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return reply.code(400).send({error: 'Email must contain @'});
  }

  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.params.id);
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.params.id);
  return reply.send(user);
});

app.delete('/api/users/:id', (req, reply) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return reply.code(404).send({error: 'User not found'});

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  return reply.send({success: true});
});

// ле куда попал
app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    return reply.code(404).send({error: 'Route not found'});
  }
  return reply.sendFile('index.html');
});

app.listen({port: 3000}, (err) => {
  if (err) throw err;
  console.log('Сервер запущен: http://localhost:3000');
});
