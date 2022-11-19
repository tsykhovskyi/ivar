import { FastifyInstance, FastifyRequest } from 'fastify'
import { SocketStream } from "@fastify/websocket";
import { readContent } from "../utils/folder";
import { executeScript, ExecuteScriptRequest } from "./commands/executeScript";
import { getSessions } from "./commands/getSessions";
import { debuggerAction, DebuggerActionRequest } from "./commands/debuggerAction";
import { sessionRepository } from '../session/sessionRepository';

export const registerApi = (server: FastifyInstance) => {
  server.register(async function (s) {
    const connections: SocketStream[] = [];
    s.get('/ws', { websocket: true }, (connection: SocketStream /* SocketStream */, req: FastifyRequest) => {
      connections.push(connection);
    });

    sessionRepository.on('change', () => {
      const sessionsResponse = JSON.stringify(getSessions.handle());
      connections.forEach(connection => connection.socket.send(sessionsResponse));
    })
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
    reply.status(200).send(getSessions.handle());
  });

  server.post<{
    Body: Omit<ExecuteScriptRequest, 'lua'> & { script: string }
  }>('/execute-file', {
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
    const lua = await readContent(request.body.script);

    const result = await executeScript.handle({ ...request.body, lua });

    reply.code(201).send(result);
  });

  server.post<{
    Body: ExecuteScriptRequest
  }>('/execute-plain', async (request, reply) => {
    const result = await executeScript.handle(request.body);

    reply.code(201).send(result);
  });

  server.post<{
    Body: DebuggerActionRequest
  }>('/cmd', async (request, reply) => {
    try {
      const result = await debuggerAction.handle(request.body);

      reply.status(200).send(result);
    } catch (error) {
      reply.status(200).send({
        cmdResponse: (error as Error).toString(),
      });
    }
  });
}

