import { MessageChunkDebt } from '../reader/Reader';
import { RespValueType } from '../../utils/types';
import { defineRespType } from '../BufferUtils';
import { ChunksGroup } from './ChunksGroup';
import Buffer from 'buffer';

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

export type MessagesMiningResult = {
  messages: MessageInfo[],
  chunks: Buffer[],
}

export class MessagesBuilder {
  public offset = 0;
  public chunksGroup: ChunksGroup;

  messages: MessageInfo[] = [];
  messageDebt: MessageChunkDebt[] = [];

  constructor() {
    this.chunksGroup = new ChunksGroup();
  }

  add(chunk: Buffer) {
    this.chunksGroup.add(chunk);
  }

  get isCompleted() {
    return this.messageDebt.length === 0;
  }

  get result(): MessagesMiningResult {
    return {
      messages: this.messages,
      chunks: this.chunksGroup.chunks,
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

  registerDebt(debt: MessageChunkDebt) {
    this.registerSimpleMessage(debt.type, this.chunksGroup.length);

    this.messageDebt.push(debt);
  }

  isStartingWithType<T extends RespValueType>(typeFn: (type: RespValueType) => type is T): T | null {
    if (!this.isCompleted) {
      return null;
    }
    const type = defineRespType(this.chunksGroup.at(this.offset))
    if (!type || !typeFn(type)) {
      return null;
    }
    return type;
  }

  popDebtIf<T extends MessageChunkDebt>(condition: (chunk: MessageChunkDebt) => chunk is T): T | null {
    const debt = this.messageDebt.at(-1);
    if (debt && condition(debt)) {
      this.messages.pop();
      return debt;
    }
    return null;
  }
}
