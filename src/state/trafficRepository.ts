import { RedisValue, RESP } from '../redis-client/resp';
import EventEmitter from 'events';

interface Response {
  plain: string;
  value: RedisValue;
}

interface Request {
  plain: string;
  value: RedisValue;
  time: number;
  response: Response;
}

export declare interface TrafficRepository {
  on(event: 'request', handler: (req: Request) => void): this;
}

export class TrafficRepository extends EventEmitter {
  private requests: Request[] = [];
  private limit = 100;

  log(request: string, response: string): void {
    const res: Response = {
      plain: response,
      value: RESP.decode(response),
    };

    const req: Request = {
      plain: request,
      value: RESP.decodeRequest(request),
      time: Date.now(),
      response: res,
    };

    this.requests.push(req);
    this.requests.slice(-this.limit);
    this.emit('request', req);
  }

  all(): Request[] {
    return this.requests;
  }
}

export const trafficRepository = new TrafficRepository();
