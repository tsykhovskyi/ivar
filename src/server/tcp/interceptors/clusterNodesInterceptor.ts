import { RequestInterceptor } from './requestInterceptor';
import { RedisValue } from '../../../redis-client/resp';
import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';

export class ClusterNodesInterceptor implements RequestInterceptor {
  constructor(private traffic: TrafficHandler) {}

  async handle(request: RedisValue): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER', 'NODES')) {
      return false;
    }

    const clusterInfoResponse = await this.traffic.sideClient.request(request);

    return new Promise((resolve) => {
      clusterInfoResponse.on('message', (message, raw) => {
        console.log('CLUSTER nodes response');
        console.log(message);

        this.traffic.onResponse(raw);
      });
      clusterInfoResponse.once('end', () => {
        resolve(true);
      });
    });
  }
}
