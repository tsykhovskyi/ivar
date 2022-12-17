import { RedisValue, RESP } from '../../../../redis-client/resp';
import { requestParser } from '../common/requestParser';
import { proxyPortsReplacer } from '../common/proxyPortsReplacer';
import { RequestInterceptor } from '../common/requestInterceptor';
import { RedisClient } from '../../../../redis-client/redis-client';

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
export class ClusterSlotsInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'SLOTS')) {
      return null;
    }

    const clusterSlotsResponse = await this.client.request(request);
    const message = await clusterSlotsResponse.message();

    const slotsSections = RESP.decode(message) as SlotsSection[];
    if (!Array.isArray(slotsSections)) {
      return message;
    }

    for (const section of slotsSections) {
      for (const node of section.slice(2) as SlotRangeNode[]) {
        node[1] = proxyPortsReplacer.port(node[1]);
      }
    }
    return RESP.encode(slotsSections);
  }
}
