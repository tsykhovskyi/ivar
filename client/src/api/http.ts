export class Http {
  async sessions() {
    const data = await fetch('/sessions');
    const res = await data.json();
    console.log(res);
    return res;
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

    return data.json();
  }
}

