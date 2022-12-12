import { RequestInterceptor } from './requestInterceptor';
import { RedisValue, RESPConverter } from '../../../redis-client/resp';
import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';

export class ClusterNodesInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: string[]): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'NODES')) {
      return false;
    }

    const clusterInfoResponse = await this.traffic.sideClient.request(request);
    const [result, raw] = await clusterInfoResponse.message();

    const rawCheck = RESPConverter.encode(result);
    if (rawCheck !== raw) {
      console.log('not equal conversion');
    }
    console.log(result);

    this.traffic.onResponse(raw);

    return true;
  }
}
