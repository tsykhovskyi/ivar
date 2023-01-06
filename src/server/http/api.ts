import { FastifyInstance, FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { readContent } from '../../utils/folder';
import { executeScript, ExecuteScriptRequest } from './commands/executeScript';
import { getSessions } from './commands/getSessions';
import {
  debuggerAction,
  DebuggerActionRequest,
} from './commands/debuggerAction';
import { deleteSession } from './commands/deleteSession';
import { serverState } from './serverState';
import { configState } from './commands/configState';
import { sessionRepository } from '../../state/sessionRepository';
import { trafficRepository } from '../../state/trafficRepository';

export const registerApi = (server: FastifyInstance) => {
  server.setErrorHandler(function (error, _request, reply) {
    if (error instanceof (server as any).errorCodes.FST_ERR_BAD_STATUS_CODE) {
      // Log error
      this.log.error(error);
      // Send error response
      reply.status(500).send({ ok: false });
    }
  });

  server.register(async function (s) {
    const connections: SocketStream[] = [];
    s.get(
      '/ws',
      { websocket: true },
      (connection: SocketStream /* SocketStream */, _req: FastifyRequest) => {
        connections.push(connection);
      }
    );

    const broadcast = (type: string, message: unknown) => {
      connections.forEach((connection) =>
        connection.socket.send(JSON.stringify({ type, message }))
      );
    };

    sessionRepository.on('change', () =>
      broadcast('sessions', getSessions.handle())
    );

    trafficRepository.on('request', (req) => broadcast('request', req));
  });

  server.get('/sessions', (_request, reply) => {
    reply.status(200).send(getSessions.handle());
  });

  server.get('/traffic', (_request, reply) => {
    reply.status(200).send(trafficRepository.all());
  });

  server.get<{
    Params: {
      id: string;
    };
  }>('/traffic/:id', (request, reply) => {
    const trafficReq = trafficRepository.find(request.params.id);
    if (!trafficReq) {
      reply.status(404).send();
    } else {
      reply.status(200).send(trafficReq);
    }
  });

  server.delete('/traffic', (_request, reply) => {
    trafficRepository.clear();
    reply.status(200).send([]);
  });

  server.delete<{
    Params: {
      sessionId: string;
    };
  }>('/sessions/:sessionId', (request, reply) => {
    deleteSession.handle(request.params.sessionId);
    reply.status(200).send();
  });

  server.post<{
    Body: Omit<ExecuteScriptRequest, 'lua'> & { script: string };
  }>(
    '/execute-file',
    {
      schema: {
        body: {
          type: 'object',
          required: ['script'],
          properties: {
            script: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const lua = await readContent(request.body.script);

      const result = await executeScript.handle({ ...request.body, lua });

      reply.code(201).send(result);
    }
  );

  server.post<{
    Body: ExecuteScriptRequest;
  }>('/execute-plain', async (request, reply) => {
    const result = await executeScript.handle(request.body);

    reply.code(201).send(result);
  });

  server.post<{
    Body: DebuggerActionRequest;
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

  server.get('/config', async (_request, reply) => {
    reply.status(200).send(configState.handle());
  });

  server.post<{
    Body: { intercept: boolean; scriptFilters: string[]; syncMode: boolean };
  }>(
    '/config',
    {
      schema: {
        body: {
          type: 'object',
          required: ['intercept', 'scriptFilters', 'syncMode'],
          properties: {
            script: { type: 'string' },
            scriptFilters: { type: 'array' },
          },
        },
      },
    },
    async (request, reply) => {
      serverState.update(request.body);
      reply.status(200).send(serverState.state);
    }
  );
};
