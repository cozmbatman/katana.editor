const _SubWrap = function(name, cb, set) {
  this.name = name;
  this.cb = cb;
  this.set = set;
}
_SubWrap.prototype.execute = function(ev) {
  this.cb(ev);
}
_SubWrap.prototype.release = function() {
  this.cb = null;
  this.set.clear(this);
}

function Stream() {
  const streamHandlers = {};
  
  this.subscribe = (name, cb) => {
    if(typeof streamHandlers[name] === 'undefined') {
      streamHandlers[name] = new Set();
    }
    const sub = new _SubWrap(name, cb, streamHandlers[name]);
    streamHandlers[name].add(sub);
    return sub;
  };

  this.notifySubscribers = (name, ev) => {
    if(typeof streamHandlers[name] === 'undefined') {
      return;
    }
    const entries = streamHandlers[name].entries();
    for(const [k, v] of entries) {
      v.execute(ev);
    }
  }
}

export default new Stream();
