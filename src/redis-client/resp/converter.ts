import { RespEncoder } from './encoder';
import { RespDecoder } from './decoder';
import { RedisValue } from './types';
import { PayloadExtractor } from './payload/extractor';

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
    const extractor = new PayloadExtractor(payload);

    return this.decoder.decode(extractor);
  }

  extract(payload: PayloadExtractor): RedisValue {
    return this.decoder.decode(payload);
  }
}
