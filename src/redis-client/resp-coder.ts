/**
 * https://redis.io/docs/reference/protocol-spec/
 */

export type RedisValue = null | string | number | Error | RedisValue[];

class RespDecoder {
  private linesIterator: IterableIterator<string>;

  constructor(response: string) {
    const lines = response.split('\r\n');
    this.linesIterator = lines[Symbol.iterator]();
  }

  decode(): RedisValue {
    const { value: line } = this.linesIterator.next();
    const type = line.substring(0, 1);
    const value = line.substring(1);

    // Primitive types
    switch (type) {
      case '+': // simple string
        return value;
      case ':': // Integer
        return parseInt(value);
      case '-': // Error
        return new Error(value);
    }

    // Bulk string
    if (type === '$') {
      const bulkSize = parseInt(value);
      if (bulkSize === -1) {
        // Null bulk string
        return null;
      }

      const { value: nextLine } = this.linesIterator.next();

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

      let respArray = [];
      for (let itemNumber = 0; itemNumber < arraySize; itemNumber++) {
        respArray[itemNumber] = this.decode();
      }

      return respArray;
    }

    throw new Error('Invalid parsing logic. Unsupported type symbol: ' + type);
  }
}

export class RespCoder {
  serializeCommand(command: string[]) {
    let respCmd = '*' + command.length + '\r\n';
    for (const arg of command) {
      respCmd += '$' + arg.length + '\r\n' + arg + '\r\n'
    }
    return respCmd;
  }

  parseResponse(respPayload: string): RedisValue {
    const decoder = new RespDecoder(respPayload);
    const result = decoder.decode();
    // todo parse error

    return result;
  }
}
