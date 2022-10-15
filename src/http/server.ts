import fastify, { FastifyRequest } from 'fastify'
import { getSessions, execAction, runDebugSession } from "./handler";
import path from "path";
import { SocketStream } from "@fastify/websocket";
import { LuaPlainRequest } from "../ldb/lua-debugger-interface";
import { readContent } from "../utils/folder";

const server = fastify();
server.register(require('@fastify/websocket'));
server.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

server.register(async function (s) {
  const connections: SocketStream[] = [];
  // @ts-ignore
  s.get('/ws', { websocket: true }, (connection: SocketStream /* SocketStream */, req: FastifyRequest) => {
    connections.push(connection);
    // setTimeout(() => {
    //   connection.socket.send([])
    // }, 3000);
    // connection.socket.on('message', message => {
    //   // message.toString() === 'hi from client'
    //   connection.socket.send('hi from server: '+ message.toString())
    // })

  });

  setInterval(() => {
    const sessions = getSessions();
    connections.forEach(connection => connection.socket.send(JSON.stringify(sessions)));
  }, 3000)
});

// server.get('/', (request, reply) => {
//   let fileStream;
//   if (debugSessionStarted()) {
//     fileStream = fs.createReadStream(path.resolve(__dirname, './../public/debugger.html'))
//   } else {
//     fileStream = fs.createReadStream(path.resolve(__dirname, './../public/index.html'))
//   }
//
//   reply.type('text/html').send(fileStream)
// });

server.get('/sessions', (request, reply) => {
  reply.status(200).send(getSessions());
});

server.post('/execute-file', {
  schema: {
    body: {
      type: 'object',
      required: ['script'],
      properties: {
        script: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  // @ts-ignore
  const lua = await readContent(request.body.script);

  // @ts-ignore
  const luaRequest = { ...request.body, lua }

  // @ts-ignore
  const result = await runDebugSession(luaRequest as LuaPlainRequest);

  reply.code(201).send(result);
});

server.post('/execute-plain', async (request, reply) => {
  const result = await runDebugSession(request.body as LuaPlainRequest);

  reply.code(201).send(result);
});

server.post('/cmd', async (request, reply) => {
  const cmd = request.body as any;

  try {
    const result = await execAction(cmd.action, cmd.value ?? null);

    reply.status(200).send(result);
  } catch (error) {
    reply.status(200).send({
      cmdResponse: (error as Error).toString(),
    });
  }
});

export function runHttp() {
  server.listen({ port: (process.env.PORT ?? 29999) as number }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}
