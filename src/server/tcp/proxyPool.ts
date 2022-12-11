import { ProxyServer } from './proxyServer';

export interface Tunnel {
  src: number;
  dst: number;
}

export class ProxyPool {
  constructor(private tunnels: Tunnel[]) {}

  run() {
    for (const tunnel of this.tunnels) {
      const proxy = new ProxyServer(tunnel.src, tunnel.dst);
      proxy.run();
    }
  }
}
