import { serverState } from '../../http/serverState';
import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { Session } from '../../../session/session';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';
import { sessionRepository } from '../../../state/sessionRepository';
import { isStringable } from '../../../redis-client/resp/types';
import crypto from 'node:crypto';
import { scriptsRepository } from '../../../state/scriptsRepository';

export class EvalRequestInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (
      !requestParser.isCommand(request, 'EVAL') ||
      !isStringable(request[1])
    ) {
      return null;
    }

    const script = request[1].toString();

    if (!serverState.shouldInterceptScript(script)) {
      return null;
    }

    const shasum = crypto.createHash('sha1');
    const sha1hash = shasum.update(script).digest('hex');
    scriptsRepository.save(sha1hash, script);

    try {
      const dbg = new TcpClientDebugger(
        this.client,
        request,
        serverState.state.syncMode
      );
      const session = sessionRepository.add(new Session(dbg));

      const response = await session.execute();

      return response;
    } catch (err) {
      console.error('debugger session fail: ', err);
      throw err;
    }
  }
}
