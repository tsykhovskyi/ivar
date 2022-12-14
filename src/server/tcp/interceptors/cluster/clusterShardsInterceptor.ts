import { RequestInterceptor } from '../requestInterceptor';
import { TrafficHandler } from '../../trafficHandler';
import { requestParser } from '../requestParser';
import { RedisValue, RESPConverter } from '../../../../redis-client/resp';
import { portsSubstitutor } from '../portsSubstitutor';

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
    const [result] = (await clusterInfoResponse.message()) as [
      Response,
      string
    ];
    if (!Array.isArray(result)) {
      this.traffic.connection.write(RESPConverter.encode(result));
      return false;
    }

    for (const nodes of result.map((v) => v[3] as SlotRangeNode[])) {
      for (const node of nodes) {
        if (node[2] === 'port') {
          node[3] = portsSubstitutor.port(node[3]);
        }
      }
    }

    this.traffic.onResponse(RESPConverter.encode(result));

    return true;
  }
}
