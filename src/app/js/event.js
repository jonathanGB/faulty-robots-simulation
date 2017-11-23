class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, cb, once = false) {
    let obj = {
      cb,
      once,
    };

    (eventName in this.events) ?
      this.events[eventName].push(obj) :
      this.events[eventName] = [obj];

    return this;
  }

  dispatch(eventName, data) {
    const isValidEvent = eventName in this.events;
    if (!isValidEvent) {
      return;
    }

    for (let event of this.events[eventName]) {
      event.cb(data);

      if (event.once) {
        this.off(eventName, event.cb);
      }
    }

    return this;
  }

  off(eventName, cb) {
    let filteredHandlers = this.events[eventName].filter(event => event.cb != cb);

    if (filteredHandlers.length) {
      this.events[eventName] = filteredHandlers;
    } else {
      delete this.events[eventName];
    }

    return this;
  }
}