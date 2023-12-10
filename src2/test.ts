import { ProxyServer } from './proxyServer';

(async () => {
  const server = new ProxyServer(3000, 6379);
  await server.start();
})()
