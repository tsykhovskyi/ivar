import { registerApi } from "./api";
import fastify, { FastifyInstance } from "fastify";
import path from "path";

export class HttpServer {
  private server: FastifyInstance;

  constructor() {
    this.server = fastify();
    this.server.register(require('@fastify/websocket'));
    this.server.register(require('@fastify/static'), {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    registerApi(this.server);
  }

  run() {
    this.server.listen({ port: (process.env.PORT ?? 29999) as number }, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`Server listening at ${address}`)
    });

  }
}
