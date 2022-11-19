import { HttpServer } from './server/http/httpServer';

const server = new HttpServer();
server.run();

process.on('uncaughtException', function (err) {
  console.error('UNCAUGHT EXCEPTION:', err);
});
