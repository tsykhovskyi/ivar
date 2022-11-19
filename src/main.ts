import { HttpServer } from './server/http/httpServer';
import { ProxyServer } from './server/tcp/proxyServer';

const server = new HttpServer(process.env.PORT ? parseInt(process.env.PORT) : 29999);
server.run();

const proxy = new ProxyServer(29998);
proxy.run();

process.on('uncaughtException', function (err) {
  console.error('UNCAUGHT EXCEPTION:', err);
});
