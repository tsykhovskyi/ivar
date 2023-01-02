import type { Http } from '@/api/http';
import type { Ws } from '@/api/ws';
import type { RedisRequest } from '@/api/traffic/traffic';

export class TrafficApi {
  private trafficListeners: Array<(request: RedisRequest) => void> = [];

  constructor(private http: Http, private ws: Ws) {
    this.ws.onMessage((data) => {
      const { type, message } = JSON.parse(data);
      if (type === 'request') {
        this.trafficListeners.forEach((listener) => {
          listener(message);
        });
      }
    });
  }

  async all(): Promise<RedisRequest[]> {
    return this.http.get('/traffic');
  }

  async find(id: string): Promise<RedisRequest> {
    return this.http.get(`/traffic/${id}`);
  }

  async clear(): Promise<void> {
    return this.http.delete('/traffic');
  }

  onTraffic(listener: (request: RedisRequest) => void): void {
    this.trafficListeners.push(listener);
  }
}
