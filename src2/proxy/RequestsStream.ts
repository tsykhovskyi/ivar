import { Readable } from 'stream';

class Request {
  constructor(public content: string) {
  }
}

export class RequestsStream extends Readable {
  constructor() {
    super({
      objectMode: true,
    });
  }

  override _read(): void {
    return;
  }

  newRequest(request:string): Request {
    const r = new Request(request)
    this.push(r);
    return r;
  }
}
