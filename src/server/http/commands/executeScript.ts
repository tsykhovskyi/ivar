import { TcpClientDebugger } from "../../../ldb/tcp/tcp-client-debugger";
import { SessionRepository, sessionRepository } from "../../../session/sessionRepository";
import { Session } from "../../../session/session";
import { RedisClient } from '../../../redis-client/redis-client';
import { RedisValue, RESPConverter } from '../../../redis-client/resp';
import { serverState } from '../serverState';

export interface ExecuteScriptRequest {
  lua: string;
  redis: { host: string; port: number };
  numberOfKeys: number;
  args: Array<string | number | boolean | null>;
}

export class ExecuteScriptCommand {
  constructor(private sessionsRepository: SessionRepository) {
  }

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
      await session.start();

      const result = await session.finished();

      return RESPConverter.decode(result);
    } catch (error) {
      throw error;
    } finally {
      this.sessionsRepository.delete(session.id);
    }
  }

  private mapToRedisCommand(request: ExecuteScriptRequest): RedisValue {
    const toCliDebugArg = (arg: string | number | boolean | null): string => arg === null ? '' : arg.toString();

    return [
      'EVAL',
      request.lua,
      request.numberOfKeys.toString(),
      ...request.args.slice(0, request.numberOfKeys).map(toCliDebugArg),
      ...request.args.slice(request.numberOfKeys).map(toCliDebugArg),
    ]
  }
}

export const executeScript = new ExecuteScriptCommand(sessionRepository);
