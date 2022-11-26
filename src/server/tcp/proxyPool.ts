import { Tunnel } from '../../config';
import { ProxyServer } from './proxyServer';

export class ProxyPool {
  constructor(private tunnels: Tunnel[], private filters: string[]) {
  }

  run(): void {
    for (const tunnel of this.tunnels) {
      const proxy = new ProxyServer(tunnel.src, tunnel.dst, this.filters);
      proxy.run();
    }
  }
}
