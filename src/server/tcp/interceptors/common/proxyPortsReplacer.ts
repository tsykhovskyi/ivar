import { Tunnel } from '../../proxyPool';
import { serverState } from '../../../http/serverState';

class ProxyPortsReplacer {
  port(port: number): number {
    for (const { src, dst } of this.tunnels()) {
      if (dst === port) {
        return src;
      }
    }
    return port;
  }

  inIpPortLine(line: string): string {
    const regExp = /(\b\d+\.\d+\.\d+\.\d+:)(\d+)((@\d+)?\b)/i;

    return line.replace(regExp, (whole, start, port, end) => {
      const redisPort = parseInt(port);

      for (const { src, dst } of this.tunnels()) {
        if (dst === redisPort) {
          return start + src.toString() + end;
        }
      }

      return whole;
    });
  }

  private tunnels(): Tunnel[] {
    return serverState.getTunnels();
  }
}

export const proxyPortsReplacer = new ProxyPortsReplacer();
