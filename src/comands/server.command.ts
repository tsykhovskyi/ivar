import { httpServer } from '../server/http/httpServer';
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
    httpServer.run(config.port);
  }
}

export const serverCommand = new ServerCommand();
