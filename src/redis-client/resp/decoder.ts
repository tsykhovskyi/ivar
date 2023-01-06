import { BulkString, RedisValue, RespType } from './types';
import { PayloadExtractor } from './payload/extractor';

export class RespDecoder {
  // todo parse line as array of token(with quotes handle)
  // todo parse line as resp array of bulk string
  decodeRequest(payload: string): string[][] {
    const values = this.decodeFull(payload);

    const requests: string[][] = [];
    for (const request of values) {
      // if (request instanceof PlainData) {
      //   if (request.length > 0) {
      //     requests.push(request.split(' '));
      //   }
      //   continue;
      // }
      requests.push(request as string[]);
    }

    return requests;
  }

  decodeFull(payload: string): RedisValue[] {
    const extractor = new PayloadExtractor(payload);

    const values = [];
    while (!extractor.isCompleted()) {
      values.push(this.decode(extractor));
    }
    return values;
  }

  decode(extractor: PayloadExtractor): RedisValue {
    return this.decodeValue(extractor);
  }

  private decodeValue(extractor: PayloadExtractor): RedisValue {
    const line = extractor.nextLine();

    const type = line.substring(0, 1);
    const value = line.substring(1);

    switch (type) {
      case RespType.SimpleString:
        return value;
      case RespType.Error:
        return new Error(value);
      case RespType.Integer:
        return parseInt(value);
    }

    if (type === RespType.BulkString) {
      const bulkSize = parseInt(value);
      if (bulkSize === -1) {
        return null; // Null bulk string
      }
      return new BulkString(extractor.nextBulk(bulkSize));
    }

    if (type === RespType.Array) {
      const arraySize = parseInt(value);
      if (arraySize === -1) {
        return null; // Null array. In current implementation it returns null
      }

      const respArray: RedisValue[] = [];
      for (let itemNumber = 0; itemNumber < arraySize; itemNumber++) {
        respArray[itemNumber] = this.decodeValue(extractor);
      }

      return respArray;
    }

    throw new Error(
      'Invalid RESP parsing logic. Unsupported type symbol: ' + type
    );
  }
}
