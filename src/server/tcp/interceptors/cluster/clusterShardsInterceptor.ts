import { TrafficHandler } from '../../trafficHandler';
import { RedisValue, RESP } from '../../../../redis-client/resp';
import { requestParser } from '../common/requestParser';
import { proxyPortsReplacer } from '../common/proxyPortsReplacer';
import { RequestInterceptor } from '../common/requestInterceptor';

type SlotRangeNode = [
  'id',
  string,
  'port',
  number,
  ...RedisValue[] // other params https://redis.io/commands/cluster-shards/
];

type Response = [
  'slots',
  [
    string, // slot start
    string // slot end
  ],
  'nodes',
  SlotRangeNode[]
][];

export class ClusterShardsInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: string[]): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'SHARDS')) {
      return false;
    }

    const clusterInfoResponse = await this.traffic.sideClient.request(request);
    const message = await clusterInfoResponse.message();
    const response = RESP.decode(message) as Response;
    if (!Array.isArray(response)) {
      this.traffic.connection.write(message);
      return false;
    }

    for (const nodes of response.map((v) => v[3] as SlotRangeNode[])) {
      for (const node of nodes) {
        if (node[2] === 'port') {
          node[3] = proxyPortsReplacer.port(node[3]);
        }
      }
    }

    this.traffic.onResponse(RESP.encode(response));

    return true;
  }
}
