import { RESP } from '../../../src/redis-client/resp';
import { BulkString } from '../../../src/redis-client/resp/types';

const CR = '\\r';
const LF = '\\n';
const CRLF = CR + LF;

const toNewlines = (str: string) =>
  str.replace(/\n\s+/gm, '').replace(/\\r/gm, '\r').replace(/\\n/gm, '\n');

describe('RESP converter', () => {
  describe('encode', () => {
    it('should encode simple string', async () => {
      const proto = RESP.encode(`This is simple string`);
      expect(proto).toEqual(`+This is simple string\r\n`);
    });

    it('should encode bulk string', () => {
      const proto = RESP.encode(new BulkString(`This is bulk string`));
      expect(proto).toEqual(
        toNewlines(`
          $19${CRLF}
          This is bulk string${CRLF}`)
      );
    });

    it('should encode null', () => {
      const proto = RESP.encode(null);
      expect(proto).toEqual('$-1\r\n');
    });

    it('should encode simple number', () => {
      const proto = RESP.encode(42);
      expect(proto).toEqual(':42\r\n');
    });

    it('should encode multilevel array', () => {
      const proto = RESP.encode([
        [1, 2, null],
        ['Hello', new Error('World')],
      ]);

      expect(proto).toEqual(
        toNewlines(`
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
    });
  });

  describe('encodeRequest', () => {
    it('should encode request', async () => {
      const proto = RESP.encodeRequest(['HSET', 'mykey', 'Hello world']);
      expect(proto).toEqual(
        toNewlines(`
          *3${CRLF}
          $4${CRLF}
          HSET${CRLF}
          $5${CRLF}
          mykey${CRLF}
          $11${CRLF}
          Hello world${CRLF}
      `)
      );
    });
  });

  describe('render', () => {
    it('should render redis-cli style', async () => {
      const view = RESP.render([
        'OK',
        new BulkString('Lorem ipsum dolores'),
        [
          [1, 2, 3],
          ['word', null],
          [4, 5, 6],
        ],
        [
          [[[[new BulkString('Super nested value')]]]],
          'two',
          [],
          'four',
          5,
          6,
          777777777777,
          8,
          9,
          10,
          new BulkString('Correct padding without curvature'),
        ],
      ]);

      expect(view).toEqual(`1) "OK"
2) Lorem ipsum dolores
3) 1) 1) (integer) 1
      2) (integer) 2
      3) (integer) 3
   2) 1) "word"
      2) (nil)
   3) 1) (integer) 4
      2) (integer) 5
      3) (integer) 6
4)  1) 1) 1) 1) 1) Super nested value
    2) "two"
    3) (empty array)
    4) "four"
    5) (integer) 5
    6) (integer) 6
    7) (integer) 777777777777
    8) (integer) 8
    9) (integer) 9
   10) (integer) 10
   11) Correct padding without curvature`);
    });
  });

  describe('decode', () => {
    it('should parse simple string', () => {
      const value = RESP.decode(`+This is simple string`);
      expect(value).toEqual(`This is simple string`);
    });

    it('should parse bulk string', () => {
      const value = RESP.decode(
        toNewlines(`
          $19${CRLF}
          This is bulk string${CRLF}`)
      );
      expect(value).toEqual(new BulkString(`This is bulk string`));
    });

    it('should parse null', () => {
      const value = RESP.decode(toNewlines('$-1'));
      expect(value).toEqual(null);
    });

    it('should parse simple number', () => {
      const value = RESP.decode(toNewlines(`:42`));
      expect(value).toEqual(42);
    });

    it('should parse multilevel array', () => {
      const value = RESP.decode(
        toNewlines(`
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
        toNewlines(`
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
        toNewlines(`
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
          toNewlines(`
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
          toNewlines(`
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
          toNewlines(`
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
