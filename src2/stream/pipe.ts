import { Readable } from 'stream';
import { PipeContour } from '../resp/parser/MessagesGroupExtractor';

export class Pipe extends Readable {
  override _read(size: number) {
    return;
  }

  __complete(messagesGroup: PipeContour) {
    this.emit('completed', messagesGroup);
    this.push(null);
  }
}
