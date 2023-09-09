import { serverState } from '../../http/serverState';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';
import { scriptsRepository } from '../../../state/scriptsRepository';
import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { sessionRepository } from '../../../state/sessionRepository';
import { Session } from '../../../session/session';
import { RedisClient } from '../../../redis-client/redis-client';
import { isStringable } from '../../../redis-client/resp/types';
import { RESP } from '../../../redis-client/resp';

export class EvalShaRequestInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!serverState.isDebuggerEnabled()) {
      return null;
    }
    if (
      !requestParser.isCommand(request, 'EVALSHA') ||
      !isStringable(request[1]) ||
      request.length < 3
    ) {
      return null;
    }

    const script = scriptsRepository.get(request[1].toString());
    if (script === null) {
      if (serverState.state.flushOnMiss) {
        const scriptExistsRes = await this.client.request([
          'SCRIPT',
          'EXISTS',
          request[1],
        ]);
        const scriptExists = RESP.decode(await scriptExistsRes.message());
        if (Array.isArray(scriptExists) && scriptExists[0] === 1) {
          const res = await this.client.request(['SCRIPT', 'FLUSH', 'SYNC']);
          await res.message();
          console.log(
            'redis script was not found in debugger memory. redis scripts were flushed'
          );
        }
      } else {
        console.log('script was not found in memory');
      }

      return null;
    }

    if (!serverState.shouldInterceptScript(script)) {
      return null;
    }

    try {
      const dbg = new TcpClientDebugger(
        this.client,
        ['EVAL', script, ...request.slice(2)],
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
