import { RequestInterceptor } from './requestInterceptor';
import { RedisRequest } from '../../../../redis-client/resp/types';

export class InterceptorChain implements RequestInterceptor {
  constructor(private interceptors: RequestInterceptor[]) {}

  async handle(request: RedisRequest): Promise<string | null> {
    for (const requestHandler of this.interceptors) {
      const response = await requestHandler.handle(request);
      if (response !== null) {
        return response;
      }
    }
    return null;
  }
}
