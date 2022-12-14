import { TcpClientDebugger } from '../../../ldb/tcp/tcp-client-debugger';
import { Session } from '../../../session/session';
import { RedisClient } from '../../../redis-client/redis-client';
import { RedisValue, RESP } from '../../../redis-client/resp';
import { serverState } from '../serverState';
import {
  SessionRepository,
  sessionRepository,
} from '../../../state/sessionRepository';

export interface ExecuteScriptRequest {
  lua: string;
  redis: { host: string; port: number };
  numberOfKeys: number;
  args: Array<string | number | boolean | null>;
}

export class ExecuteScriptCommand {
  constructor(private sessionsRepository: SessionRepository) {}

  async handle(request: ExecuteScriptRequest): Promise<RedisValue> {
    const client = new RedisClient({ ...request.redis });
    const dbg = new TcpClientDebugger(
      client,
      this.mapToRedisCommand(request),
      serverState.state.syncMode
    );
    const session = new Session(dbg);
    this.sessionsRepository.add(session);

    try {
      const result = await session.execute();

      return RESP.decode(result);
    } finally {
      this.sessionsRepository.delete(session.id);
    }
  }

  private mapToRedisCommand(request: ExecuteScriptRequest): string[] {
    const toCliDebugArg = (arg: string | number | boolean | null): string =>
      arg === null ? '' : arg.toString();

    return [
      'EVAL',
      request.lua,
      request.numberOfKeys.toString(),
      ...request.args.slice(0, request.numberOfKeys).map(toCliDebugArg),
      ...request.args.slice(request.numberOfKeys).map(toCliDebugArg),
    ];
  }
}

export const executeScript = new ExecuteScriptCommand(sessionRepository);
