(function() {
  var Katana = {
    Editor : {},
    version: '0.0.3'
  };

  window.Katana = Katana;

  if (typeof module === 'object') {
    module.exports = Katana;
  }

  if (typeof define === 'function' && define.amd) {
    define('Katana', [], () => {
      return Katana;
    });
  }
}).call(this);

(function() {
  let __bind, 
   __result, 
   __hasProp, 
   __extends,
  LINE_HEIGHT,
  is_caret_at_end_of_node, 
  is_caret_at_start_of_node;

  let something = 20;
  LINE_HEIGHT = 20;

  String.prototype.killWhiteSpace = function() {
    return this.replace(/\s/g, '');
  };

  String.prototype.reduceWhiteSpace = function() {
    return this.replace(/\s+/g, ' ');
  };

  String.prototype.toDashedProperty = function() {
    return this.replace(/([a-z](?=[A-Z]))/g, '$1 ').replace(/\s/g, '-').toLowerCase();
  };

  String.prototype.isEmpty = function() {
    return this.trim().length === 0;
  }

  // polyfill IE9+ jquery.closest alternative
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  if (!Element.prototype.parent) {
    Element.prototype.parent = function(s) { // jquery .parent
      let el = this;
      if(el.parentNode == null) {
        return null;
      }
      if(el.parentNode.parentNode == null) {
        return null;
      }
      return el.parentNode.parentNode;
    }
  }

  if(!Element.prototype.parentsUntil) {
    Element.prototype.parentsUntil = function(s) {
      let el = this, last = el;
      do {
        if(el.matches(s)) {
          return last;
        }
        last = el;
        el = el.parentElement || el.parentNode;
      } while(el !== null && el.nodeType === 1);
      return null;
    }
  }

  if (!Element.prototype.prev) {
    Element.prototype.prev = function(s) {
      let el = this;
      do {
        if (el.matches(s)) return el;
        el = el.previousElementSibling || el.previousSibling;
      } while(el !== null && el.nodeType === 1);
      return null;
    }
  }

  if (!Element.prototype.next) {
    Element.prototype.next = function(s) {
      let el = this;
      do {
        if (el.matches(s)) return el;
        el = el.nextElementSibling || el.nextSibling;
      } while(el !== null && el.nodeType === 1);
      return null;
    }
  };

  if (!Element.prototype.insertAfter) {
    Element.prototype.insertAfter = function(after) {
      let el = this;
      if(after == null) {
        return null;
      }
      if(after.parentNode == null) {
        return null;
      }
      after.parentNode.insertBefore(el, after.nextESibling);
    }
  }

  if(!Element.prototype.hasClass) {
    Element.prototype.hasClass = function(toTest) {
      let el = this;
      return el.classList.contains(toTest);
    }
  }
  if(!Element.prototype.toggleClass) {
    Element.prototype.toggleClass = function(toToggle) {
      let el = this;
      if(el.hasClass(toToggle)) {
        el.removeClass(toToggle);
      } else {
        el.addClass(toToggle);
      }
      return el;
    }
  }

  if(!Element.prototype.addClass) {
    Element.prototype.addClass = function(toAdd) {
      let el = this;
      toAdd = toAdd.trim();
      let all = toAdd.split(/\s/);
      if(all.length) {
        all.forEach(a => {
          el.classList.add(a)
        });
      }
      return this;
    }
  }

  if(!Element.prototype.removeClass) {
    Element.prototype.removeClass = function(toRemove) {
      let el = this;
      toRemove = toRemove.trim();
      let all = toRemove.split(/\s/);
      if(all.length) {
        all.forEach(a => {
          el.classList.remove(a);
        });
      }
      return this;
    }
  }

  if(!Element.prototype.attr) {
    Element.prototype.attr = function(key, value) {
      let el = this;
      if(typeof value === 'undefined') {
        return el.getAttribute(key);
      }
      el.setAttribute(key, value);
      return this;
    }
  }

  if(!Element.prototype.isElementInViewport) {
    Element.prototype.isElementInViewport = function() {
      var rect;
      let el = this;
      rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    };
  }


  if(!Element.prototype.isElementVerticallyInViewPort) {
    Element.prototype.isElementVerticallyInViewPort = function() {
      let el = this;
      var rect = el.getBoundingClientRect(),
          wn = window,
          dc = document,
          ch = (wn.innerHeight || dc.documentElement.clientHeight),
          cw = (wn.innerWidth || dc.documentElement.clientWidth),
          vertInView;

      vertInView = (rect.top <= ch) && ((rect.top + rect.height) >= 0);
      return vertInView;
    };
  }
  
  if (!Element.prototype.hide) {
    Element.prototype.hide = function() {
      this.classList.add('hide');
    }
  }

  if (!Element.prototype.show) {
    Element.prototype.show = function() {
      this.classList.remove('hide');
    }
  }

  if (!Array.prototype.contains) {
    Array.prototype.contains = function(el) {
      return this.indexOf(el) !== -1;
    }
  }
  
  if(!Node.prototype.remove) {
    Node.prototype.remove = function() {
      let el = this;
      if(el.parentNode === null) {
        return;
      }
      el.parentNode.removeChild(el);
    }
  }

  if(!Node.prototype.append) {
    Node.prototype.append = function(toAdd) {
      let el = this;
      if(toAdd === null) {
        return;
      }
      el.appendChild(toAdd);
    }
  }

  Node.prototype.unwrap = (el) => {
    // get the element's parent node
    var parent = el.parentNode;

    // move all children out of the element
    while (el.firstChild) parent.insertBefore(el.firstChild, el);

    // remove the empty element
    return parent.removeChild(el);
  };

  NodeList.prototype.wrap = function(wrapper) {
    if(this.length == 0) {
      return;
    }
    // creating a temporary element to contain the HTML string ('wrapper'):
    var temp = document.createElement('div'),
    // a reference to the parent of the first Node:
        parent = this.parentNode,
    // a reference to where the newly-created nodes should be inserted:
        insertWhere = this.previousSibling,
    // caching a variable:
        target;

    // setting the innerHTML of the temporary element to what was passed-in:
    temp.innerHTML = wrapper;

    // getting a reference to the outermost element in the HTML string passed-in:
    target = temp.firstChild;

    // a naive search for the deepest node of the passed-in string:        
    while (target.firstChild) {
        target = target.firstChild;
    }

    // iterating over each Node:
    [].forEach.call(this, (a) => {
        // appending each of those Nodes to the deepest node of the passed-in string:
        target.appendChild(a);
    });

    // inserting the created-nodes either before the previousSibling of the first
    // Node (if there is one), or before the firstChild of the parent:
    return parent.insertBefore(temp.firstChild, (insertWhere ? insertWhere.nextSibling : parent.firstChild));

  };

  function utils() {};

  window.Katana.utils = new utils();

  utils.prototype.onIOS = () => {
    var standalone = window.navigator.standalone,
      userAgent = window.navigator.userAgent.toLowerCase(),
      safari = /safari/.test( userAgent ),
      ios = /iphone|ipod|ipad/.test( userAgent );
      return ios;
  };

  utils.prototype.__result = __result = (object, prop, fallback) => {
    var value = object == null ? void 0 : object[prop];
    if (value === void 0) {
      value = fallback;
    }
    return value && Object.prototype.toString.call(value) == '[object Function]' ? value.call(object) : value;
  };

  utils.prototype.__bind = __bind = (fn, me) => { 
    return function() {
      return fn.apply(me, arguments); 
    }; 
  };

  utils.prototype.__hasProp = __hasProp = {}.hasOwnProperty,

  utils.prototype.__extends = __extends = (child, parent) => { 
    for (let key in parent) { 
      if (__hasProp.call(parent, key)) { 
        child[key] = parent[key]; 
      }
    } 
    const ctor = function() {
      this.constructor = child; 
    } 
    ctor.prototype = parent.prototype; 
    child.prototype = new ctor(); 
    child.__super__ = parent.prototype; 
};

  utils.prototype.log = (message, force) => {
    if (window.debugMode || force) {
      return console.log(message);
    }
  };

  utils.prototype.incrementCounter = (index) => {
    if (typeof index == "number") {
      index = index + 1;
      return index;
    }else if(typeof index == "string") {
      return String.fromCharCode(index.charCodeAt(0) + 1);  
    }
    return null;
  };

  utils.prototype.stopEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  utils.prototype.simpleStop = (event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  utils.prototype.getBase64Image = (img) => {
    var canvas, ctx, dataURL;
    canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    dataURL = canvas.toDataURL("image/png");
    return dataURL;
  };

  utils.prototype.generateId = () => {
    return Math.random().toString(36).slice(8);
  };

  utils.prototype.saveSelection = () => {
    var i, len, ranges, sel;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        ranges = [];
        i = 0;
        len = sel.rangeCount;
        while (i < len) {
          ranges.push(sel.getRangeAt(i));
          ++i;
        }
        return ranges;
      }
    } else {
      if (document.selection && document.selection.createRange) {
        return document.selection.createRange();
      }
    }
    return null;
  };

  utils.prototype.restoreSelection = (savedSel) => {
    var i, len, sel;
    if (savedSel) {
      if (window.getSelection) {
        sel = window.getSelection();
        sel.removeAllRanges();
        i = 0;
        len = savedSel.length;
        while (i < len) {
          sel.addRange(savedSel[i]);
          ++i;
        }
      } else {
        if (document.selection && savedSel.select) {
          savedSel.select();
        }
      }
    }
  };

  utils.prototype.getNode = () => {
    var container, range, sel;
    range = void 0;
    sel = void 0;
    container = void 0;
    if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      return range.parentElement();
    } else if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt) {
        if (sel.rangeCount > 0) {
          range = sel.getRangeAt(0);
        }
      } else {
        range = document.createRange();
        range.setStart(sel.anchorNode, sel.anchorOffset);
        range.setEnd(sel.focusNode, sel.focusOffset);
        if (range.collapsed !== sel.isCollapsed) {
          range.setStart(sel.focusNode, sel.focusOffset);
          range.setEnd(sel.anchorNode, sel.anchorOffset);
        }
      }
      if (range) {
        container = range.commonAncestorContainer;
        if (container.nodeType === 3) {
          return container.parentNode;
        } else {
          return container;
        }
      }
    }
  };

  utils.prototype.getSelectionDimensions = () => {
    var height, left, range, rect, sel, top, width;
    sel = document.selection;
    range = void 0;
    width = 0;
    height = 0;
    left = 0;
    top = 0;
    if (sel) {
      if (sel.type !== "Control") {
        range = sel.createRange();
        width = range.boundingWidth;
        height = range.boundingHeight;
      }
    } else if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount) {
        range = sel.getRangeAt(0).cloneRange();
        if (range.getBoundingClientRect) {
          rect = range.getBoundingClientRect();
          width = rect.right - rect.left;
          height = rect.bottom - rect.top;
        }
      }
    }
    return {
      width: width,
      height: height,
      top: rect.top,
      left: rect.left
    };
  };

  utils.prototype.getImageSelectionDimension = () => {
    let figure, blockGrid;

    blockGrid = document.querySelector('.grid-focused');

    if(blockGrid != null) {
      figure = blockGrid;
    } else {
      figure = document.querySelector('.figure-focused:not(.block-content-inner)');
    }
    
    if(figure == null) {
      return null;
    }
    return figure.getBoundingClientRect();
  };

  utils.prototype.getCaretPosition = (editableDiv) => {
    var caretPos, range, sel, tempEl, tempRange;
    caretPos = 0;
    containerEl = null;
    sel = void 0;
    range = void 0;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount) {
        range = sel.getRangeAt(0);
        if (range.commonAncestorContainer.parentNode === editableDiv) {
          caretPos = range.endOffset;
        }
      }
    } else if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      if (range.parentElement() === editableDiv) {
        tempEl = document.createElement("span");
        editableDiv.insertBefore(tempEl, editableDiv.firstChild);
        tempRange = range.duplicate();
        tempRange.moveToElementText(tempEl);
        tempRange.setEndPoint("EndToEnd", range);
        caretPos = tempRange.text.length;
      }
    }
    return caretPos;
  };

  utils.prototype.selection = () => {
    if (window.getSelection) {
      return selection = window.getSelection();
    } else if (document.selection && document.selection.type !== "Control") {
      return selection = document.selection;
    }
  };


  utils.prototype.animationFrame = ( () => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
          window.setTimeout(callback, 1000 / 60);
        }
  })();

  utils.prototype.elementsHaveSameClasses = (first, second) => {
    var arr1 = first.classList,
        arr2 = second.classList;
    if(arr1.length != arr2.length) {
      return false;
    }

    return arr1.filter(value => arr2.includes(value)).length === 0;
  };

  utils.prototype.urlIsFromDomain = (url, domain) => {
    var a = document.createElement('a');
    a.href = url;
    if (typeof a.hostname != 'undefined' && a.hostname.indexOf(domain) != -1) {
      return true;
    }
    return false;
  };  

  utils.prototype.urlIsForImage = (url) => {
    var a = document.createElement('a');
    a.href = url,
    path = a.pathname;
    if (path.indexOf('.jpeg') != -1) {
      return true;
    }
    if (path.indexOf('.jpg') != -1) {
      return true;
    }
    if (path.indexOf('.png') != -1) {
      return true;
    }
    if (path.indexOf('.gif') != -1) {
      return true;
    }
    return false;
  };

  utils.prototype.getWindowWidth = () => {
    return window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  };

  utils.prototype.getWindowHeight = () => {
    return window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  };

  utils.prototype.generateElement = (txt) => {
    const d = document.createElement('div');
    d.innerHTML = txt;
    return d.firstChild;
  };

  utils.prototype.arrayToNodelist = (arr) => {
    const fragment = document.createDocumentFragment();
    arr.forEach(function(item){
      fragment.appendChild(item.cloneNode());
    });
    return fragment.childNodes;
  };

  utils.prototype.insertAfter = (el, referenceNode) => {
    return referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  };

  utils.prototype.prependNode = (el, refNode) => {
    if(refNode != null && refNode.parentNode != null) {
      return refNode.parentNode.insertBefore(el, refNode.parentNode.firstElementChild);
    }
    return null;
  };

  utils.prototype.scrollToTop = (position) => {
    let pos = typeof position == 'undefined' ? 0 : position;
    let scrollDuration = 1000;
    var scrollStep = -window.scrollY / (scrollDuration / 15),
    scrollInterval = setInterval(() => {
      if ( window.scrollY != 0 ) {
        window.scrollBy( pos, scrollStep );
      }
      else clearInterval(scrollInterval); 
    }, 15);
  };

  utils.prototype.isEqual = (obj1, obj2) => {
    for (var p in obj1) {
      if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;
      switch (typeof (obj1[p])) {
        case 'object':
          if (!Object.compare(obj1[p], obj2[p])) return false;
          break;
        case 'function':
          if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
          break;
        default:
          if (obj1[p] != obj2[p]) return false;
      }
    }
   
    for (var p in obj2) {
      if (typeof (obj1[p]) == 'undefined') return false;
    }
    return true;
  };

  utils.prototype.getStyle = (el, prop) => {
    if(el && el.style && el.style[prop] != '') {
      return el.style[prop];
    }
    const cssProp = prop.toDashedProperty();
    return getComputedStyle(el).getPropertyValue(cssProp);
  }

  is_caret_at_start_of_node = (node, range) => {
    var pre_range;
    pre_range = document.createRange();
    pre_range.selectNodeContents(node);
    pre_range.setEnd(range.startContainer, range.startOffset);
    return pre_range.toString().trim().length === 0;
  };

  is_caret_at_end_of_node = (node, range) => {
    var post_range;
    post_range = document.createRange();
    post_range.selectNodeContents(node);
    post_range.setStart(range.endContainer, range.endOffset);
    return post_range.toString().trim().length === 0;
  };

  const editableIsCaret = () => {
    return window.getSelection().type === 'Caret';
  };

  const editableRange = () => {
    var sel;
    sel = window.getSelection();
    if (!(sel.rangeCount > 0)) {
      return;
    }
    return sel.getRangeAt(0);
  };

  const editableCaretRange = () => {
    if (!editableIsCaret()) {
      return;
    }
    return editableRange();
  };

  editableSetRange = (range) => {
    var sel;
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      sel.removeAllRanges();
    }
    return sel.addRange(range);
  };

  utils.prototype.editableFocus = function(el, at_start) {
    var range, sel;
    if (at_start == null) {
      at_start = true;
    }
    if (!el.hasAttribute('contenteditable')) {
      return;
    }
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      sel.removeAllRanges();
    }
    range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(at_start);
    return sel.addRange(range);
  };

  const editableCaretAtStart = (el) =>  {
    var range;
    range = editableRange();
    if (!range) {
      return false;
    }
    return is_caret_at_start_of_node(el, range);
  };

  const editableCaretAtEnd = (el) =>  {
    var range;
    range = editableRange();
    if (!range) {
      return false;
    }
    return is_caret_at_end_of_node(el, range);
  };

  utils.prototype.setCaretAtPosition = function(element, position) {
    if (element == null) {
      return;
    }
    var pos = typeof position == 'undefined' ? 0 : position,
        range = document.createRange(),
        sel = window.getSelection();

    if (element.childNodes && element.childNodes.length > 0) {
      range.setStart(element.childNodes[0], position);
    }else {
      range.setStart(element, position);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const editableCaretOnFirstLine = (el) => {
    var ctop, etop, range;
    range = editableRange();
    if (!range) {
      return false;
    }
    if (is_caret_at_start_of_node(el, range)) {
      return true;
    } else if (is_caret_at_end_of_node(el, range)) {
      ctop = el.getBoundingClientRect().bottom - LINE_HEIGHT;
    } else {
      ctop = range.getClientRects()[0].top;
    }
    etop = el.getBoundingClientRect().top;
    return ctop < etop + LINE_HEIGHT;
  };

  utils.prototype.editableCaretOnLastLine = (el) => {
    var cbtm, ebtm, range;
    range = editableRange();
    if (!range) {
      return false;
    }
    if (is_caret_at_end_of_node(el, range)) {
      return true;
    } else if (is_caret_at_start_of_node(el, range)) {
      cbtm = el.getBoundingClientRect().top + LINE_HEIGHT;
    } else {
      cbtm = range.getClientRects()[0].bottom;
    }
    ebtm = el.getBoundingClientRect().bottom;
    return cbtm > ebtm - LINE_HEIGHT;
  };

  utils.prototype.addEventForChild = (parent, eventName, childSelector, cb) => {      
    parent.addEventListener(eventName, (event) => {
      const clickedElement = event.target,
      matchingChild = clickedElement.closest(childSelector)
      if (matchingChild) cb(event, matchingChild)
    })
  };

  // $.fn.exists = function() {
  //   return this.length > 0;
  // };

  utils.prototype.scrollHandlers = {};
  utils.prototype.scrollAttached = false;

  utils.prototype.registerForScroll = function (key, cb) {
    this.scrollHandlers[key] = cb;  
    this.handleScroll();
  };

  utils.prototype.unregisterFromScroll = function (key) {
    if (this.scrollHandlers[key]) {
      delete this.scrollHandlers[key];
    }
  };

  const animationRequest = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
      }
    })();

  utils.prototype.handleScroll = function(items) {
    if (this.scrollAttached) {
      return;
    }
    this.scrollAttached = true;
    var $d = document,
        $w = window,
        wHeight = $w.height(),
        didScroll = false,
        $body = $d.querySelector('body'),
        _this = this;

    function hasScrolled() {
      var st = $w.scrollTop;
      var cbs = _this.scrollHandlers;
      for (var key in cbs) {
        if (cbs.hasOwnProperty(key)) {
          var fn = cbs[key];
          fn(st, $body, $d.documentElement.scrollHeight, wHeight);
        }
      }
      didScroll = false;
    }

    function checkScroll() {
      if (!didScroll) {
        didScroll = true;
        animationRequest(hasScrolled);
      }
    }
    window.addEventListener('scroll', checkScroll);
  };



}).call(this);

