import { RespEncoder } from './encoder';
import { RespDecoder } from './decoder';
import { RedisRequest, RedisValue } from './types';
import { PayloadExtractor } from './payload/extractor';
import { Renderer } from './renderer';

/**
 * https://redis.io/docs/reference/protocol-spec/
 */
export class RespConverter {
  private decoder: RespDecoder;
  private encoder: RespEncoder;
  private renderer: Renderer;

  constructor() {
    this.encoder = new RespEncoder();
    this.decoder = new RespDecoder();
    this.renderer = new Renderer();
  }

  encodeRequest(request: string[]): string {
    return this.encoder.encodeRequest(request);
  }

  encode(value: RedisValue): string {
    return this.encoder.encode(value);
  }

  render(value: RedisValue): string {
    return this.renderer.render(value);
  }

  decode(payload: string): RedisValue {
    const extractor = new PayloadExtractor(payload);

    return this.decoder.decode(extractor);
  }

  decodeRequest(payload: string): RedisRequest[] {
    return this.decoder.decodeRequest(payload);
  }

  decodeFull(payload: string): RedisValue[] {
    return this.decoder.decodeFull(payload);
  }

  extract(payload: PayloadExtractor): RedisValue {
    return this.decoder.decode(payload);
  }
}
