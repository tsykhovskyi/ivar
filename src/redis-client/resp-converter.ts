/**
 * https://redis.io/docs/reference/protocol-spec/
 */

export type RedisValue = null | string | number | Error | RedisValue[];

enum RespType {
  SimpleString = '+',
  Error = '-',
  Integer = ':',
  BulkString = '$',
  Array = '*',
}

class RespEncoder {
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

class PayloadExtractor {
  position: number = 0;

  constructor(private readonly payload: string) {
  }

  nextLine(): string {
    const lineEnd = this.payload.indexOf('\r\n', this.position);
    if (lineEnd === -1) {
      throw new Error('RESP error: line end cannot be found');
    }
    const line = this.payload.substring(this.position, lineEnd);
    this.position = lineEnd + 2;
    return line;
  }

  nextBulk(size: number): string {
    const bulkEnd = this.position + size;
    if (this.payload.substring(bulkEnd, bulkEnd + 2) !== '\r\n') {
      throw new Error('RESP error: bulk does not end with newline');
    }
    const bulk = this.payload.substring(this.position, bulkEnd);
    this.position = bulkEnd + 2;
    return bulk;
  }

  isCompleted(): boolean {
    return this.position === this.payload.length;
  }
}

class RespDecoder {
  decode(data: string): RedisValue {
    const lines = new PayloadExtractor(data);

    const value = this.decodeValue(lines);
    if (!lines.isCompleted()) {
      throw new Error('RESP error: payload was not parsed completely')
    }
    return value;
  }

  private decodeValue(payload: PayloadExtractor): RedisValue {
    const line = payload.nextLine();

    const type = line.substring(0, 1);
    const value = line.substring(1);

    switch (type) {
      case RespType.SimpleString:
        return value;
      case RespType.Error:
        // todo return error instead of throw
        throw new Error(value);
      case RespType.Integer:
        return parseInt(value);
    }

    if (type === RespType.BulkString) {
      const bulkSize = parseInt(value);
      if (bulkSize === -1) {
        return null; // Null bulk string
      }
      return payload.nextBulk(bulkSize);
    }

    if (type === RespType.Array) {
      const arraySize = parseInt(value);
      if (arraySize === -1) {
        return null; // Null array. In current implementation it returns null
      }

      let respArray: RedisValue[] = [];
      for (let itemNumber = 0; itemNumber < arraySize; itemNumber++) {
        respArray[itemNumber] = this.decodeValue(payload);
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
