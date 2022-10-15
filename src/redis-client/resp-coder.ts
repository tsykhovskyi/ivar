/**
 * https://redis.io/docs/reference/protocol-spec/
 */

export type RedisValue = null | string | number | Error | RedisValue[];

class RespDecoder {
  private currentLineNumber: number;
  private readonly lines: string[];

  constructor(response: string) {
    this.lines = response.split('\r\n');
    if (this.lines[this.lines.length - 1] === '') {
      this.lines.length--;
    }
    this.currentLineNumber = 0;
  }

  decode(): RedisValue {
    const line = this.lines[this.currentLineNumber++];
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

      const nextLine = this.lines[this.currentLineNumber++];

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

    throw new Error('Invalid RESP parsing logic. Unsupported type symbol: ' + type);
  }

  isFinished() {
    return this.currentLineNumber >= this.lines.length;
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

  parseResponse(respPayload: string): RedisValue[] {
    const decoder = new RespDecoder(respPayload);

    const resultEntities: RedisValue[] = [];
    while (!decoder.isFinished()) {
      const resultEntity = decoder.decode();
      resultEntities.push(resultEntity);
    }

    if (resultEntities.length === 0) {
      throw new Error('Empty response');
    }

    return resultEntities;
  }
}
