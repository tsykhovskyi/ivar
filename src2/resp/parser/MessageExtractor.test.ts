import { MessageExtractor } from './MessageExtractor';
import { RespValueType } from '../utils/types';
import { MessageInfo } from './queue/MessagesBuilder';

const divideIntoChunks = (...chunkEnds: number[]): { start: number, end: number }[] => {
  return chunkEnds.reduce((chunks: { start: number, end: number }[], end, index) => {
    return [
      ...chunks,
      {
        start: 0,
        end: index === 0 ? end : end - Number(chunkEnds[index - 1]),
      },
    ];
  }, [])
};


describe('MessageExtractor', () => {
  let messageExtractor: MessageExtractor;

  const expectMessagesGroup = (messages: MessageInfo[]) => {
    expect(messageExtractor.messages.length).toEqual(1);
    expect(messageExtractor.messages[0]?.messages).toMatchObject(messages);
  }

  beforeEach(() => {
    messageExtractor = new MessageExtractor();
  })

  it('should parse primitive message', () => {
    const buffer = Buffer.from('+OK\r\n');

    messageExtractor.add(buffer);
    expectMessagesGroup([
      {
        type: RespValueType.SimpleString,
        start: 0,
        end: buffer.length,
      },
    ]);
  });

  it('should parse single-chunk message', () => {
    const buffer = Buffer.from('*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');

    messageExtractor.add(buffer);
    expectMessagesGroup([
      {
        type: RespValueType.Array,
        start: 0,
        end: buffer.length,
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
  });

  it('should parse single-chunk multiple messages', () => {
    const msg = '*3\r\n$3\r\nSET\r\n$8\r\ntest-key\r\n:42\r\n' + // 32
      '$21\r\njust a simple message\r\n' + // 60
      '-Error test example\r\n' + // 81
      '+OK\r\n'; // 86

    const buffer = Buffer.from(msg);

    messageExtractor.add(buffer);
    expectMessagesGroup([
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
    ]);
  });

  it('nested arrays', () => {
    const buffer = Buffer.from(
      '*1\r\n*1\r\n:1\r\n'
    );
    messageExtractor.add(buffer);
    expectMessagesGroup([
      {
        type: RespValueType.Array,
        start: 0,
        end: 12,
        size: 1,
        items: [
          {
            type: RespValueType.Array,
            start: 4,
            end: 12,
            size: 1,
            items: [
              {
                type: RespValueType.Integer,
                start: 8,
                end: 12,
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
      messageExtractor.add(buffer);
      expectMessagesGroup(expectedMessages);
    });

    it('should parse multi-chunk nested message', () => {
      messageExtractor.add(buffer.slice(0, 4));
      expect(messageExtractor.isComplete).toBeFalsy();
      messageExtractor.add(buffer.slice(4, 26));
      expect(messageExtractor.isComplete).toBeFalsy();
      messageExtractor.add(buffer.slice(26, 35));
      expect(messageExtractor.isComplete).toBeTruthy();
      messageExtractor.add(buffer.slice(35, 61));
      expectMessagesGroup(expectedMessages);
      expect(messageExtractor.isComplete).toBeTruthy();
    });
  });

  describe('should handle small chunks', () => {
    const buffer = Buffer.from(
      '*2\r\n' + // 4
      '$6\r\n' + // 8
      '\r\n\r\n\r\n' + // 14
      '\r\n' + // 16
      '+OK\r\n' // 21
    );

    it('inside bulk end', () => {
      messageExtractor.add(buffer.slice(0, 15));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(15, 21));
      expect(messageExtractor.messages).toMatchObject([
        {
          type: RespValueType.Array,
          chunks: divideIntoChunks(15, 21),
        },
      ]);
    });

    it('inside bulk content-length definition', () => {
      messageExtractor.add(buffer.slice(0, 5));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(5, 21));
      expect(messageExtractor.messages).toMatchObject([
        {
          type: RespValueType.Array,
          chunks: divideIntoChunks(5, 21),
        },
      ]);
    });

    it('inside array content-length definition', () => {
      messageExtractor.add(buffer.slice(0, 3));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(3, 21));
      expect(messageExtractor.messages).toMatchObject([
        {
          type: RespValueType.Array,
          chunks: divideIntoChunks(3, 21),
        },
      ]);
    });

    it('inside array,bulk content-length definition', () => {
      messageExtractor.add(buffer.slice(0, 3));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(3, 5));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(5, 21));
      expect(messageExtractor.messages).toMatchObject([
        {
          type: RespValueType.Array,
          chunks: divideIntoChunks(3, 5, 21),
        },
      ]);
    });
  })
});
