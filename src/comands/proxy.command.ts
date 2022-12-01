import { ProxyServer } from '../server/tcp/proxyServer';
import { sessionRepository } from '../session/sessionRepository';

export interface ProxyConfig {
  tunnel: string[];
  disable: boolean;
  filter?: string[];
}

class ProxyCommand {
  handle(config: ProxyConfig) {
    for (const tunnel of this.extractTunnels(config.tunnel)) {
      const proxy = new ProxyServer(
        sessionRepository,
        tunnel.src,
        tunnel.dst,
        {
          intercept: !config.disable,
          luaFilters: config.filter ?? [],
        },
      );
      proxy.run();
    }
  }

  private extractTunnels(tunnels: string[]): { src: number, dst: number }[] {
    return tunnels.map((tunnelStr) => {
      const parts = tunnelStr.split(':');
      if (parts.length !== 2) {
        throw new Error('Error: invalid proxy path')
      }
      const tunnel = { src: +parts[0], dst: +parts[1] };
      if (isNaN(tunnel.src) || isNaN(tunnel.dst)) {
        throw new Error(`Error: invalid tunnels port`)
      }
      return tunnel;
    });
  }
}

export const proxyCommand = new ProxyCommand();
