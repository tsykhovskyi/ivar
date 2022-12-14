import { TrafficHandler } from '../../trafficHandler';
import { RESPConverter } from '../../../../redis-client/resp';
import { requestParser } from '../common/requestParser';
import { proxyPortsReplacer } from '../common/proxyPortsReplacer';
import { RequestInterceptor } from '../common/requestInterceptor';

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
      .map((record) => proxyPortsReplacer.inIpPortLine(record))
      .join('\n');

    this.traffic.onResponse(RESPConverter.encode(debuggerNodes));

    return true;
  }
}
