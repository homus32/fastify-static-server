import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify();

app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});

app.get('/', (req, reply) => {
  return reply.sendFile('index.html');
});

app.get('/api', (req, reply) => {
  return reply.send({ message: 'Запрос прошел успешно' });
});

app.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Сервер запущен: http://localhost:3000');
});
