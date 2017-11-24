/**
 * Custom EventEmitter class
 * Can listen to (optionally once), dispatch, and stop listening to events
 */
class EventEmitter {
  constructor() {
    this.events = {}; // stores a map eventName => Array{Handlers}
  }

  /**
   * Listen to event `eventName`
   * 
   * @param {String} eventName key
   * @param {Function} cb handler to store 
   * @param {Bool} once if we want to listen to the event only once
   */
  on(eventName, cb, once = false) {
    let obj = {
      cb,
      once,
    };

    // store handler
    (eventName in this.events) ?
      this.events[eventName].push(obj) :
      this.events[eventName] = [obj];

    return this;
  }

  /**
   * Dispatch event `eventName`, providing to the listener `data`
   * 
   * @param {String} eventName key
   * @param {Object} data any data we want to share with the listener
   */
  dispatch(eventName, data) {
    // must be a valid eventName (found in our map)
    const isValidEvent = eventName in this.events;
    if (!isValidEvent) {
      return;
    }

    // call all the handlers with the provided key, and remove the handlers if they are one-time listeners
    for (let event of this.events[eventName]) {
      event.cb(data);

      if (event.once) {
        this.off(eventName, event.cb);
      }
    }

    return this;
  }

  /**
   * Remove the listener with key `eventName` and handler `cb`
   * @param {String} eventName key
   * @param {Function} cb handler of the event
   */
  off(eventName, cb) {
    // must be a valid eventName (found in our map)
    const isValidEvent = eventName in this.events;
    if (!isValidEvent) {
      return;
    }

    // keep all the handlers with key `eventName` that are not the handler `cb`
    let filteredHandlers = this.events[eventName].filter(event => event.cb != cb);

    // if there are other handlers left, keep them; otherwise, we delete this key, as there are no handlers linked
    if (filteredHandlers.length) {
      this.events[eventName] = filteredHandlers;
    } else {
      delete this.events[eventName];
    }

    return this;
  }
}