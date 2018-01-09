export default class Subscription {
  constructor() {
    this.listeners = new Set();
  }

  clear = () => this.listeners.clear();

  get = () => this.listeners.values();

  notify = update => this.listeners.forEach(event => event(update));

  subscribe = (listener) => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };
}
