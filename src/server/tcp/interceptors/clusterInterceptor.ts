import { ClusterNodesInterceptor } from './cluster/clusterNodesInterceptor';
import { ClusterSlotsInterceptor } from './cluster/clusterSlotsInterceptor';
import { ClusterShardsInterceptor } from './cluster/clusterShardsInterceptor';
import { InterceptorChain } from './common/interceptorChain';
import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';

export class ClusterInterceptor implements RequestInterceptor {
  private readonly interceptors: InterceptorChain;

  constructor(client: RedisClient) {
    this.interceptors = new InterceptorChain([
      new ClusterNodesInterceptor(client),
      new ClusterSlotsInterceptor(client),
      new ClusterShardsInterceptor(client),
    ]);
  }

  async handle(request: string[]): Promise<string | null> {
    return this.interceptors.handle(request);
  }
}
