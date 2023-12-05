import { MessagesGroup, MessagesGroupExtractor } from './MessagesGroupExtractor';
import { RespValueType } from '../utils/types';
import { MessageInfo } from './queue/MessagesBuilder';

describe('MessagesGroupExtractor', () => {
  let messageExtractor: MessagesGroupExtractor;

  const expectMessages = (result: MessagesGroup | null, messages: MessageInfo[]) => {
    expect(result).toBeDefined();
    expect(result?.messages).toMatchObject(messages);
  }

  beforeEach(() => {
    messageExtractor = new MessagesGroupExtractor();
  })

  it('should parse primitive message', () => {
    let result = messageExtractor.add(Buffer.from('+OK\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.SimpleString,
        start: 0,
        end: 5,
      },
    ]);

    result = messageExtractor.add(Buffer.from(':12\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.Integer,
        start: 0,
        end: 5,
      },
    ]);

    result = messageExtractor.add(Buffer.from('-ERR: Something happens\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.Error,
        start: 0,
        end: 25,
      },
    ]);

    result = messageExtractor.add(Buffer.from('$2\r\nhi\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.BulkString,
        start: 0,
        end: 8,
      },
    ]);

    result = messageExtractor.add(Buffer.from('$-1\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.BulkString,
        start: 0,
        end: 5,
      },
    ]);

    result = messageExtractor.add(Buffer.from('*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.Array,
        start: 0,
        end: 22,
        items: [
          {
            type: RespValueType.BulkString,
            start: 4,
            end: 13,
          },
          {
            type: RespValueType.BulkString,
            start: 13,
            end: 22,
          },
        ],
      },
    ]);

    result = messageExtractor.add(Buffer.from('*-1\r\n'));
    expectMessages(result, [
      {
        type: RespValueType.Array,
        start: 0,
        end: 5,
      },
    ]);
  });

  describe('should parse single-chunk multiple messages', () => {
    const expectedMessages = [
      {
        type: RespValueType.Array,
        start: 0,
        end: 32,
        size: 3,
        items: [
          {
            type: RespValueType.BulkString,
            start: 4,
            end: 13,
          },
          {
            type: RespValueType.BulkString,
            start: 13,
            end: 27,
          },
          {
            type: RespValueType.Integer,
            start: 27,
            end: 32,
          }
        ],
      },
      {
        type: RespValueType.BulkString,
        start: 32,
        end: 60,
      },
      {
        type: RespValueType.Error,
        start: 60,
        end: 81,
      },
      {
        type: RespValueType.SimpleString,
        start: 81,
        end: 86,
      },
    ];
    const buffer = Buffer.from(
      '*3\r\n$3\r\nSET\r\n$8\r\ntest-key\r\n:42\r\n' + // 32
      '$21\r\njust a simple message\r\n' + // 60
      '-Error test example\r\n' + // 81
      '+OK\r\n' // 86
    );

    it('single chunk', () => {
      const result = messageExtractor.add(buffer);
      expectMessages(result, expectedMessages);
    });

    it('multi-chunk - split inside structures or CRLF', () => {
      let result = messageExtractor.add(buffer.slice(0, 31));
      expect(result).toBeNull();

      result = messageExtractor.add(buffer.slice(31, 50));
      expect(result).toBeNull();

      result = messageExtractor.add(buffer.slice(50, 79));
      expect(result).toBeNull();

      result = messageExtractor.add(buffer.slice(79, 86));
      expectMessages(result, expectedMessages);
    });

  });

  it('nested arrays', () => {
    const buffer = Buffer.from(
      '*2\r\n+OK\r\n*1\r\n:1\r\n'
    );
    const result = messageExtractor.add(buffer);
    expectMessages(result, [
      {
        type: RespValueType.Array,
        start: 0,
        end: 17,
        size: 2,
        items: [
          {
            type: RespValueType.SimpleString,
            start: 4,
            end: 9,
          },
          {
            type: RespValueType.Array,
            start: 9,
            end: 17,
            size: 1,
            items: [
              {
                type: RespValueType.Integer,
                start: 13,
                end: 17,
              }
            ],
          },
        ],
      },
    ]);
  })

  describe('nested messages', () => {
    const buffer = Buffer.from(
      '*2\r\n' + // 4
      '*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n' + // 26
      '$3\r\nbaz\r\n' + // 35
      '*4\r\n:1\r\n:2\r\n:3\r\n*1\r\n-Err\r\n' // 61
    );
    const expectedMessages = [
      {
        type: RespValueType.Array,
        start: 0,
        end: 35,
        size: 2,
        items: [
          {
            type: RespValueType.Array,
            start: 4,
            end: 26,
            size: 2,
            items: [
              {
                type: RespValueType.BulkString,
                start: 8,
                end: 17,
              },
              {
                type: RespValueType.BulkString,
                start: 17,
                end: 26,
              },
            ],
          },
          {
            type: RespValueType.BulkString,
            start: 26,
            end: 35,
          },
        ],
      },
      {
        type: RespValueType.Array,
        start: 35,
        end: 61,
        size: 4,
        items: [
          {
            type: RespValueType.Integer,
            start: 39,
            end: 43,
          },
          {
            type: RespValueType.Integer,
            start: 43,
            end: 47,
          },
          {
            type: RespValueType.Integer,
            start: 47,
            end: 51,
          },
          {
            type: RespValueType.Array,
            start: 51,
            end: 61,
            size: 1,
            items: [
              {
                type: RespValueType.Error,
                start: 55,
                end: 61,
              },
            ],
          },
        ],
      },
    ];

    it('should parse single-chunk nested messages', () => {
      const result = messageExtractor.add(buffer);
      expectMessages(result, expectedMessages);
    });

    it('should parse multi-chunk nested message', () => {
      let result = messageExtractor.add(buffer.slice(0, 4));
      expect(result).toBeNull();
      result = messageExtractor.add(buffer.slice(4, 26));
      expect(result).toBeNull();
      result = messageExtractor.add(buffer.slice(26, 36)); // 36 - start of second msg
      expect(result).toBeNull();
      result = messageExtractor.add(buffer.slice(36, 61));
      expectMessages(result, expectedMessages);
    });
  });
});
