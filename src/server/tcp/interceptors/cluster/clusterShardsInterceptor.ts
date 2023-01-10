import { RedisValue, RESP } from '../../../../redis-client/resp';
import { requestParser } from '../common/requestParser';
import { proxyPortsReplacer } from '../common/proxyPortsReplacer';
import { RequestInterceptor } from '../common/requestInterceptor';
import { RedisClient } from '../../../../redis-client/redis-client';
import { BulkString } from '../../../../redis-client/resp/types';

type SlotRangeNode = [
  'id',
  BulkString,
  'port',
  number,
  ...RedisValue[] // other params https://redis.io/commands/cluster-shards/
];

type ClusterShard = [
  'slots',
  [
    BulkString, // slot start
    BulkString // slot end
  ],
  'nodes',
  SlotRangeNode[]
];

export class ClusterShardsInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'SHARDS')) {
      return null;
    }

    const clusterInfoResponse = await this.client.request(request);
    const message = await clusterInfoResponse.message();

    const clusterShards = RESP.decode(message) as ClusterShard[];
    if (!Array.isArray(clusterShards)) {
      return message;
    }

    for (const nodes of clusterShards.map((v) => v[3] as SlotRangeNode[])) {
      for (const node of nodes) {
        if (node[2].toString() === 'port') {
          node[3] = proxyPortsReplacer.port(node[3]);
        }
      }
    }

    return RESP.encode(clusterShards);
  }
}
