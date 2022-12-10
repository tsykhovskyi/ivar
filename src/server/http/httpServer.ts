import { registerApi } from "./api";
import fastify, { FastifyInstance } from "fastify";
import path from "path";
import websocketPlugin from '@fastify/websocket';
import staticPlugin from '@fastify/static';

export class HttpServer {
  private server: FastifyInstance;

  constructor(private port: number) {
    this.server = fastify();
    this.server.register(websocketPlugin);
    this.server.register(staticPlugin, {
      root: path.join(__dirname, '../../../client/dist'),
      prefix: '/',
    });

    registerApi(this.server);
  }

  run() {
    this.server.listen({ port: this.port }, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`Debugger server listening at ${address}`)
    });
  }
}
