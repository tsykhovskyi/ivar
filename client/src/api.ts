export class Api {
  async sendCommand(command: string, argument: string[] = []) {
    console.log('exec with ', { command, argument });
    const data = await fetch('/cmd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: command,
        value: argument ?? null,
      }),
    });

    const res = await data.json();

    return {
      cmdResponse: res.cmdResponse,
      sourceCode: res.sourceCode,
      variables: res.variables,
      trace: res.trace,
    };
  }
}

