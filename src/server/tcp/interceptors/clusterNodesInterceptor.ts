import { RequestInterceptor } from './requestInterceptor';
import { RESPConverter } from '../../../redis-client/resp';
import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';
import { serverState } from '../../http/serverState';

export class ClusterNodesInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: string[]): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'NODES')) {
      return false;
    }

    const clusterInfoResponse = await this.traffic.sideClient.request(request);
    const [result, raw] = await clusterInfoResponse.message();
    if (typeof result !== 'string') {
      this.traffic.onResponse(raw);

      return true;
    }

    const debuggerNodes = result
      .split('\n')
      .map((record) => this.substituteNode(record))
      .join('\n');

    this.traffic.onResponse(RESPConverter.encode(debuggerNodes));

    return true;
  }

  private substituteNode(record: string): string {
    const serverTunnels = serverState.getTunnels();

    const regExp = /^([a-f0-9]+\s\d+\.\d+\.\d+\.\d+:)(\d+)(.+)$/i;
    return record.replace(regExp, (whole, start, port, end) => {
      const redisPort = parseInt(port);

      for (const { src, dst } of serverTunnels) {
        if (dst === redisPort) {
          return start + src.toString() + end;
        }
      }

      return whole;
    });
  }
}
