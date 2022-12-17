import { TrafficHandler } from '../../trafficHandler';
import { RESP } from '../../../../redis-client/resp';
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
    const message = await clusterInfoResponse.message();
    const clusterNodes = RESP.decode(message);
    if (typeof clusterNodes !== 'string') {
      this.traffic.onResponse(message);

      return true;
    }

    const debuggerNodes = clusterNodes
      .split('\n')
      .map((record) => proxyPortsReplacer.inIpPortLine(record))
      .join('\n');

    this.traffic.onResponse(RESP.encode(debuggerNodes));

    return true;
  }
}
