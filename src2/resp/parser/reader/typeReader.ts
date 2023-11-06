import { MessageResult, PendingMessage } from './Reader';

export interface TypeReader {
  readNewMessage(chunk: Buffer, offset: number): MessageResult | null;

  readMessageWithDebt(chunk: Buffer, pendingMessage: PendingMessage): MessageResult | null;
}
