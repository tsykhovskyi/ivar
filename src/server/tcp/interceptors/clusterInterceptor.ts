import { TrafficHandler } from '../trafficHandler';
import { ClusterNodesInterceptor } from './cluster/clusterNodesInterceptor';
import { RESP } from '../../../redis-client/resp';
import { ClusterSlotsInterceptor } from './cluster/clusterSlotsInterceptor';
import { ClusterShardsInterceptor } from './cluster/clusterShardsInterceptor';
import { InterceptorChain } from './common/interceptorChain';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';

export class ClusterInterceptor implements RequestInterceptor {
  private readonly interceptors: InterceptorChain;

  constructor(private traffic: TrafficHandler) {
    this.interceptors = new InterceptorChain([
      new ClusterNodesInterceptor(traffic),
      new ClusterSlotsInterceptor(traffic),
      new ClusterShardsInterceptor(traffic),
    ]);
  }

  async handle(request: string[]): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER')) {
      return false;
    }

    if (!(await this.interceptors.handle(request))) {
      const reject = new Error(
        '(ivar) Cluster methods is not fully supported on proxy ports'
      );
      this.traffic.connection.write(RESP.encode(reject));
      return false;
    }

    return true;
  }
}
