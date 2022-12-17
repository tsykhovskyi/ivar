import { Tunnel } from '../../proxyPool';
import { serverState } from '../../../http/serverState';

class ProxyPortsReplacer {
  inPortLine(line: string): string {
    const regExp = /(\d+)/i;

    return line.replace(regExp, (match, port) => {
      const redisPort = parseInt(port);
      return this.port(redisPort).toString();
    });
  }

  inIpPortLine(line: string): string {
    const regExp = /(\b\d+\.\d+\.\d+\.\d+:)(\d+)((@\d+)?\b)/i;

    return line.replace(regExp, (match, start, port, end) => {
      const redisPort = parseInt(port);
      const debugPort = this.port(redisPort);
      return start + debugPort.toString() + end;
    });
  }

  port(port: number): number {
    for (const { src, dst } of this.tunnels()) {
      if (dst === port) {
        return src;
      }
    }
    return port;
  }

  private tunnels(): Tunnel[] {
    return serverState.getTunnels();
  }
}

export const proxyPortsReplacer = new ProxyPortsReplacer();
