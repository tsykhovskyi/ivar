import { serverState } from '../../http/serverState';
import { requestParser } from './common/requestParser';
import { RequestInterceptor } from './common/requestInterceptor';
import { scriptsRepository } from '../../../state/scriptsRepository';
import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { sessionRepository } from '../../../state/sessionRepository';
import { Session } from '../../../session/session';
import { RedisClient } from '../../../redis-client/redis-client';

export class EvalShaRequestInterceptor implements RequestInterceptor {
  constructor(private client: RedisClient) {}

  async handle(request: string[]): Promise<string | null> {
    if (!requestParser.isCommand(request, 'EVALSHA') || request.length < 3) {
      return null;
    }
    if (!serverState.isDebuggerEnabled()) {
      return null;
    }

    const script = scriptsRepository.get(request[1] as string);
    if (script === null) {
      console.log('script was not found in memory');
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
