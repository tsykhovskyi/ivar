import { registerApi } from "./http/api";
import fastify from "fastify";
import path from "path";

const server = fastify();
server.register(require('@fastify/websocket'));
server.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

registerApi(server);

// server.setErrorHandler(function (error, request, reply) {
//   // @ts-ignore
//   if (error instanceof server.errorCodes.FST_ERR_BAD_STATUS_CODE) {
//     // Log error
//     this.log.error(error)
//     // Send error response
//     reply.status(500).send({ ok: false })
//   }
// })


server.listen({ port: (process.env.PORT ?? 29999) as number }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
});

process.on('uncaughtException', function (err) {
  console.error('UNCAUGHT EXCEPTION:', err);
});
