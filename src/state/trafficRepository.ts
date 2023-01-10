import { RESP } from '../redis-client/resp';
import EventEmitter from 'events';
import { hash } from '../utils/hash';
import { BulkString } from '../redis-client/resp/types';

interface Response {
  plain: string;
  value: string[];
}

interface Request {
  id: string;
  plain: string;
  value: string[];
  time: number;
  response: Response | null;
}

interface HistoryLog {
  id: string;
  request: string;
  response: string | null;
  time: number;
}

export declare interface TrafficRepository {
  on(event: 'request', handler: (req: Request) => void): this;
}

export class TrafficRepository extends EventEmitter {
  private history: HistoryLog[] = [];
  private limit = 100;

  log(request: string, response: string): void {
    const log: HistoryLog = {
      id: hash(),
      request,
      response,
      time: Date.now(),
    };

    this.history.push(log);
    this.history = this.history.slice(-this.limit);
    this.emit('request', this.parse(log));
  }

  logRequest(request: string): string {
    const log: HistoryLog = {
      id: hash(),
      request,
      response: null,
      time: Date.now(),
    };

    this.history.push(log);
    this.history = this.history.slice(-this.limit);
    this.emit('request', this.parse(log));

    return log.id;
  }

  logResponse(requestId: string, response: string): void {
    const log = this.history.find((log) => log.id === requestId);
    if (!log) {
      console.warn('[traffic-repository] request not found', { id: requestId });
      return;
    }

    log.response = response;
    this.emit('request', this.parse(log));
  }

  all(): Request[] {
    return this.history.map((log) => this.parse(log));
  }

  find(id: string): Request | null {
    const log = this.history.find((s) => s.id === id);
    if (!log) {
      return null;
    }

    return this.parse(log);
  }

  clear() {
    this.history = [];
  }

  renderRequest(request: Array<string | BulkString>): string {
    return request
      .map((str) => str.replace('"', '\\"'))
      .map((str) => (/\s/.test(str.toString()) ? `"${str}"` : str))
      .join(' ');
  }

  private parse(log: HistoryLog): Request {
    return {
      id: log.id,
      plain: log.request,
      value: RESP.decodeRequest(log.request).map((v) => this.renderRequest(v)),
      time: log.time,
      response: log.response
        ? {
            plain: log.response,
            value: RESP.decodeFull(log.response).map((v) => RESP.render(v)),
          }
        : null,
    };
  }
}

export const trafficRepository = new TrafficRepository();
