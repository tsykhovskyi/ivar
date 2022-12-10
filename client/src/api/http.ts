export class Http {
  async get(uri: string) {
    const data = await fetch(uri);
    return data.json();
  }

  async post<T>(uri: string, body: Record<string, any>): Promise<T> {
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  async delete(uri: string): Promise<void> {
    await fetch(uri, {
      method: 'DELETE',
    });
  }
}
