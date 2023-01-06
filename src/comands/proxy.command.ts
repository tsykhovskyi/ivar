import { serverState } from '../server/http/serverState';
import { ServerConfig } from './server.command';
import { ProxyPool } from '../server/tcp/proxyPool';

export interface ProxyConfig extends ServerConfig {
  tunnel: string[];
  disable: boolean;
  filter?: string[];
}

class ProxyCommand {
  handle(config: ProxyConfig) {
    const tunnels = this.extractTunnels(config.tunnel);

    serverState.update({
      intercept: !config.disable,
      scriptFilters: config.filter ?? [],
      tunnels,
    });

    const proxies = new ProxyPool(tunnels);
    proxies.run();
  }

  private extractTunnels(tunnels: string[]): { src: number; dst: number }[] {
    return tunnels.map((tunnelStr) => {
      const parts = tunnelStr.split(':');
      if (parts.length !== 2) {
        throw new Error('Error: invalid proxy path');
      }
      const tunnel = { src: +(parts[0] as string), dst: +(parts[1] as string) };
      if (isNaN(tunnel.src) || isNaN(tunnel.dst)) {
        throw new Error(`Error: invalid tunnels port`);
      }
      return tunnel;
    });
  }
}

export const proxyCommand = new ProxyCommand();
