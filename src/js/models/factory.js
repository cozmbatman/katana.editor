import Utils from '../utils';
import Stream from '../stream';

import Section from './section';
import Item from './item';
import Common from './common';

function ModelFactory(opts) {
  this.opts = opts;
  this.streamer = Stream;

  this.current_editor = opts.editor;
  this.elNode = this.current_editor.elNode;
  this.mode = opts.mode || 'read';

  this.build = this.build.bind(this);
  this.stop = this.stop.bind(this);
  this.getSerializer = this.getSerializer.bind(this);

  this.successCallback = this.successCallback.bind(this);
  this.errorCallback = this.errorCallback.bind(this);
  this.cache = {};
  this.addTo = {};
}

ModelFactory.prototype.warmupOnly = false;
ModelFactory.prototype.goingForUnload = false;

ModelFactory.prototype.manage = function manage(warmup) {
  if (this.mode === 'write') {
    if (typeof warmup !== 'undefined') {
      this.warmupOnly = true;
      setTimeout(() => {
        this.build();
      }, 1000);
    }

    this.timer = setInterval(this.build, 8000);
    this.streamer.subscribe('Katana.Committer.doSave', () => {
      this.build();
    });

    window.addEventListener('beforeunload', () => {
      this.goingForUnload = true;
      return this.build();
    });
  }
};

ModelFactory.prototype.stop = function stop() {
  clearInterval(this.timer);
};

ModelFactory.prototype.cache = {};

ModelFactory.prototype.fixNames = function fixNames() {
  const items = this.elNode.querySelectorAll('[name]');

  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    const name = it.attr('name');
    const duplicates = this.elNode.querySelectorAll(`[name="${name}"]`);

    if (duplicates && duplicates.length > 1) {
      for (let k = 1; k < duplicates.length; k += 1) {
        // make it nine digit in case we end up with some conflicts again
        duplicates[k].attr('name', Math.random().toString(36).slice(9));
      }
    }
  }
};

ModelFactory.prototype.successCallback = function successCallback() {
  this.cache = this.addTo;
};

ModelFactory.prototype.errorCallback = function errorCallback() {

};

ModelFactory.prototype.build = function build() {
  this.fixNames();

  const sections = this.elNode.querySelectorAll('section');
  const serializer = this.getSerializer('section');

  if (this.current_editor.currentRequestCount) {
    if (this.goingForUnload) {
      this.goingForUnload = false;
      this.streamer.notifySubscribers('Katana.Important', { msg: 'Your story has unsaved changes' });
    }
    return;
  }

  this.addTo = {};

  for (let i = 0; i < sections.length; i += 1) {
    serializer.build(sections[i], i);
  }

  /* if (this.warmupOnly) {
    this.cache = this.addTo;
    this.warmupOnly = false;
    return;
  } */

  const delta = this.findDelta();

  if (delta) {
    // TODO generate sequence information here
    this.streamer.notifySubscribers('Katana.Commit', {
      delta,
    });

    if (this.goingForUnload) {
      this.goingForUnload = false;
      this.streamer.notifySubscribers('Katana.Important', { msg: 'Your story has unsaved changes' });
    }
  }
};

ModelFactory.prototype.findDelta = function findDelta() {
  const deltaOb = {};
  let item;
  let citem;

  const { addTo } = this;
  const { cache } = this;
  let changeCounter = 0;

  const addToProps = Object.keys(addTo);
  for (let i = 0; i < addToProps.length; i += 1) {
    const prop = addToProps[i];
    item = addTo[prop];
    citem = typeof cache[prop] !== 'undefined' ? cache[prop] : false;
    if (citem && !Utils.isEqual(item, citem)) {
      deltaOb[prop] = item;
      changeCounter += 1;
    } else if (!citem) {
      changeCounter += 1;
      deltaOb[prop] = item;
    }
  }

  const cacheProps = Object.keys(cache);
  for (let i = 0; i < cacheProps.length; i += 1) {
    const prop = cacheProps[i];
    citem = cache[prop];
    item = typeof addTo[prop] === 'undefined';
    if (item) {
      changeCounter += 1;
      deltaOb[prop] = { removed: true };
    }
  }

  if (changeCounter > 0) {
    return deltaOb;
  }
  return false;
};

ModelFactory.prototype.getLayoutType = function getLayoutType(element) {
  if (element.hasClass('full-width-column')) {
    return 6;
  } if (element.hasClass('center-column')) {
    return 5;
  }
  return 0;
};

ModelFactory.prototype.serializers = {};

ModelFactory.prototype.getSerializer = function getSerializer(name) {
  if (!this.serializers[name]) {
    let model = null;
    if (name === 'section') {
      model = new Section({ factory: this, common: Common });
    } else if (name === 'item') {
      model = new Item({ factory: this, common: Common });
    }
    if (model !== null) {
      this.serializers[name] = model;
    }
  }
  return this.serializers[name];
};

export default ModelFactory;
