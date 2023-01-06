import { RESP } from '../../../src/redis-client/resp';
import { BulkString } from '../../../src/redis-client/resp/types';
import { randomFillSync } from 'crypto';
import { simpleArray } from './proto.fixture';

describe('RESP converter', () => {
  describe('decode', () => {
    it('should parse simple array', () => {
      const proto = RESP.decode(simpleArray);

      expect(proto).toEqual([new BulkString('hello'), new BulkString('world')]);
    });

    it('should parse', async () => {
      const proto = RESP.decode(
        '*2\r\n' +
          '*3\r\n' +
          ':1\r\n' +
          ':2\r\n' +
          '$-1\r\n' +
          '*2\r\n' +
          '+Hello\r\n' +
          '-World\r\n'
      );

      expect(proto).toEqual([
        [1, 2, null],
        ['Hello', new Error('World')],
      ]);
    });

    it('should parse only first value', async () => {
      const proto = RESP.decode('$4\r\nthis\r\n+next\r\n');

      expect(proto).toEqual(new BulkString('this'));
    });

    it('should parse correct bulk size', async () => {
      const hash = randomFillSync(new Buffer(30)).toString('ascii');

      const proto = RESP.decode(`*1\r\n$30\r\n${hash}`);

      expect(proto).toEqual([new BulkString(hash)]);
    });
  });
});
