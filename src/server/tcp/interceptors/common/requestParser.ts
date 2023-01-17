import { RedisValue } from '../../../../redis-client/resp';
import {
  isStringable,
  RedisRequest,
} from '../../../../redis-client/resp/types';

export class RequestParser {
  isCommand(request: RedisValue[], ...args: string[]): request is RedisRequest {
    if (!Array.isArray(request) || !request.every((v) => isStringable(v))) {
      return false;
    }

    for (let i = 0; i < args.length; i += 1) {
      if (
        (request[i] as string).toLowerCase() !==
        (args[i] as string).toLowerCase()
      ) {
        return false;
      }
    }
    return true;
  }
}

export const requestParser = new RequestParser();
