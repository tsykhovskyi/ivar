export class PayloadExtractor {
  position = 0;

  constructor(private payload: string) {}

  resetPosition() {
    this.position = 0;
  }

  append(chunk: string) {
    this.payload += chunk;
  }

  positionLineBack(lineSeparator = '\r\n') {
    const prevNewline = this.payload
      .substring(0, this.position - lineSeparator.length)
      .lastIndexOf(lineSeparator);

    let prevLineStart = 0;
    if (prevNewline > -1) {
      prevLineStart = prevNewline + lineSeparator.length;
    }
    this.position = prevLineStart;
  }

  nextLine(lineSeparator = '\r\n'): string {
    let lineEnd = this.payload.indexOf(lineSeparator, this.position);
    let nextPosition = lineEnd + lineSeparator.length;
    if (lineEnd === -1) {
      lineEnd = this.payload.length;
      nextPosition = this.payload.length;
    }
    const line = this.payload.substring(this.position, lineEnd);
    this.position = nextPosition;
    return line;
  }

  nextBulk(size: number): string {
    const bulkEnd = this.position + size;
    if (
      bulkEnd < this.payload.length &&
      this.payload.substring(bulkEnd, bulkEnd + 2) !== '\r\n'
    ) {
      throw new Error('RESP error: bulk does not end with newline');
    }
    const bulk = this.payload.substring(this.position, bulkEnd);
    this.position = bulkEnd + 2;
    return bulk;
  }

  isCompleted(): boolean {
    return this.position === this.payload.length;
  }

  processedPayload(): string {
    return this.payload.substring(0, this.position);
  }

  unprocessedPayload(): string {
    return this.payload.substring(this.position);
  }
}
