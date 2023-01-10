import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';
import { requestParser } from './common/requestParser';
import { scriptsRepository } from '../../../state/scriptsRepository';
import { RESP } from '../../../redis-client/resp';
import { isStringable } from '../../../redis-client/resp/types';

export class ScriptLoadInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (
      !requestParser.isCommand(request, 'SCRIPT', 'LOAD') ||
      !isStringable(request[2])
    ) {
      return null;
    }

    const hashResponse = await this.client.request(request);
    const message = await hashResponse.message();
    const hash = RESP.decode(message);
    if (!isStringable(hash)) {
      return null;
    }

    scriptsRepository.save(hash.toString(), request[2].toString());

    return message;
  }
}
