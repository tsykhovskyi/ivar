import { registerApi } from "./api";
import fastify, { FastifyInstance } from "fastify";
import path from "path";
import EventEmitter from 'events';

export class HttpServer {
  private server: FastifyInstance;
  private events: EventEmitter;

  constructor(private port: number) {
    this.server = fastify();
    this.events = new EventEmitter();
    this.server.register(require('@fastify/websocket'));
    this.server.register(require('@fastify/static'), {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    registerApi(this.server, this.events);
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
