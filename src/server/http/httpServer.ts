import { registerApi } from './api';
import fastify, { FastifyInstance } from 'fastify';
import path from 'path';
import websocketPlugin from '@fastify/websocket';
import staticPlugin from '@fastify/static';

export class HttpServer {
  private readonly server: FastifyInstance;
  public address: string = '';

  constructor() {
    this.server = fastify();
    this.server.register(websocketPlugin);
    this.server.register(staticPlugin, {
      root: path.join(__dirname, '../../../client/dist'),
      prefix: '/',
    });

    registerApi(this.server);
  }

  run(port: number) {
    this.server.listen({ port: port }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      this.address = address;
      console.log(`Debugger server listening at ${address}`);
    });
  }
}

export const httpServer = new HttpServer();
