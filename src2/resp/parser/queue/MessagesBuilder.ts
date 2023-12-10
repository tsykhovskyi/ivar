import { RespValueType } from '../../utils/types';
import { ChunksGroup } from './ChunksGroup';
import Buffer from 'buffer';
import { getAsciiCode } from '../../utils/ascii';

export type MessageInfo = MessageSimpleInfo | MessageCollectionInfo;

type MessageSimpleInfo = {
  type: RespValueType;
  start: number;
  end: number;
}

type MessageCollectionInfo = MessageSimpleInfo & {
  items: MessageInfo[];
  size: number;
}

const isCollectionMessage = (message: MessageInfo): message is MessageCollectionInfo => {
  return 'items' in message;
}

export type PipeBuildResult = {
  messages: MessageInfo[],
  chunks: Buffer[],
  isCompleted: boolean,
}

export class MessagesBuilder {
  public offset = 0;
  public chunksGroup: ChunksGroup;

  messages: MessageInfo[] = [];

  constructor() {
    this.chunksGroup = new ChunksGroup();
  }

  add(chunk: Buffer) {
    this.chunksGroup.add(chunk);
  }

  get isCompleted() {
    if (!this.isLastArrayClosed(this.messages)) {
      return false;
    }

    return this.offset === this.chunksGroup.length;// && this.messageDebt.length === 0;
  }

  private isLastArrayClosed(collection: MessageInfo[]): boolean {
    const lastMessage = collection[collection.length - 1];
    if (!lastMessage || !isCollectionMessage(lastMessage)) {
      return true;
    }
    if (lastMessage.items.length < lastMessage.size) {
      return false;
    }
    return this.isLastArrayClosed(lastMessage.items);
  }

  get result(): PipeBuildResult {
    return {
      messages: this.messages,
      chunks: this.chunksGroup.chunks,
      isCompleted: this.isCompleted,
    };
  }

  private pushMessage(collection: MessageInfo[], message: MessageInfo, canAppend = true): boolean {
    const lastMessage = collection[collection.length - 1];
    if (lastMessage && isCollectionMessage(lastMessage) ) {
      const added = this.pushMessage(lastMessage.items, message, lastMessage.items.length < lastMessage.size);
      if (added) {
        lastMessage.end = message.end;
        return true;
      }
    }
    if (canAppend) {
      collection.push(message);
      return true;
    }
    return false;
  }

  registerSimpleMessage(type: RespValueType, end: number): void {
    this.pushMessage(this.messages,{
      type,
      start: this.offset,
      end: end,
    });
    this.offset = end;
  }

  registerCollectionMessage(type: RespValueType, end: number, length: number): void {
    this.pushMessage(this.messages, <MessageCollectionInfo>{
      type,
      start: this.offset,
      end: end,
      items: [],
      size: length,
    });
    this.offset = end;
  }

  isStartingWithType<T extends RespValueType>(typeFn: (type: RespValueType) => type is T): T | null {
    const type = this.defineRespType(this.chunksGroup.at(this.offset))
    if (!type || !typeFn(type)) {
      return null;
    }
    return type;
  }

  private defineRespType(symbol?: number): RespValueType | undefined {
    switch (symbol) {
      case getAsciiCode('+'): return RespValueType.SimpleString;
      case getAsciiCode('-'): return RespValueType.Error;
      case getAsciiCode(':'): return RespValueType.Integer;
      case getAsciiCode('$'): return RespValueType.BulkString;
      case getAsciiCode('*'): return RespValueType.Array;
    }
    return undefined;
  }
}
