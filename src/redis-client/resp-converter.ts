/**
 * https://redis.io/docs/reference/protocol-spec/
 */

export type RedisValue = null | string | number | Error | RedisValue[];

class RespEncoder {
  encode(value: RedisValue): string {
    if (Array.isArray(value)) {
      let respCmd = '*' + value.length + '\r\n';
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

class LineExtractor {
  position: number = 0;

  constructor(private readonly payload: string) {
  }

  nextLine(): string {
    const lineEnd = this.payload.indexOf('\r\n', this.position);
    if (lineEnd === -1) {
      throw new Error('Logic exception')
    }
    const line = this.payload.substring(this.position, lineEnd);
    this.position = lineEnd + 2;
    return line;
  }

  isCompleted(): boolean {
    return this.position === this.payload.length;
  }
}

class RespDecoder {
  decode(payload: string): RedisValue {
    const lines = new LineExtractor(payload);

    const value = this.decodeValue(lines);
    if (!lines.isCompleted()) {
      throw new Error('Parse logic error')
    }
    return value;
  }

  private decodeValue(lines: LineExtractor): RedisValue {
    const line = lines.nextLine();
    const type = line.substring(0, 1);
    const value = line.substring(1);

    // Primitive types
    switch (type) {
      case '+': // simple string
        return value;
      case ':': // Integer
        return parseInt(value);
      case '-': // Error
        throw new Error(value);
    }

    // Bulk string
    if (type === '$') {
      const bulkSize = parseInt(value);
      if (bulkSize === -1) {
        // Null bulk string
        return null;
      }

      const nextLine = lines.nextLine();

      if (nextLine.length !== bulkSize) {
        throw new Error(`Bulk size ${bulkSize} does not match actual size ${nextLine.length}`);
      }

      return nextLine;
    }

    // Array
    if (type === '*') {
      const arraySize = parseInt(value);
      if (arraySize === -1) {
        // Null array. In current implementation it returns null
        return null;
      }

      let respArray: RedisValue[] = [];
      for (let itemNumber = 0; itemNumber < arraySize; itemNumber++) {
        respArray[itemNumber] = this.decodeValue(lines);
      }

      return respArray;
    }

    throw new Error('Invalid RESP parsing logic. Unsupported type symbol: ' + type);
  }
}

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

export const RESPConverter = new RespConverter();
