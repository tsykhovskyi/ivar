import { RequestInterceptor } from './requestInterceptor';
import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';
import { ClusterNodesInterceptor } from './cluster/clusterNodesInterceptor';
import { InterceptorChain } from './interceptorChain';
import { RESPConverter } from '../../../redis-client/resp';
import { ClusterSlotsInterceptor } from './cluster/clusterSlotsInterceptor';
import { ClusterShardsInterceptor } from './cluster/clusterShardsInterceptor';

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
      this.traffic.connection.write(RESPConverter.encode(reject));
      return false;
    }

    return true;
  }
}
