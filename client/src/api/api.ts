import type { Http } from './http';
import type { Ws } from './ws';
import { DebuggerApi } from '@/api/debugger/debugger.api';
import { TrafficApi } from '@/api/traffic/traffic.api';

export interface ServerConfig {
  intercept: boolean;
  syncMode: boolean;
  scriptFilters: string[];
  server: {
    title: string;
    version: string;
  };
  tunnels: { src: string; dst: string }[];
}

export class Api {
  public readonly debugger: DebuggerApi;
  public readonly traffic: TrafficApi;

  constructor(private http: Http, private ws: Ws) {
    this.debugger = new DebuggerApi(http, ws);
    this.traffic = new TrafficApi(http, ws);
  }

  async config(): Promise<ServerConfig> {
    return this.http.get('/config');
  }

  async updateConfig(config: ServerConfig) {
    await this.http.post('/config', config);
  }
}
