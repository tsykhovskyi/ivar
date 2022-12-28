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

interface HistoryLog {
  request: string;
  response: string;
  time: number;
}

export declare interface TrafficRepository {
  on(event: 'request', handler: (req: Request) => void): this;
}

export class TrafficRepository extends EventEmitter {
  private history: HistoryLog[] = [];
  private limit = 100;

  log(request: string, response: string): void {
    const log = {
      request,
      response,
      time: Date.now(),
    };

    this.history.push(log);
    this.history = this.history.slice(-this.limit);
    this.emit('request', this.parse(log));
  }

  all(): Request[] {
    return this.history.map((log) => this.parse(log));
  }

  private parse(log: HistoryLog): Request {
    return {
      plain: log.request,
      value: RESP.decodeRequest(log.request),
      time: log.time,
      response: {
        plain: log.response,
        value: RESP.decodeFull(log.response),
      },
    };
  }
}

export const trafficRepository = new TrafficRepository();
