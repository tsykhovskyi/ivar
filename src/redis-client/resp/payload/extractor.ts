export class PayloadExtractor {
  position = 0;

  constructor(private readonly payload: string) {}

  nextLine(): string {
    const lineEnd = this.payload.indexOf('\r\n', this.position);
    if (lineEnd === -1) {
      throw new Error('RESP error: line end cannot be found');
    }
    const line = this.payload.substring(this.position, lineEnd);
    this.position = lineEnd + 2;
    return line;
  }

  nextBulk(size: number): string {
    const bulkEnd = this.position + size;
    if (this.payload.substring(bulkEnd, bulkEnd + 2) !== '\r\n') {
      throw new Error('RESP error: bulk does not end with newline');
    }
    const bulk = this.payload.substring(this.position, bulkEnd);
    this.position = bulkEnd + 2;
    return bulk;
  }

  isCompleted(): boolean {
    return this.position === this.payload.length;
  }

  unprocessedPayload(): string {
    return this.payload.substring(this.position);
  }
}
