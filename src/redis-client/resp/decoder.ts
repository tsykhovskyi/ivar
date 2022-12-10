import { RedisValue, RespType } from './types';
import { PayloadExtractor } from './payload/extractor';

export class RespDecoder {
  decode(extractor: PayloadExtractor): RedisValue {
    return this.decodeValue(extractor);
  }

  private decodeValue(payload: PayloadExtractor): RedisValue {
    const line = payload.nextLine();

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
      return payload.nextBulk(bulkSize);
    }

    if (type === RespType.Array) {
      const arraySize = parseInt(value);
      if (arraySize === -1) {
        return null; // Null array. In current implementation it returns null
      }

      const respArray: RedisValue[] = [];
      for (let itemNumber = 0; itemNumber < arraySize; itemNumber++) {
        respArray[itemNumber] = this.decodeValue(payload);
      }

      return respArray;
    }

    throw new Error(
      'Invalid RESP parsing logic. Unsupported type symbol: ' + type
    );
  }
}
