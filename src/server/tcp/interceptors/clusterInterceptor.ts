import { RequestInterceptor } from './requestInterceptor';
import { TrafficHandler } from '../trafficHandler';
import { requestParser } from './requestParser';
import { ClusterNodesInterceptor } from './cluster/clusterNodesInterceptor';
import { InterceptorChain } from './interceptorChain';
import { RESPConverter } from '../../../redis-client/resp';

export class ClusterInterceptor implements RequestInterceptor {
  private readonly interceptors: InterceptorChain;

  constructor(private traffic: TrafficHandler) {
    this.interceptors = new InterceptorChain([
      new ClusterNodesInterceptor(traffic),
    ]);
  }

  async handle(request: string[]): Promise<boolean> {
    if (!requestParser.isCommand(request, 'CLUSTER')) {
      return false;
    }

    if (!(await this.interceptors.handle(request))) {
      this.traffic.connection.write(
        RESPConverter.encode(
          new Error(
            '(ivar) Cluster methods is not fully supported on proxy ports'
          )
        )
      );
      return false;
    }

    return true;
  }
}
