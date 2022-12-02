import EventEmitter from 'events';

interface State {
  intercept: boolean;
  scriptFilters: string[]
}

declare interface ServerState {
  on(eventName: 'update', listener: (state: State) => void): this;
}

class ServerState extends EventEmitter {
  state: State = {
    intercept: true,
    scriptFilters: [],
  };

  update(state: State) {
    this.state = state;
    this.emit('update', this.state);
  }
}

export const serverState = new ServerState();
