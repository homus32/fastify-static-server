// noinspection SqlType

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyFormbody from '@fastify/formbody';
import pug from 'pug';
import { fileURLToPath } from 'url';
import path from 'path';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify();

app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});

app.register(fastifyView, {
  engine: { pug },
  root: path.join(__dirname, 'views'),
});

app.register(fastifyFormbody);

app.get('/', (req, reply) => {
  return reply.redirect('/users');
});

app.get('/users', (req, reply) => {
  const users = db.prepare(
      'SELECT * FROM users'
  ).all();
  return reply.view('users.pug', { users });
});

app.get('/users/create', (req, reply) => {
  return reply.view('create.pug');
});

app.post('/users', (req, reply) => {
  const { name, email } = req.body;
  db.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?)'
  ).run(name, email);
  return reply.redirect('/users');
});

app.get('/users/:id/edit', (req, reply) => {
  const user = db.prepare(
      'SELECT * FROM users WHERE id = ?').get(req.params.id
  );
  if (!user) return reply.code(404).send('Пользователь не найден');
  return reply.view('edit.pug', { user });
});

app.post('/users/:id/edit', (req, reply) => {
  const { name, email } = req.body;
  db.prepare(
      'UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.params.id
  );
  return reply.redirect('/users');
});

app.post('/users/:id/delete', (req, reply) => {
  db.prepare(
      'DELETE FROM users WHERE id = ?'
  ).run(req.params.id);
  return reply.redirect('/users');
});

app.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Сервер запущен: http://localhost:3000');
});
