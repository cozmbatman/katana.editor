(function () {
  var u = Katana.utils;

  String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }

  Katana.ModelFactory = (function () {
    function ModelFactory(opts) {
      if (opts == null) {
        opts = {};
      }

      this.current_editor = opts.editor;
      this.elNode = this.current_editor.elNode;
      this.mode = opts.mode || 'read';
      this._build = u.__bind(this._build, this);
      this.stop = u.__bind(this.stop, this);
      this.getSerializer = u.__bind(this.getSerializer, this);

      this.successCallback = u.__bind(this.successCallback, this);
      this.errorCallback = u.__bind(this.errorCallback, this);
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
        this.elNode.addEventListener('Katana.Committer.doSave', () => {
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
      var items = this.elNode.querySelectorAll('[name]');
          
      for (var i = 0; i < items.length; i = i + 1) {
        var it = items[i];
        var name = it.attr('name');
        var duplicates = this.elNode.querySelectorAll('[name="' + name + '"]');
        if (duplicates && duplicates.length > 1) {
          for( var k = 1; k < duplicates.length; k = k +1) {
            var dup = duplicates[k];
            // make it nine digit in case we end up with some conflicts again
            dup.attr('name', Math.random().toString(36).slice(9)); 
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

      var sections = this.elNode.querySelectorAll('section'),
          i = 0,
          section,
          serializer = this.getSerializer('section'),
          delta = false;

      if (this.current_editor.currentRequestCount) {
        if (this.goingForUnload) {
          this.goingForUnload = false;
          return 'Your story has unsaved changes.';
        }
        return;
      }

      this.addTo = {};

      for(; i < sections.length; i = i + 1) {
        section = sections[i];
        serializer.build(section, i);
      }

/*      if (this.warmupOnly) {
        this.cache = this.addTo;
        this.warmupOnly = false;
        return;
      } */

      delta = this.findDelta();

      if (delta ) {
        //TODO generate sequence information here
        this.current_editor.notifySubscribers('Katana.Commit', {
          delta: delta,
        });
        
        if (this.goingForUnload) {
          this.goingForUnload = false;
          return 'Your story has unsaved changes.'
        }
      }
    };

    ModelFactory.prototype.findDelta = function () {
      var deltaOb = {},
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
          if (citem && !u.isEqual(item, citem)) {
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
      }else if(element.hasClass('center-column')) {
        return 5;
      }
    };

    ModelFactory.prototype.serializers = {};

    ModelFactory.prototype.getSerializer = function (name) {
      if ( !this.serializers[name] ) {
        var tt = name.capitalizeFirstLetter();
        var model = new window['Katana']['Model'][tt]({factory: this});
        this.serializers[name] = model;
      }
      return this.serializers[name];
    };

    return ModelFactory;
  })();
}).call(this);