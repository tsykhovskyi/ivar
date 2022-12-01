import { registerApi } from "./api";
import fastify, { FastifyInstance } from "fastify";
import path from "path";

export class HttpServer {
  private server: FastifyInstance;

  constructor(private port: number) {
    this.server = fastify();
    this.server.register(require('@fastify/websocket'));
    this.server.register(require('@fastify/static'), {
      root: path.join(__dirname, '../public'),
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
