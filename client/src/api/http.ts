export class Http {
  async sessions() {
    const data = await fetch('/sessions');
    return await data.json();
  }

  async sendCommand(sessionId: string, command: string, argument?: string) {
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

