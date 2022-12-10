export class Ws {
  private _ws: WebSocket;
  private onMessageHandlers: ((message: string) => void)[] = [];

  constructor() {
    this._ws = new WebSocket(`ws://${window.location.host}/ws`);
    this._ws.onmessage = (event) => {
      for (const handler of this.onMessageHandlers) {
        handler(event.data.toString());
      }
    };
    this._ws.onopen = () => {
      console.log('ws connection established');
    };
  }

  public onMessage(handler: (message: string) => void) {
    this.onMessageHandlers.push(handler);
  }
}
