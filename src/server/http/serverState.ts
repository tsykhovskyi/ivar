import EventEmitter from 'events';

interface State {
  intercept: boolean;
  syncMode: boolean;
  scriptFilters: string[];
}

class ServerState extends EventEmitter {
  state: State = {
    intercept: true,
    syncMode: false,
    scriptFilters: [],
  };

  update(state: Partial<State>) {
    this.state = { ...this.state, ...state };
  }

  shouldInterceptScript(script: string) {
    if (!this.state.intercept) {
      return false;
    }

    if (this.state.scriptFilters.length === 0) {
      return true;
    }

    return (
      this.state.scriptFilters.findIndex((f) => script.indexOf(f) !== -1) !== -1
    );
  }
}

export const serverState = new ServerState();
