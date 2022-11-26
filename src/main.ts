import { HttpServer } from './server/http/httpServer';
import { parseArgs } from './config';
import { ProxyPool } from './server/tcp/proxyPool';

(async () => {
  const config = await parseArgs();

  const server = new HttpServer(config.port);
  server.run();

  const proxyPool = new ProxyPool(config.tunnels, config.filters)
  proxyPool.run();

  process.on('uncaughtException', function (err) {
    console.error('UNCAUGHT EXCEPTION:', err);
  });
})();
