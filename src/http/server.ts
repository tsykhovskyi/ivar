import fastify from 'fastify'
import * as fs from "fs";
import { processSourceCode, responseToHtml, Section } from "./parser";
import { debugSessionStarted, execAction, runDebugSession } from "./handler";
import path from "path";
import stringArgv from "string-argv";
import { LuaPlainRequest, luaRequestToDebugArgs } from "./request";

const server = fastify();

server.get('/check', (request, reply) => {
  reply.status(200).send({
    sessionActive: debugSessionStarted(),
  })
})

server.get('/', (request, reply) => {
  let fileStream;
  if (debugSessionStarted()) {
    fileStream = fs.createReadStream(path.resolve(__dirname, './../public/debugger.html'))
  } else {
    fileStream = fs.createReadStream(path.resolve(__dirname, './../public/index.html'))
  }

  reply.type('text/html').send(fileStream)
})

server.post('/execute-file', async (request, reply) => {
  const redisCmd = (request.body as string).trim();
  if (!redisCmd) {
    return reply.code(400).send();
  }

  await runDebugSession(stringArgv(redisCmd));

  reply.code(201 ).send();
});


server.post('/execute-plain', async (request, reply) => {
  const ldbArgs = await luaRequestToDebugArgs(request.body as LuaPlainRequest);

  await runDebugSession(ldbArgs);

  reply.code(201 ).send();
});

server.post('/cmd', async (request, reply) => {
  const cmd = request.body as any;

  try {
    const result  = await execAction(cmd.action, cmd.value ?? null);

    reply.status(200).send({
      cmdResponse: responseToHtml(result.cmdResponse, Section.response),
      sourceCode: processSourceCode(result.sourceCode),
      variables: responseToHtml(result.variables, Section.variables),
      trace: responseToHtml(result.trace, Section.trace),
    });
  } catch (error) {
    reply.status(404).send({error: (error as Error).toString()});
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
