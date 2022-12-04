import { RespEncoder } from './encoder';
import { RespDecoder } from './decoder';
import { RedisValue } from './types';

/**
 * https://redis.io/docs/reference/protocol-spec/
 */
export class RespConverter {
  private decoder: RespDecoder;
  private encoder: RespEncoder;

  constructor() {
    this.encoder = new RespEncoder();
    this.decoder = new RespDecoder();
  }

  encode(value: RedisValue): string {
    return this.encoder.encode(value);
  }

  decode(payload: string): RedisValue {
    return this.decoder.decode(payload);
  }
}
