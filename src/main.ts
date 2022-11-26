import { HttpServer } from './server/http/httpServer';
import { ProxyServer } from './server/tcp/proxyServer';
import { parseArgs } from './config';

(async () => {
  const config = await parseArgs();

  const server = new HttpServer(config.port);
  server.run();

  for (const tunnel of config.tunnels) {
    const proxy = new ProxyServer(tunnel.src, tunnel.dst, config.filters);
    proxy.run();
  }

  process.on('uncaughtException', function (err) {
    console.error('UNCAUGHT EXCEPTION:', err);
  });
})();
