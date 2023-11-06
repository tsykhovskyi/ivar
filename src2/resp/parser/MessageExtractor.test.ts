import { MessageExtractor } from './MessageExtractor';
import { RespValueType } from '../utils/types';

describe('MessageExtractor', () => {
  let messageExtractor: MessageExtractor;

  beforeEach(() => {
    messageExtractor = new MessageExtractor();
  })

  it('should parse single-chunk message', () => {
    const buffer = Buffer.from('*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');

    messageExtractor.add(buffer);
    expect(messageExtractor.messages).toEqual([
      {
        type: RespValueType.Array,
        chunks: [
          {
            buffer,
            start: 0,
            end: buffer.length,
          },
        ],
      },
    ]);
  });

  it('should parse single-chunk multiple messages', () => {
    const firstMsg = '*3\r\n$3\r\nSET\r\n$8\r\ntest-key\r\n:42\r\n';
    const secondMsg = '$21\r\njust a simple message\r\n';
    const thirdMsg = '-Error test example\r\n';
    const fourthMsg = '+OK\r\n';

    const buffer = Buffer.from(
      firstMsg + secondMsg + thirdMsg + fourthMsg
    );

    messageExtractor.add(buffer);
    expect(messageExtractor.messages).toMatchObject(
      [
        {
          type: RespValueType.Array,
          chunks: [
            {
              start: 0,
              end: firstMsg.length,
            },
          ],
        },
        {
          type: RespValueType.BulkString,
          chunks: [
            {
              start: firstMsg.length,
              end: firstMsg.length + secondMsg.length,
            },
          ],
        },
        {
          type: RespValueType.Error,
          chunks: [
            {
              buffer,
              start: firstMsg.length + secondMsg.length,
              end: firstMsg.length + secondMsg.length + thirdMsg.length,
            },
          ],
        },
        {
          type: RespValueType.SimpleString,
          chunks: [
            {
              buffer,
              start: firstMsg.length + secondMsg.length + thirdMsg.length,
              end: firstMsg.length + secondMsg.length + thirdMsg.length + fourthMsg.length,
            },
          ],
        },
      ]
    );
  });

  describe('nested messages', () => {
    const buffer = Buffer.from(
      '*2\r\n' + // 4
      '*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n' + // 26
      '$3\r\nbaz\r\n' + // 35
      '*4\r\n:1\r\n:2\r\n:3\r\n*1\r\n-Err\r\n' // 61
    );

    it('should parse single-chunk nested messages', () => {
      messageExtractor.add(buffer);
      expect(messageExtractor.messages).toMatchObject([
        {
          type: RespValueType.Array,
          chunks: [
            {
              start: 0,
              end: 35,
            },
          ],
        },
        {
          type: RespValueType.Array,
          chunks: [
            {
              start: 35,
              end: 61,
            },
          ],
        },
      ]);
    });

    it('should parse multi-chunk nested message', () => {
      messageExtractor.add(buffer.slice(0, 4));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(4, 26));
      expect(messageExtractor.messages.length).toEqual(0);
      messageExtractor.add(buffer.slice(26, 35));
      expect(messageExtractor.messages.length).toEqual(1);
      expect(messageExtractor.pendingMessage).toBeNull();
      messageExtractor.add(buffer.slice(35, 61));
      expect(messageExtractor.messages).toMatchObject([
        {
          type: RespValueType.Array,
          chunks: [
            {
              start: 0,
              end: 4,
            },
            {
              start: 0,
              end: 22,
            },
            {
              start: 0,
              end: 9,
            },
          ],
        },
        {
          type: RespValueType.Array,
          chunks: [
            {
              start: 0,
              end: 26,
            },
          ],
        },
      ]);
      expect(messageExtractor.pendingMessage).toBeNull();
    });
  });
});
