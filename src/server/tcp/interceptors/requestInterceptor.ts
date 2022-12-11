import { RedisValue } from '../../../redis-client/resp';

export interface RequestInterceptor {
  handle(request: RedisValue): boolean | Promise<boolean>;
}
