import { HttpServer } from '../server/http/httpServer';
import { serverState } from '../server/http/serverState';

export interface ServerConfig {
  port: number;
  'sync-mode': boolean;
}

export class ServerCommand {
  handle(config: ServerConfig) {
    serverState.update({
      syncMode: config['sync-mode'],
    });
    const server = new HttpServer(config.port);
    server.run();
  }
}

export const serverCommand = new ServerCommand();
