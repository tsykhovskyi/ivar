import { RESP } from '../../../src/redis-client/resp';
import { BulkString } from '../../../src/redis-client/resp/types';

const CR = '\\r';
const LF = '\\n';
const CRLF = CR + LF;

const proto = (str: string) =>
  str.replace(/\n\s+/gm, '').replace(/\\r/gm, '\r').replace(/\\n/gm, '\n');

describe('RESP converter', () => {
  describe('decode', () => {
    it('should parse simple string', () => {
      const value = RESP.decode(`+This is simple string`);
      expect(value).toEqual(`This is simple string`);
    });

    it('should parse bulk string', () => {
      const value = RESP.decode(
        proto(`
          $19${CRLF}
          This is bulk string${CRLF}`)
      );
      expect(value).toEqual(new BulkString(`This is bulk string`));
    });

    it('should parse null', () => {
      const value = RESP.decode(proto('$-1'));
      expect(value).toEqual(null);
    });

    it('should parse simple number', () => {
      const value = RESP.decode(proto(`:42`));
      expect(value).toEqual(42);
    });

    it('should parse multilevel array', () => {
      const value = RESP.decode(
        proto(`
          *2${CRLF}
          *3${CRLF}
          :1${CRLF}
          :2${CRLF}
          $-1${CRLF}
          *2${CRLF}
          +Hello${CRLF}
          -World${CRLF}
      `)
      );
      expect(value).toEqual([
        [1, 2, null],
        ['Hello', new Error('World')],
      ]);
    });

    it('should parse only first value', () => {
      const value = RESP.decode(
        proto(`
          $5${CRLF}
          first${CRLF}
          +second${CRLF}
        `)
      );

      expect(value).toEqual(new BulkString('first'));
    });
  });

  describe('decodeFull', () => {
    it('should decode all values', () => {
      const values = RESP.decodeFull(
        proto(`
          *3${CRLF}
          :1${CRLF}
          :2${CRLF}
          $-1${CRLF}
          +Hello${CRLF}
          $-1${CRLF}
      `)
      );

      expect(values).toEqual([[1, 2, null], 'Hello', null]);
    });
  });

  describe('decodeRequest', () => {
    it('should decode multiple bulk array requests', () => {
      expect(
        RESP.decodeRequest(
          proto(`
            *2${CRLF}
            $4${CRLF}
            ECHO${CRLF}
            $11${CRLF}
            Hello world${CRLF}
            
            *4${CRLF}
            $4${CRLF}
            HSET${CRLF}
            $6${CRLF}
            myhash${CRLF}
            $6${CRLF}
            field2${CRLF}
            $5${CRLF}
            World${CRLF}
          `)
        )
      ).toEqual([
        [new BulkString('ECHO'), new BulkString('Hello world')],
        [
          new BulkString('HSET'),
          new BulkString('myhash'),
          new BulkString('field2'),
          new BulkString('World'),
        ],
      ]);
    });

    it('should decode plain requests', () => {
      expect(
        RESP.decodeRequest(
          proto(`
            PING${LF}
            SET mykey "\xff\xf0\x00"${LF}
            BITPOS mykey 0${LF}
            ${LF}
            ${LF}
            set key1 hello world${LF}
            set key2 "hello world"${LF}
            set key3 'hello world'${LF}
         `)
        )
      ).toEqual([
        ['PING'],
        ['SET', 'mykey', '\xff\xf0\x00'],
        ['BITPOS', 'mykey', '0'],
        ['set', 'key1', 'hello', 'world'],
        ['set', 'key2', 'hello world'],
        ['set', 'key3', 'hello world'],
      ]);
    });

    it('should decode pipe-like request', async () => {
      expect(
        RESP.decodeRequest(
          proto(`
            PING${LF}
            ${LF}
            *2${CRLF}
            $4${CRLF}
            ECHO${CRLF}
            $20${CRLF}
            qwertyuioplkjhgfdsaz${CRLF}
         `)
        )
      ).toEqual([
        ['PING'],
        [new BulkString('ECHO'), new BulkString('qwertyuioplkjhgfdsaz')],
      ]);
    });
  });
});
