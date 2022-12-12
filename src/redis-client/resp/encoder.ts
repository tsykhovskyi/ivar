import { RedisValue, RespType } from './types';

const CRLF = '\r\n';

export class RespEncoder {
  /**
   * Special case for command request as it must be an array of BulkString
   */
  encodeRequest(request: string[]) {
    let respCmd = RespType.Array + request.length + CRLF;
    for (const word of request) {
      respCmd += '$' + word.length + '\r\n' + word + '\r\n';
    }
    return respCmd;
  }

  encode(value: RedisValue): string {
    if (value === null) {
      return RespType.BulkString + '-1'; // Null bulk string
    }

    if (typeof value === 'string') {
      if (value.indexOf('\n') === -1) {
        return RespType.SimpleString + value + CRLF;
      } else {
        return RespType.BulkString + value.length + CRLF + value + CRLF;
      }
    }

    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        // todo RESP does not support float. define should the error be here or string type case
        return RespType.SimpleString + value.toString() + CRLF;
      }
      return RespType.Integer + value.toString() + CRLF;
    }

    if (value instanceof Error) {
      return RespType.Error + value.message + CRLF;
    }

    if (Array.isArray(value)) {
      let respCmd = RespType.Array + value.length + CRLF;
      for (const item of value) {
        respCmd += this.encode(item);
      }
      return respCmd;
    }

    throw new Error('Unable to encode redis value.');
  }
}
