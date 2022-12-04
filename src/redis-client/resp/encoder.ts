import { RedisValue, RespType } from './types';

export class RespEncoder {
  encode(value: RedisValue): string {
    if (Array.isArray(value)) {
      let respCmd = RespType.Array + value.length + '\r\n';
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error('Unsupported payload. Only string')
        }
        respCmd += '$' + item.length + '\r\n' + item + '\r\n'
      }
      return respCmd;
    }

    // TODO: implement all RESP
    throw new Error('Unsupported payload.')
  }
}
