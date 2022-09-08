export class Api {
  async sessions() {
    const data = await fetch('/sessions');
    const res = await data.json();
    console.log(res);
  }

  async sendCommand(command: string, argument: string[] = []) {
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

export const api = new Api();

