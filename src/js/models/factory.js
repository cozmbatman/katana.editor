
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

  this._build = this._build.bind(this);
  this.stop = this.stop.bind(this);
  this.getSerializer = this.getSerializer.bind(this);

  this.successCallback = this.successCallback.bind(this);
  this.errorCallback = this.errorCallback.bind(this);
  this.cache = {};
  this.addTo = {};

};

ModelFactory.prototype.warmupOnly = false;
ModelFactory.prototype.goingForUnload = false;

ModelFactory.prototype.manage = function (warmup) {
  if (this.mode == 'write') {
    if (typeof warmup != 'undefined') {
      this.warmupOnly = true;
      setTimeout(() => {
        this._build();
      }, 1000);
    }

    this.timer = setInterval(this._build, 8000);
    this.streamer.subscribe('Katana.Committer.doSave', () => {
      this._build();
    });

    window.addEventListener('beforeunload', (e) => {
      this.goingForUnload = true;
      return this._build();
    });
  }
};

ModelFactory.prototype.stop = function () {
  clearInterval(this.timer);
};

ModelFactory.prototype._cache = {};

ModelFactory.prototype._fixNames = function () {
  const items = this.elNode.querySelectorAll('[name]');
      
  for (let i = 0; i < items.length; i = i + 1) {
    const it = items[i],
          name = it.attr('name'),
          duplicates = this.elNode.querySelectorAll('[name="' + name + '"]');

    if (duplicates && duplicates.length > 1) {
      for( let k = 1; k < duplicates.length; k = k +1) {
        // make it nine digit in case we end up with some conflicts again
        duplicates[k].attr('name', Math.random().toString(36).slice(9)); 
      }
    }
  }

};

ModelFactory.prototype.successCallback = function (e) {
  this.cache = this.addTo;
};

ModelFactory.prototype.errorCallback = function () {

};

ModelFactory.prototype._build = function() {
  this._fixNames();

  const sections = this.elNode.querySelectorAll('section'),
    serializer = this.getSerializer('section');

  if (this.current_editor.currentRequestCount) {
    if (this.goingForUnload) {
      this.goingForUnload = false;
      this.streamer.notifySubscribers('Katana.Important', {msg: 'Your story has unsaved changes'});
    }
    return;
  }

  this.addTo = {};

  for(let i = 0; i < sections.length; i = i + 1) {
    serializer.build(sections[i], i);
  }

/*if (this.warmupOnly) {
    this.cache = this.addTo;
    this.warmupOnly = false;
    return;
  } */

  let delta = this.findDelta();

  if (delta ) {
    //TODO generate sequence information here
    this.streamer.notifySubscribers('Katana.Commit', {
      delta: delta,
    });
    
    if (this.goingForUnload) {
      this.goingForUnload = false;
      this.streamer.notifySubscribers('Katana.Important', {msg: 'Your story has unsaved changes'});
    }
  }
};

ModelFactory.prototype.findDelta = function () {
  let deltaOb = {},
      item,
      citem,
      prop,
      addTo = this.addTo,
      cache = this.cache,
      changeCounter = 0;

  for (prop in addTo) {
    if (addTo.hasOwnProperty(prop)) {
      item = addTo[prop];
      citem = typeof cache[prop] != 'undefined' ? cache[prop] : false;
      if (citem && !Utils.isEqual(item, citem)) {
        deltaOb[prop] = item;
        changeCounter++;
      } else if (!citem) {
        changeCounter++;
        deltaOb[prop] = item;
      }
    }
  }

  for (prop in cache) {
    if (cache.hasOwnProperty(prop)) {
      citem = cache[prop];
      item = typeof addTo[prop] == 'undefined' ? true : false;
      if (item) {
        changeCounter++;
        deltaOb[prop] = { 'removed': true };
      }
    }
  }

  if (changeCounter > 0) {
    return deltaOb;  
  }else {
    return false;
  }
};

ModelFactory.prototype.getLayoutType = function(element) {
  if (element.hasClass('full-width-column')) {
    return 6;
  } else if(element.hasClass('center-column')) {
    return 5;
  }
};

ModelFactory.prototype.serializers = {};

ModelFactory.prototype.getSerializer = function (name) {
  if ( !this.serializers[name] ) {
    let model = null;
    if(name == 'section') {
      model = new Section({factory: this, common: Common});
    } else if(name == 'item') {
      model = new Item({factory: this, common: Common});
    }
    if(model != null) {
      this.serializers[name] = model;
    }
  }
  return this.serializers[name];
};

export default ModelFactory;
  