import { TrafficHandler } from '../../trafficHandler';
import { RedisValue, RESPConverter } from '../../../../redis-client/resp';
import { requestParser } from '../common/requestParser';
import { proxyPortsReplacer } from '../common/proxyPortsReplacer';

type SlotRangeNode = [
  number | null, // Preferred endpoint (Either an IP address, hostname, or NULL)
  number, // Port number
  string, // The node ID
  RedisValue[] // A map of additional networking metadata
];

type SlotsSection = [
  number, // Start slot range
  number, // End slot range
  SlotRangeNode, // Master node
  ...SlotRangeNode[] // Replicas
];

/**
 * Note: deprecated by Redis
 */
export class ClusterSlotsInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: string[]): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'SLOTS')) {
      return false;
    }

    const clusterInfoResponse = await this.traffic.sideClient.request(request);
    const [slotsSections, raw] = (await clusterInfoResponse.message()) as [
      SlotsSection[],
      string
    ];

    if (!Array.isArray(slotsSections)) {
      this.traffic.onResponse(raw);
      return false;
    }

    for (const section of slotsSections) {
      for (const node of section.slice(2) as SlotRangeNode[]) {
        node[1] = proxyPortsReplacer.port(node[1]);
      }
    }
    this.traffic.connection.write(RESPConverter.encode(slotsSections));

    return true;
  }
}
