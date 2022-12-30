import { RedisValue } from '../../../../redis-client/resp';
import { BulkString } from '../../../../redis-client/resp/types';

export class RequestParser {
  isCommand(request: RedisValue[], ...args: string[]): request is string[] {
    if (
      !Array.isArray(request) ||
      !request.every((v) => typeof v === 'string' || v instanceof BulkString)
    ) {
      return false;
    }

    for (let i = 0; i < args.length; i += 1) {
      if ((request[i] as string).toLowerCase() !== args[i].toLowerCase()) {
        return false;
      }
    }
    return true;
  }
}

export const requestParser = new RequestParser();
