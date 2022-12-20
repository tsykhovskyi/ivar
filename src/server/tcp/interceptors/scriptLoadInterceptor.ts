import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';
import { requestParser } from './common/requestParser';
import { scriptsRepository } from '../../../state/scriptsRepository';
import { RESP } from '../../../redis-client/resp';

export class ScriptLoadInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (
      !requestParser.isCommand(request, 'SCRIPT', 'LOAD') ||
      typeof request[2] !== 'string'
    ) {
      return null;
    }

    const hashResponse = await this.client.request(request);
    const message = await hashResponse.message();
    const hash = RESP.decode(message);
    if (typeof hash !== 'string') {
      return null;
    }

    scriptsRepository.save(hash, request[2]);

    return RESP.encode(message);
  }
}