/** base **/
(function() {
  var u = Katana.utils;

  Katana.Base = (function() {
    function Base(opts) {
      if (opts == null) {
        opts = {};
      }
      if (opts.el) {
        this.el = opts.el;
      }
      this._ensureElement();
      this.initialize.apply(this, arguments);
      this._ensureEvents();
    }

    Base.prototype.initialize = function(opts) {
      if (opts == null) {
        opts = {};
      }
    };

    Base.prototype.events = function() {};

    Base.prototype.render = function() {
      return this;
    };

    Base.prototype.remove = function() {
      if(this.el) {
        this.el.parentNode.removeChild(this.el);
      }
      return this;
    };

    Base.prototype.setElement = function(el) {
      this.el = document.querySelector(el);
      this.$el = this.el;
      this.elNode = this.el;
      return this;
    };


    Base.prototype.setEvent = function(opts) {
      if(!opts) {
        return;
      }
      
      for (const [key, f] of Object.entries(opts)) {
        var element, func, key_arr;
        key_arr = key.split(" ");
        
        if(f && {}.toString.call(f) === '[object Function]') {
          func = f;
        } else if (Object.prototype.toString.call(f) === "[object String]") {
          func = this[f];
        } else {
          throw "error event needs a function or string";
        }

        element = key_arr.length > 1 ? key_arr.splice(1, 3).join(" ") : null;
        if (element != null) {
          u.addEventForChild(this.elNode, key_arr[0], element, u.__bind(func, this));
        }else {
          this.elNode.addEventListener(key_arr[0], u.__bind(func, this));
        }
      }

    };

    Base.prototype._ensureElement = function() {
      return this.setElement(u.__result(this, 'el'));
    };

    Base.prototype._ensureEvents = function() {
      return this.setEvent(u.__result(this, 'events'));
    };

    return Base;
  })();

}).call(this);

