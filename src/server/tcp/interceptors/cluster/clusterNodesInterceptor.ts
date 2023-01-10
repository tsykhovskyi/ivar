import { RESP } from '../../../../redis-client/resp';
import { requestParser } from '../common/requestParser';
import { proxyPortsReplacer } from '../common/proxyPortsReplacer';
import { RequestInterceptor } from '../common/requestInterceptor';
import { RedisClient } from '../../../../redis-client/redis-client';
import { BulkString, isBulkString } from '../../../../redis-client/resp/types';

export class ClusterNodesInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'NODES')) {
      return null;
    }

    const response = await this.client.request(request);
    const message = await response.message();
    const clusterNodes = RESP.decode(message);
    if (!isBulkString(clusterNodes)) {
      return message;
    }

    const debuggerNodes = new BulkString(
      clusterNodes
        .split('\n')
        .map((record) => proxyPortsReplacer.inIpPortLine(record))
        .join('\n')
    );

    return RESP.encode(debuggerNodes);
  }
}
