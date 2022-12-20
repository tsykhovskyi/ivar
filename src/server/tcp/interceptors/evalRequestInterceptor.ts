import { serverState } from '../../http/serverState';
import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { Session } from '../../../session/session';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';
import { RedisClient } from '../../../redis-client/redis-client';
import { sessionRepository } from '../../../state/sessionRepository';

export class EvalRequestInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'EVAL')) {
      return null;
    }

    if (!serverState.shouldInterceptScript(request[1])) {
      return null;
    }

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
