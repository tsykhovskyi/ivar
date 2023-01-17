import {
  BulkString,
  isArrayOfBulkStrings,
  RedisValue,
  RespType,
} from './types';
import { PayloadExtractor } from './payload/extractor';
import parseArgsStringToArgv from 'string-argv';
import { IncompleteChunkError } from './exception/incompleteChunkError';

export class RespDecoder {
  decodeRequest(payload: string): Array<string | BulkString>[] {
    const requests: Array<string | BulkString>[] = [];
    const extractor = new PayloadExtractor(payload);

    while (!extractor.isCompleted()) {
      const line = extractor.nextLine('\n').trim();
      if (line === '') {
        continue;
      }

      const type = line.substring(0, 1);
      if (type === RespType.Array) {
        extractor.positionLineBack('\n');
        const request = this.decodeValue(extractor);
        if (!isArrayOfBulkStrings(request)) {
          throw new Error('[RESP] Invalid array of bulk string');
        }
        requests.push(request);
      } else {
        const request = parseArgsStringToArgv(line);
        requests.push(request);
      }
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
      if (isNaN(bulkSize)) {
        throw new Error('invalid bulk size value. must be integer');
      }
      const bulk = extractor.nextBulk(bulkSize);
      return new BulkString(bulk);
    }

    if (type === RespType.Array) {
      const arraySize = parseInt(value);
      if (arraySize === -1) {
        return null; // Null array. In current implementation it returns null
      }

      const respArray: RedisValue[] = [];
      for (let itemNumber = 0; itemNumber < arraySize; itemNumber++) {
        if (extractor.isCompleted()) {
          throw new IncompleteChunkError();
        }
        respArray[itemNumber] = this.decodeValue(extractor);
      }

      return respArray;
    }

    throw new Error(
      '[RESP] Invalid RESP parsing logic. Unsupported type symbol: ' + type
    );
  }
}
