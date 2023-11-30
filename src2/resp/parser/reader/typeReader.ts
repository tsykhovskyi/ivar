import { MessagesBuilder } from '../queue/MessagesBuilder';

export interface TypeReader {
  tryToRead(messagesBuilder: MessagesBuilder): void;
}
