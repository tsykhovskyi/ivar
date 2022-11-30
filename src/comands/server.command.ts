import { HttpServer } from '../server/http/httpServer';

export class ServerCommand {
  handle(config: { port: number}) {
    const server = new HttpServer(config.port);
    server.run();
  }
}

export const serverCommand = new ServerCommand();
