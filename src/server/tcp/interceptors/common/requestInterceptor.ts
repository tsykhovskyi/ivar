import { RedisRequest } from '../../../../redis-client/resp/types';

export interface RequestInterceptor {
  /**
   * Return string of message response if was handled, otherwise - null
   */
  handle(request: RedisRequest): Promise<string | null>;
}
