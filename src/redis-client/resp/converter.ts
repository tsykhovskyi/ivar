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

  encodeRequest(request: string[]): string {
    return this.encoder.encodeRequest(request);
  }

  encode(value: RedisValue): string {
    return this.encoder.encode(value);
  }

  decode(payload: string): RedisValue {
    const extractor = new PayloadExtractor(payload);

    return this.decoder.decode(extractor);
  }

  decodeRequest(payload: string): RedisValue[] {
    return this.decoder.decodeRequest(payload);
  }

  decodeFull(payload: string): RedisValue[] {
    return this.decoder.decodeFull(payload);
  }

  extract(payload: PayloadExtractor): RedisValue {
    return this.decoder.decode(payload);
  }
}
