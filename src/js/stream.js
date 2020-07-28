const SubWrap = function SubWrap(name, cb, set) {
  this.name = name;
  this.cb = cb;
  this.set = set;
};
SubWrap.prototype.execute = function execute(ev) {
  this.cb(ev);
};
SubWrap.prototype.release = function release() {
  this.cb = null;
  this.set.clear(this);
};

function Stream() {
  const streamHandlers = {};

  this.subscribe = (name, cb) => {
    if (typeof streamHandlers[name] === 'undefined') {
      streamHandlers[name] = new Set();
    }
    const sub = new SubWrap(name, cb, streamHandlers[name]);
    streamHandlers[name].add(sub);
    return sub;
  };

  this.notifySubscribers = (name, ev) => {
    if (typeof streamHandlers[name] === 'undefined') {
      return;
    }
    const handlers = streamHandlers[name];
    const keys = Object.keys(handlers);
    for (let i = 0; i < keys.length; i += 1) {
      handlers[keys[i]].execute(ev);
    }
  };
}

export default new Stream();
