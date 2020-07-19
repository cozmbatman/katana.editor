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
      while(el !== null && el.nodeType === 1) {
        el = el.previousElementSibling || el.previousSibling;
        if(el.matches(s)) return el;
      }
      return null;
    }
  }

  if (!Element.prototype.next) {
    Element.prototype.next = function(s) {
      let el = this;
      while(el !== null && el.nodeType === 1) {
        el = el.nextElementSibling || el.nextSibling;
        if (el.matches(s)) return el;
      }
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
      if(toAdd instanceof NodeList) {
        Array.prototype.forEach.call(toAdd, (nd) => {
          el.appendChild(nd);
        })
      } else {
        el.appendChild(toAdd);
      }
    }
  }

  if(!Node.prototype.prepend) {
    Node.prototype.prepend = function(el) {
      let refNode = this;
      if(refNode != null && refNode.parentNode != null) {
        return refNode.parentNode.insertBefore(el, refNode.parentNode.firstElementChild);
      }
      return null;
    }
  }

  if(!Node.prototype.unwrap) {
    Node.prototype.unwrap = (el) => {
      // get the element's parent node
      var parent = el.parentNode;
  
      // move all children out of the element
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
  
      // remove the empty element
      return parent.removeChild(el);
    };
  }

  if(!NodeList.prototype.wrap) {
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
  }

  if(!Node.prototype.wrap) {
    Node.prototype.wrap = function(wrapper) {
      var temp = document.createElement('div'),
          parent = this.parentNode,
          insertWhere = this.previousSibling,
          target;
  
      temp.innerHTML = wrapper;
      target = temp.firstChild;
  
      while (target.firstChild) {
          target = target.firstChild;
      }

      target.appendChild(this);

      return parent.insertBefore(temp.firstChild, (insertWhere ? insertWhere.nextSibling : parent.firstChild));
    }
  }
  

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
    var arr1 = [...first.classList],
        arr2 = [...second.classList];
        if(arr1.length != arr2.length) {
          return false;
        }
    arr1.sort();
    arr2.sort();
    for(let i = 0; i < arr1.length; i++) {
      if(arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
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
    if(d.children.length == 0) {
      return null;
    }
    if( d.children.length == 1 ) {
      return d.firstChild;
    } else {
      return d.children;
    }
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
        wHeight = this.getWindowHeight(),
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


/** editor **/
(function() { 
  var u = Katana.utils;

  Katana.Editor = (function(_super) {
    u.__extends(Editor, _super);

    var BACKSPACE = 8,
      ESCAPE = 27,
      TAB = 9,
      ENTER = 13,
      SPACEBAR = 32,
      LEFTARROW = 37,
      UPARROW = 38,
      RIGHTARROW = 39,
      DOWNARROW = 40,
      DELETE = 46,
      END_KEY = 35,

      SINGLE_QUOTE_WHICH = 39,
      DOUBLE_QUOTE_WHICH = 34,
      DASH_WHICH = 45,

      QUOTE_LEFT_UNICODE = '\u2018',
      QUOTE_RIGHT_UNICODE = '\u2019',

      DOUBLEQUOTE_LEFT_UNICODE = '\u201c',
      DOUBLEQUOTE_RIGHT_UNICODE = '\u201d',

      DASH_UNICODE = '\u2014',

      UNICODE_SPECIAL_CHARS = [QUOTE_LEFT_UNICODE, QUOTE_RIGHT_UNICODE, DOUBLEQUOTE_LEFT_UNICODE, DOUBLEQUOTE_RIGHT_UNICODE, DASH_UNICODE],

      // number 1, number 2, number 3, Char C(center), char q(quote),
      NUMBER_HONE = 49,
      NUMBER_HTWO = 50,
      NUMBER_HTHREE = 51,
      NUMBER_QUOTE = 52;
      NUMBER_CODE_BLOCK = 53,

      CHAR_CENTER = 69, // E with Ctrl
      CHAR_LINK = 75; // k for link

      SHORT_CUT_KEYS = [NUMBER_HONE, NUMBER_HTWO, NUMBER_HTHREE, NUMBER_QUOTE, NUMBER_CODE_BLOCK, CHAR_CENTER, CHAR_LINK];

    
    function Editor(opts) {  

      this.editor_options = opts;
      // entry points
      this.init = u.__bind(this.init, this); // activate
      this.destroy = u.__bind(this.destroy, this); // deactivate
      this.subscribe = u.__bind(this.subscribe, this); // for subscription to events
      this.notifySubscribers = u.__bind(this.notifySubscribers, this); // notify subscribers of events

      // ui related
      this.render = u.__bind(this.render, this);
      this.template = u.__bind(this.template, this);

      //base methods
      this.initialize = u.__bind(this.initialize, this);
      this.initContentOptions = u.__bind(this.initContentOptions, this);
      this.initTextToolbar = u.__bind(this.initTextToolbar, this);
      this.insertFancyChar = u.__bind(this.insertFancyChar, this);
      this.markAsSelected = u.__bind(this.markAsSelected, this);
      this.selectFigure = u.__bind(this.selectFigure, this);

      // canvas related
      this.parallaxCandidateChanged = u.__bind(this.parallaxCandidateChanged, this);

      //event listeners
      this.handlePaste = u.__bind(this.handlePaste, this);
      this.handleDrag = u.__bind(this.handleDrag, this);
      this.handleDrop = u.__bind(this.handleDrop, this);
      this.handleDragEnter = u.__bind(this.handleDragEnter, this);
      this.handleDragExit = u.__bind(this.handleDragExit, this);

      this.handleSelectionChange = u.__bind(this.handleSelectionChange, this);
      this.handleMouseUp = u.__bind(this.handleMouseUp, this);
      this.handleMouseDown = u.__bind(this.handleMouseDown, this);
      this.handleKeyUp = u.__bind(this.handleKeyUp, this);
      this.handleKeyDown = u.__bind(this.handleKeyDown, this);
      this.handleKeyPress = u.__bind(this.handleKeyPress, this);
      this.handleDblclick = u.__bind(this.handleDblclick, this);
      this.handlePress = u.__bind(this.handlePress, this);
      this.handleTap = u.__bind(this.handleTap, this);

      // this.handleCopyEvent = u.__bind(this.handleCopyEvent, this);

      //image event listeners
      this.handleGrafFigureSelectImg = u.__bind(this.handleGrafFigureSelectImg, this);
      this.handleGrafFigureTypeCaption = u.__bind(this.handleGrafFigureTypeCaption, this);
      this.handleImageActionClick = u.__bind(this.handleImageActionClick, this);

      // section toolbar event listeners
      this.handleSectionToolbarItemClicked = u.__bind(this.handleSectionToolbarItemClicked, this);
      this.handleSectionToolbarItemMouseUp = u.__bind(this.handleSectionToolbarItemMouseUp, this);
      this.handleSectionToolbarItemMouseDown = u.__bind(this.handleSectionToolbarItemMouseDown, this);
      this.handleSectionToolbarItemKeyUp = u.__bind(this.handleSectionToolbarItemKeyUp, this);
      this.handleSectionToolbarItemKeyDown = u.__bind(this.handleSectionToolbarItemKeyDown, this);
      this.handleSectionToolbarItemKeyPress = u.__bind(this.handleSectionToolbarItemKeyPress, this);
      this.handleSectionToolbarItemDblclick = u.__bind(this.handleSectionToolbarItemDblclick, this);

      this.handleSelectionStoryTypeChange = u.__bind(this.handleSelectionStoryTypeChange, this);
      this.handleSelectionStoryCountChange = u.__bind(this.handleSelectionStoryCountChange, this);

      // notes
      this.showNoteIcon = u.__bind(this.showNoteIcon, this);
      this.smallScreen = u.getWindowWidth() <= 480 ? true : false;

      this.segregateEvents();

      this.isTouch = 'ontouchstart' in window || 'msmaxtouchpoints' in window.navigator;
      this.isIOS = u.onIOS();
      return Editor.__super__.constructor.apply(this, arguments);
    };

    Editor.prototype.segregateEvents = function () {
      var mode = this.editor_options.mode || 'read';
      var publication = this.editor_options.editorType == 'publication' ? true : false;
      
      if (mode == 'read' || mode == 'edit') {
        this.events = {
          'mouseup': 'handleMouseUp',
          'mousedown' : 'handleMouseDown',
          'dblclick': 'handleDblclick',
          "mouseover .markup-anchor": "displayPopOver",
          "mouseout  .markup-anchor": "hidePopOver",
          "click .item-controls i": "embedIFrameForPlayback",
          "keydown .item-controls i": "playButtonPressedViaKeyboard"
        };

        if (this.smallScreen) {
          this.events["click .item"] = "showNoteIcon";
        } else {
          if (!publication) {
            this.events["mouseover .item"] = "showNoteIcon";  
          }
        }

      } else if (mode == 'write'){
        this.events = {
          "paste": "handlePaste",
          'mouseup': 'handleMouseUp',
          'mousedown' : 'handleMouseDown',
          'keydown': 'handleKeyDown',
          'keyup': 'handleKeyUp',
          'keypress': 'handleKeyPress',
          'dblclick': 'handleDblclick',
          
          // 'copy':'handleCopyEvent',
          
          "click .item-figure .padding-cont": "handleGrafFigureSelectImg",
          "click .with-background .table-view": "handleGrafFigureSelectImg",
          "keyup .item-figure .caption": "handleGrafFigureTypeCaption",

          "click .markup-figure-anchor": "handleFigureAnchorClick",
          "click .item-controls-cont .action": "handleImageActionClick",

          'dragover': 'handleDrag',
          'drop' : 'handleDrop',
          'dragenter': 'handleDragEnter',
          'dragexit': 'handleDragExit',

          "mouseover .markup-anchor": "displayPopOver",
          "mouseout  .markup-anchor": "hidePopOver",

          "press .item":"handlePress",
          "tap .item": "handleTap"
        };

        if (publication) {
          var o = {
            'click .main-controls [data-action]' : 'handleSectionToolbarItemClicked',
            'dblclick .main-controls' : 'handleSectionToolbarItemDblclick',
            'mouseup .main-controls' : 'handleSectionToolbarItemMouseUp',
            'mousedown .main-controls' : 'handleSectionToolbarItemMouseDown',
            'keyup .main-controls' : 'handleSectionToolbarItemKeyUp',
            'keydown .main-controls' : 'handleSectionToolbarItemKeyDown',
            'keypress .main-controls' : 'handleSectionToolbarItemKeyPress',
            'change [data-for="storytype"]' : 'handleSelectionStoryTypeChange',
            'change [data-for="storycount"]' : 'handleSelectionStoryCountChange'  
          };

          for(const [key, val] of Object.entries(o)) {
            this.events[key] = val;
          }

        }
      } else {
        this.events = {};
      }
    };

    Editor.prototype.__selectionChangeFired = false;

    Editor.prototype.handleSelectionChange = function(ev) {
      var sel = document.getSelection();
      if (sel.type == 'Range') {
        ev.preventDefault();
        if (!this.__selectionChangeFired) {
          setTimeout(() => {
            this.handleMouseUp(ev);
            this.__selectionChangeFired = false;
          }, 200);
          this.__selectionChangeFired = true;
        }
      }
    };

    Editor.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.editorOpts = opts;
      this.el = opts.el || "#editor";

      // debug mode
      window.debugMode = opts.debug || false;
      if (window.debugMode) {
        this.elNode.addClass("debug");
      }

      this.mode = opts.mode || 'read'; // can be write/ edit/ read
      this.editorType = opts.editorType || 'blog';
      this.publicationMode = this.editorType == 'publication' ? true : false;

      this.base_content_options = opts.base_content_options || ['image', 'video', 'section'];
      this.content_options = [];

      this.current_node = null;
      this.prev_current_node = null;
      this.current_range = null;

      this.image_options = opts.image ? opts.image : { upload: true };
      this.embed_options = opts.embed ? opts.embed : { enabled: false };
      this.json_quack = opts.json_quack;

      let embedPlcStr = opts.placeholders && opts.placeholders.embed ? opts.placeholders.embed : 'Paste a YouTube video link, and press Enter';
      let titlePlcStr = opts.placeholders && opts.placeholders.title ? opts.placeholders.title : 'Title here';
      let subTitlePlcStr = opts.placeholders && opts.placeholders.subtitle ? opts.placeholders.subtitle : 'Start with introduction ..';
      
      this.embed_placeholder = `<span class='placeholder-text placeholder-text--root'>${embedPlcStr}</span><br>`;
      //this.oembed_url = `http://iframe.ly/api/iframely?api_key=4afb3d8a83ee3fdb9ecf73&url=`;
      this.title_placeholder = `<span class="placeholder-text placeholder-text--root" data-placeholder-text="${titlePlcStr}">${titlePlcStr}</span><br>`;
      this.subtitle_placeholder = `<span class="placeholder-text placeholder-text--root" data-placeholder-text="${subTitlePlcStr}">${subTitlePlcStr}</span><br>`;

      this.sectionsForParallax = [];
      this.parallax = null;
      this.parallaxContext = null;

      this.currentRequestCount = 0;
      this.commentable = opts.commentable || false;

      this.notes_options = opts.notes || {};

      this.paste_element_id = '#mf_paste_div';

      this.streamHandlers = {};

      return this;
    };

    Editor.prototype.init = function(cb) {
      this.render(cb);
      if (this.mode == 'write') {
        this.elNode.attr('contenteditable', true);
        this.elNode.addClass('editable');
        
      } else {
        this.elNode.removeAttribute("contenteditable");
        const ces = this.elNode.querySelectorAll('[contenteditable]');
        ces.forEach((cel) => {
          cel.removeAttribute('contenteditable');
        });
        const mfps = this.elNode.querySelectorAll('.mfi-play');
        mfps.forEach( (mf) => {
          mf.attr('tabindex', '0');
        });
      }
      
      this.appendToolbars();
      this.appendParallax();

      if (this.mode == 'write') {
        const enabled = this.editorOpts && this.editorOpts.enableDraft ? this.editorOpts.enableDraft : true;
        if(enabled) {
          this.committer = new Katana.ModelFactory({editor: this, mode: 'write'});
          this.committer.manage(true);
        }
      }

      if (this.notes_options.commentable) {
        const winWidth = u.getWindowWidth();
        var layout = winWidth <= 480 ? 'popup' : 'side';
        this.notesManager = new Katana.Notes({editor: this, notes: [], info : this.notes_options, layout: layout});
        this.notesManager.init();
      }

      if (this.mode == 'write') {
        this.removeUnwantedSpans();
        setTimeout( () => {
          this.addFigureControls();
        }, 200);
      }

      if (this.mode == 'read') {
        Katana.Player.manage(this.editor_options.video);
      }

      if (this.mode == 'write') {
        setTimeout( () => {
          //this.mutationHandler = new MutationOb
        }, 300);
      }

      setTimeout( () => {
        this.addBlanktoTargets();
      }, 200);

      this.addEmptyClass();

      if ( this.isIOS ) {
        document.addEventListener('selectionchange', this.handleSelectionChange);
      }
    };

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

    Editor.prototype.subscribe = function(name, cb) {
      if(typeof this.streamHandlers[name] === 'undefined') {
        this.streamHandlers[name] = new Set();
      }
      const sub = new _SubWrap(name, cb, this.streamHandlers[name]);
      this.streamHandlers[name].add(sub);
      return sub;
    };

    Editor.prototype.notifySubscribers = function(name, ev) {
      if(typeof this.streamHandlers[name] === 'undefined') {
        return;
      }
      const entries = this.streamHandlers[name].entries();
      for(const [k, v] of entries) {
        v.execute(ev);
      }
    }

    Editor.prototype.addBlanktoTargets = function() {
      var anchors = this.elNode.querySelectorAll('a');
      anchors.forEach( (item) => {
        if(!item.hasAttribute('target')) {
          item.attr('target', '_blank');
        }
      });
    };

    Editor.prototype.addEmptyClass = function() {
    };

    Editor.prototype.setInitialFocus = function () {
      var items = this.elNode.querySelectorAll('.item');
      if (items.length >= 2) {
        var first = items[0],
            sec = items[1],
            toFocus = false,
            toolTip = false;
        if ( first.querySelectorAll('.placeholder-text').length && sec.querySelectorAll('.placeholder-text').length ) {
          toFocus = items[1];
          toolTip = true;
        } else {
          toFocus = items[0];
        }

        if (toFocus) {
          var _this = this;
          _this.markAsSelected(toFocus);
          _this.setRangeAt(toFocus);
          if (toolTip) {
            _this.displayTooltipAt(toFocus);
          }
        }
      }
    };

    Editor.prototype.appendParallax = function () {
      var art = this.elNode.closest('body');
      if (art != null) {
        if (document.querySelector('.parallax') != null) {
          return;
        }
        var cv = u.generateElement(`<canvas class="parallax"></canvas>`),
            handled = false,
            resizeHandler;

        cv.attr('width', u.getWindowWidth());
        cv.attr('height', u.getWindowHeight());

        art.insertBefore(cv, art.firstElementChild);
        let _this = this;
        resizeHandler = function() {
          if (!handled){
            setTimeout(function() {
              _this.resized();
              handled = false;
            }, 60);
            handled = true;
          }
        };

        window.addEventListener('resize', resizeHandler);
        this.parallax = cv;
        this.parallaxContext = cv.getContext('2d');

        this.parallaxCandidateChanged();
      }
    };

    Editor.prototype.resized = function () {
      if (this.parallax) {
        const wnW = u.getWindowWidth(), wnH = u.getWindowHeight();
        this.parallax.attr('width', wnW);
        this.parallax.attr('height', wnH);
        this.checkViewPortForCanvas();
      }
    };

    Editor.prototype.appendToolbars = function () {
      this.initTextToolbar();
      if (this.base_content_options.length > 0 && this.mode == 'write') {
        this.initContentOptions();
      };

      this.tooltip = new Katana.Tooltip({editor: this});
      this.tooltip.render().hide();
    };

    Editor.prototype.initTextToolbar = function () {
      if ( document.querySelector('#mfToolbarBase') == null ) {
        const tbHt = `<div id='mfToolbarBase' class='mf-menu mf-toolbar-base mf-toolbar hide' ></div>`;
        const tbEl = u.generateElement(tbHt);
        tbEl.insertAfter(this.elNode.parentNode);
      }
      
      if (this.text_toolbar == null) {
        this.text_toolbar = new Katana.Toolbar.TextToolbar({
          editor: this,
          mode: this.mode
        });
      }

      this.toolbar = this.text_toolbar;
      return this.text_toolbar;
    };

    Editor.prototype.initContentOptions = function () {
      var base_options;
      base_options = this.base_content_options;

      if (base_options.indexOf("image") >= 0) {         
        if (document.querySelector('#mfImageToolbarBase') == null) {
          const igTb = `<div id='mfImageToolbarBase' class='mf-menu mf-toolbar-base mf-toolbar hide'></div>`;
          const igEl = u.generateElement(igTb);
          igEl.insertAfter(this.elNode.parentNode);
        }
        
        this.image_toolbar = new Katana.Toolbar.ImageToolbar({
          editor: this,
          mode: this.mode
        });

        this.image_toolbar.render().hide();
        var opt = new Katana.Content.Images({editor: this, toolbar: this.image_toolbar});
        this.image_toolbar.setController(opt);
        this.content_options.push(opt);
        this.image_uploader = opt;
      }

      if (base_options.indexOf("video") >= 0) { 
       var opt = new Katana.Content.Video({editor: this});
       this.content_options.push(opt); 
       this.video_uploader = opt;
      }

      if (base_options.indexOf("section") >= 0) { 
        var opt = new Katana.Content.Section({editor: this,
          mode: this.mode, editorType: this.editorType});
        this.content_options.push(opt);
        this.section_options = opt;
      }
      
      if (base_options.indexOf("embed") >= 0) { 
        var opt = new Katana.Content.Embed({editor: this,
          mode: this.mode});
        this.embed_options = opt;
        this.content_options.push(opt);
      }

      if (document.querySelector('#mfContentBase') == null) {
        const coEl = u.generateElement(`<div class='inlineContentOptions inlineTooltip' id='mfContentBase'></div>`);
        coEl.insertAfter(this.elNode);
      }
      
      this.content_bar = new Katana.ContentBar({editor:this, widgets: this.content_options});
      this.content_bar.render();

    };

    Editor.prototype.render = function (cb) {
      if (this.elNode.innerHTML.trim() == '') {
        this.elNode.appendChild( u.generateElement(this.template()) );
        if (this.publicationMode) {
          var bd = this.elNode.querySelector('.block-stories .main-body');
          $(this.elNode.querySelector('.autocomplete')).autocomplete();

          this.fillStoryPreview(bd, 6);
          var lsect = this.elNode.querySelector('section:last-child .main-body');
          if(lsect != null) {
            lsect.appendChild(u.generateElement(`<div class="block-content-inner center-column"><p class="item item-p" name="${u.generateId()}"><br /></p></div>`));
          }
        }
        return setTimeout(() => { 
          this.setInitialFocus(); 
          if (cb) {
            cb();
          }
        }, 100);
      } else {
        return this.parseInitialContent(cb);
      }
    };

    Editor.prototype.parseInitialContent = function (cb) {
      if (this.mode == 'read') {
        cb();
        return this;
      }
      let _this = this;

      this.setupElementsClasses(this.elNode.querySelectorAll('.block-content-inner'), function() {
        if (_this.mode == 'write') {
          const figures = _this.elNode.querySelectorAll('.item-figure');
          figures.forEach((item) => {
            if (item.hasClass('figure-in-row')) {
              var cont = item.closest('.block-grid');
              var caption = cont.querySelector('.block-grid-caption');
              if (caption == null) {
                var t = u.generateElement(_this.figureCaptionTemplate(true));
                t.removeClass('figure-caption');
                t.addClass('block-grid-caption');
                cont.appendChild(t);
                caption = cont.querySelector('.block-grid-caption');
              }
              caption.attr('contenteditable', true);
            } else {
              var caption = item.querySelector('figcaption');
              if (caption == null) {
                item.appendChild(u.generateElement(_this.figureCaptionTemplate()));
                caption = item.querySelector('figcaption');
                item.addClass('item-text-default');
              }
              caption.attr('contenteditable', true);

              if ( caption.textContent.killWhiteSpace().length == 0 ) {
                var txt = 'Type caption for image(Optional)';
                const sp = document.createElement('span');
                sp.addClass('placeholder-text');
                sp.attr('data-placeholder-value', txt);
                sp.innerHTML = txt;
                caption.appendChild(sp);
                item.addClass('item-text-default');
              }
            } 
          });

          const bgSections = _this.elNode.querySelectorAll('.with-background');
          bgSections.forEach( (item) => {
            const cellVs = item.querySelectorAll('.table-cell-view');
            cellVs.forEach(cev => {
              cev.attr('contenteditable', 'false');
            });
            const mainB = item.querySelectorAll('.main-body');
            mainB.forEach(mb => {
              mb.attr('contenteditable', 'true');
            });

          });
        }

        _this.addPlaceholdersForBackgrounds();
        _this.setupFirstAndLast();
        _this.setUpStoriesToolbar();
        _this.setInitialFocus();  
        cb();
      });
    };

    Editor.prototype.setUpStoriesToolbar = function () {
      if (!this.publicationMode) {
        return;
      }
      var sects = this.elNode.querySelectorAll('section');
      if (sects.length) {
        for (var i = 0; i < sects.length; i = i + 1) {
          var section = sects[i];
          var body = section.querySelector('.main-body');
          var toolbar;
          if (!section.hasClass('block-add-width') && !section.hasClass('block-full-width')) {
            section.addClass('block-center-width');
          }
          if (section.hasClass('block-stories')) {
            toolbar = u.generateElement(this.getStoriesSectionMenu(true));
            var name = section.attr('name');
            var obName = window['ST_' + name];
            
            var count = 6, stType = 'featured', tagValue = '';

            if (obName) {
              count = obName.storyCount;
              stType = obName.storyType;
              if (typeof obName.storyTag != 'undefined') {
                tagValue = obName.storyTag;
              }
            } 

            this.fillStoryPreview(body, count);

            const tStCount = toolbar.querySelector('[data-for="storycount"]');
            if(tStCount != null) {
              tStCount.value = count;
            }
            const tStType = toolbar.querySelector('[data-for="storytype"]');
            if(tStType != null) {
              tStType.value = stType;
            }

            var auto = toolbar.querySelector('.autocomplete');
            auto.autocomplete({threshold:2, behave: 'buttons', type: 'tag'});

            var tagInpt = toolbar.querySelector('[data-for="tagname"]');
            if (stType == 'tagged') {
              tagInpt.closest('.autocomplete-buttons').removeClass('hide');
              auto.autocomplete({action:'set', data: JSON.parse(tagValue)});
            } else {
              tagInpt.closest('.autocomplete-buttons').addClass('hide');
            }
            toolbar.insertBefore(body);
          } else {
            toolbar = u.generateElement(this.getStoriesSectionMenu(false));
            toolbar.insertBefore(body);
          }
        }
      }
    };

    Editor.prototype.addFigureControls = function () {
      var imageFigures = document.querySelectorAll('.item-figure:not(.item-iframe)');
      imageFigures.forEach( item => {
        var temp = u.generateElement(this.getImageFigureControlTemplate());
        var img = item.querySelector('img');
        if(img != null) {
          img.insertAfter(temp);
        }
      });

    };

    Editor.prototype.addPlaceholdersForBackgrounds = function () {
      var backgrounds = this.elNode.querySelectorAll('.with-background');
      if (backgrounds.length) {

      }
    };

    Editor.prototype.backgroundSectionPlaceholder = function () {
      var ht = '<h';
    };

    Editor.prototype.getPlaceholders = function () {
      var ht = `<h3 class="item item-h3 item-first" name="${u.generateId()}">${this.title_placeholder}</h3>
      <p class="item item-p item-last" name="${u.generateId()}">${this.subtitle_placeholder}</p>`;
      return ht;
    };

    Editor.prototype.getSingleLayoutTempalte = function () {
      return `<div class="block-content-inner center-column"></div>`;
    };

    Editor.prototype.getSingleSectionTemplate = function () {
      var ht = `<section class="block-content" name="${u.generateId()}">
        <div class="main-divider" contenteditable="false"><hr class="divider-line" tabindex="-1"></div>
        <div class="main-body">
        </div>
        </section>`;
      return ht;
    };

    Editor.prototype.getSingleStorySectionTemplate = function () {
      var existingSects = this.elNode.querySelectorAll('.block-stories'),
      excludes = [];

      if (existingSects.length) {
        for (var i = 0;i < existingSects.length; i = i + 1) {
          var sec = existingSects[i];
          var select = sec.querySelector('[data-for="storytype"]');
          if(select != null) {
            var val = select.value;
            if (val != 'tagged') {
              excludes.push(val);
            }
          }
        }
      }

      var ht = `<section class="block-stories block-add-width as-image-list" name="${u.generateId()}" data-story-count="6">
          <div class="main-divider" contenteditable="false"><hr class="divider-line" tabindex="-1"></div>
          ${this.getStoriesSectionMenu(true, excludes)}
          <div class="main-body">
          </div>
          </section>`;
      return ht;
    };

    Editor.prototype.getStoryPreviewTemplate = function () {
      var ht = `<div class="st-pre" >
          <div class="st-img"></div>
          <div class="st-title"></div>
          <div class="st-sub"></div>
          <div class="st-sub2"></div>
          </div>`;
      return ht;
    };

    Editor.prototype.fillStoryPreview = function (container, count) {
      count = typeof count == 'undefined' || isNaN(count) ? 6 : count;
      var ht = `<div class="center-column" contenteditable="false">`;
      for (var i = 0; i < count; i = i + 1) {
        ht += this.getStoryPreviewTemplate();
      }
      ht += `</div>`;
      container.innerHTML = ht;
    };

    Editor.prototype.menuOpts = [['featured','Featured'],['latest','Latest'],['tagged','Tagged as']];

    Editor.prototype.getStoriesSectionMenu = function (forStories, exclude) {
      var fs = typeof forStories == 'undefined' ? true : forStories,
        ht = `<div class="main-controls '${fs ? `story-mode` : `plain-mode`}" contenteditable="false">
            <div class="main-controls-inner center-column">
            <select data-for="storytype">`;

      var opts = '';
      var excludeOpts = typeof exclude != 'undefined' ? exclude : [];

      for (var i = 0; i < this.menuOpts.length; i = i + 1) {
        var menu = this.menuOpts[i];
        if (excludeOpts.indexOf(menu[0]) == -1) {
          opts += `<option value="${menu[0]}">${menu[1]}</option>`;
        }
      }

      ht += opts;

      ht += `</select>';
        <input type="text" class="text-small autocomplete" data-behave="buttons" data-type="tag" data-for="tagname" placeholder="Tag name here"></input>
        <input type="number" class="text-small" data-for="storycount" value="6" min="4" max="10"></input>
        <div class="right">
        <div class="main-controls-structure">
        <i class="mfi-text-left" data-action="list-view"></i>
        <i class="mfi-photo" data-action="image-grid"></i>
        </div>
        <div class="main-controls-layout">`;

      if (!fs) {
        ht += `<i class="mfi-image-default" data-action="center-width"></i>`;
      }

      ht += `<i class="mfi-image-add-width" data-action="add-width"></i>
        <i class="mfi-image-full-width" data-action="full-width"></i>
        <i class="mfi-cross left-spaced" data-action="remove-block"></i>
        </div>
        </div>
        </div>
        </div>`
      return ht;
    };

    Editor.prototype.getImageFigureControlTemplate = function () {
      const ht =
      `<div class='item-controls-cont'>
      <div class='item-controls-inner'>
      <i class='mfi-arrow-up action' data-action='goup' title='Move image up'></i>
      <i class='mfi-arrow-left action' data-action='goleft' title='Move image to left'></i>
      <i class='mfi-arrow-right action' data-action='goright' title='Move image to right'></i>
      <i class='mfi-cross action' data-action='remove' title='Remove image'></i>
      <i class='mfi-carriage-return action' data-action='godown' title='Move image to next line'></i>
      <i class='mfi-plus action' data-action='addpic' title='Add photo here'></i>
      <div class='extend-button action' data-action='stretch' title='Stretch to full width'><i class='mfi-extend-in-row'></i></div>
      </div>
      </div>`;
      return ht;
    };

    Editor.prototype.getFigureTemplate = function () {
      var ht = 
      `<figure contenteditable='false' class='item item-figure item-text-default' name='${u.generateId()}' tabindex='0'>
      <div style='' class='padding-cont'> 
      <div style='padding-bottom: 100%;' class='padding-box'></div> 
      <img src='' data-height='' data-width='' data-image-id='' class='item-image' data-delayed-src='' /> 
      ${this.getImageFigureControlTemplate()}
      </div> 
      <figcaption contenteditable='true' data-placeholder-value='Type caption for image (optional)' class='figure-caption caption'>
      <span class='placeholder-text'>Type caption for image (optional)</span> <br> 
      </figcaption> 
      </figure>`;
      return ht;
    };

    Editor.prototype.figureCaptionTemplate = function (multiple) {
      var plc = typeof multiple != 'undefined' ? `Type caption for images(optional)` : `Type caption for image(optional)`;
      var ht = `<figcaption contenteditable='true' data-placeholder-value='${plc}' class='figure-caption caption'>
        <span class="placeholder-text">${plc}<span> <br />
        </figcaption>`;
      return ht;
    };

    Editor.prototype.getFrameTemplate = function () {
      var ht = 
      `<figure contenteditable='false' class='item item-figure item-iframe item-first item-text-default' name='${u.generateId()}' tabindex='0'>
      <div class='iframeContainer'>
      <div style='' class='padding-cont'> 
      <div style='padding-bottom: 100%;' class='padding-box'>
      </div>
      <img src='' data-height='' data-width='' data-image-id='' class='item-image' data-delayed-src=''> 
      </div> 
      <div class='item-controls ignore'>
      <i class='mfi-icon mfi-play'></i>
      </div>
      </div> 
      <figcaption contenteditable='true' data-placeholder-value='Type caption for video (optional)' class='figure-caption caption'>
      <span class='placeholder-text'>Type caption for video (optional)</span>"
      </figcaption> 
      </figure>`;
      return ht;
    };

    Editor.prototype.template = function() {
      if (this.publicationMode) {
        var ht = `<section class='block-content block-first block-last block-center-width' name='${u.generateId()}'>
              <div class='main-divider' contenteditable='false'>
                <hr class='divider-line' tabindex='-1'/>
              </div> 
            ${this.getStoriesSectionMenu()}
            <div class='main-body'>  
            <div class='block-content-inner center-column'>${this.getPlaceholders()}</div> </div> </section>
            ${this.getSingleStorySectionTemplate()}
            ${this.getSingleSectionTemplate()}`;
        return ht;
      }

      var ht = `<section class='block-content block-first block-last' name='${u.generateId()}'>
        <div class='main-divider' contenteditable='false'>
          <hr class='divider-line' tabindex='-1'/>
        </div>
        <div class='main-body'>
          <div class='block-content-inner center-column'>${this.getPlaceholders()}</div>
        </div>
        </section>`;
      
      return ht;
    };

    Editor.prototype.templateBackgroundSectionForImage = function () {
      var ht = `<section name="${u.generateId()}" class="block-content block-image image-in-background with-background">
      <div class="block-background" data-scroll="aspect-ratio-viewport" contenteditable="false" data-image-id="" data-width="" data-height="">
      <div class="block-background-image" style="display:none;"></div>
      </div>
      <div class="table-view">
      <div class="table-cell-view" contenteditable="false">
      <div class="main-body" contenteditable="true">
      <div class="block-content-inner center-column">
      <h2 name="${u.generateId()}" class="item item-h2 item-text-default item-first item-selected" data-placeholder-value="Continue writing">
      <span class="placeholder-text">Continue writing</span><br>
      </h2>
      </div></div>
      </div></div>
      <div class="block-caption">
      <label name="${u.generateId()}" data-placeholder-value="Type caption " class="section-caption item-text-default item-last">
      <span class="placeholder-text">Type caption </span><br>
      </label>
      </div>
      </section>`;
      return ht;
    };

    Editor.prototype.templateBackgroundSectionForVideo = function () {
      var ht = `<section name="${u.generateId()}" class="block-content video-in-background block-image image-in-background with-background">
      <div class="block-background" data-scroll="aspect-ratio-viewport" contenteditable="false" data-image-id="" data-width="" data-height="">
      <div class="block-background-image" style="display:none;"></div>
      </div>
      <div class="table-view">
      <div class="table-cell-view" contenteditable="false">
      <div class="main-body" contenteditable="true">
      <div class="block-content-inner center-column">
      <h2 name="${u.generateId()}" class="item item-h2 item-text-default item-first item-selected" data-placeholder-value="Continue writing" data-scroll="native">
      <span class="placeholder-text">Continue writing</span><br>
      </h2>
      </div></div>
      </div></div>
      <div class="block-caption">
      <label name="${u.generateId()}" data-placeholder-value="Type caption " class="section-caption item-text-default item-last">
      <span class="placeholder-text">Type caption </span><br>
      </label>
      </div>
      </section>`;
      return ht;
    };

    Editor.prototype.baseParagraphTmpl = function() {
      return `<p class='item item-p' name='${u.generateId()}'><br></p>`;
    };

    Editor.prototype.hideImageToolbar = function() {
      if (this.image_toolbar) {
        this.image_toolbar.hide();
      }
    };

    Editor.prototype.hideContentBar = function() {
      if (this.content_bar) {
        this.content_bar.hide();
      }
    };

    // DOM related methods //
    Editor.prototype.getSelectedText = function() {
      var text;
      text = "";
      if (typeof window.getSelection !== "undefined") {
        text = window.getSelection().toString();
      } else if (typeof document.selection !== "undefined" && document.selection.type === "Text") {
        text = document.selection.createRange().text;
      }
      return text;
    };

    Editor.prototype.selection = function() {
      if (window.getSelection) {
        return selection = window.getSelection();
      } else if (document.selection && document.selection.type !== "Control") {
        return selection = document.selection;
      }
    };

    Editor.prototype.getRange = function() {
      var editor, range;
      editor = this.elNode;
      range = selection && selection.rangeCount && selection.getRangeAt(0);
      if (!range) {
        range = document.createRange();
      }
      if (!editor.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(editor);
        range.collapse(false);
      }
      return range;
    };

    Editor.prototype.setRange = function(range) {
      range = range || this.current_range;
      if (!range) {
        range = this.getRange();
        range.collapse(false);
      }
      this.selection().removeAllRanges();
      this.selection().addRange(range);
      return this;
    };

    Editor.prototype.getCharacterPrecedingCaret = function() {
      var precedingChar, precedingRange, range, sel;
      precedingChar = "";
      sel = void 0;
      range = void 0;
      precedingRange = void 0;
      var node = this.getNode();
      if (node) {
        if (window.getSelection) {
          sel = window.getSelection();
          if (sel.rangeCount > 0) {
            range = sel.getRangeAt(0).cloneRange();
            range.collapse(true);
            range.setStart(node, 0);
            precedingChar = range.toString().slice(0);
          }
        } else if ((sel = document.selection) && sel.type !== "Control") {
          range = sel.createRange();
          precedingRange = range.duplicate();
          precedingRange.moveToElementText(containerEl);
          precedingRange.setEndPoint("EndToStart", range);
          precedingChar = precedingRange.text.slice(0);
        }  
      }
      return precedingChar;
    };

    Editor.prototype.isLastChar = function() {
      return this.getNode().textContent.trim().length === this.getCharacterPrecedingCaret().trim().length;
    };

    Editor.prototype.isFirstChar = function() {
      return this.getCharacterPrecedingCaret().trim().length === 0;
    };

    Editor.prototype.isSelectingAll = function(element) {
      var a, b;
      a = this.getSelectedText().killWhiteSpace().length;
      b = element.textContent.killWhiteSpace().length;
      return a === b;
    };

    Editor.prototype.setRangeAt = function(element, int) {
      var range, sel;
      if (int == null) {
        int = 0;
      }
      range = document.createRange();
      sel = window.getSelection();
      range.setStart(element, int);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return element.focus();
    };

    Editor.prototype.setRangeAtText = function(element, int) {
      var node, range, sel;
      if (int == null) {
        int = 0;
      }
      range = document.createRange();
      sel = window.getSelection();
      node = element.firstChild;
      range.setStart(node, 0);
      range.setEnd(node, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return element.focus();
    };

    Editor.prototype.focus = function(focusStart) {
      if (!focusStart) {
        this.setRange();
      }
      this.elNode.focus();
      return this;
    };

    Editor.prototype.focusNode = function(node, range) {
      range.setStartAfter(node);
      range.setEndBefore(node);
      range.collapse(false);
      return this.setRange(range);
    };

    Editor.prototype.getNode = function() {
      var node, range, root;
      node = void 0;
      root = this.elNode,
      selection = this.selection();

      if (selection.rangeCount < 1) {
        return;
      }

      range = selection.getRangeAt(0);

      node = range.commonAncestorContainer;

      if (!node || node === root) {
        return null;
      }
      while(node.nodeType != 1) {
        node = node.parentNode;
      }
      
      var pt = node.closest('.block-content-inner') != null ? node.closest('.block-content-inner') : root;
      
      while (node && (node.nodeType !== 1 || !node.hasClass("item")) && (node.parentNode !== pt)) {
        node = node.parentNode;
      }

      if (node != null && !node.hasClass("item-li") && !node.hasClass('figure-in-row')) {
        var elementRoot = node.closest('.block-content-inner');
        while (node && (node.parentNode !== elementRoot) && node != root) {
          node = node.parentNode;
        }
      }

      if (root && root.contains(node) && root != node) {
        return node;
      } else {
        return null;
      }

    };

    Editor.prototype.markAsSelected = function(element) {
      if (!element || (element && element.nodeType != 1)) {
        return;
      }

      this.elNode.querySelectorAll(".item-selected").forEach(el => {
        el.removeClass("figure-focused"); 
        el.removeClass("item-selected");
      });
      this.elNode.querySelectorAll(".figure-focused").forEach(el => el.removeClass("figure-focused"));

      document.querySelectorAll('.grid-focused').forEach(el => el.removeClass('grid-focused'));

      if (element.hasClass('block-grid-caption')) {
        const bg = element.closest('.block-grid');
        if(bg) {
          bd.addClass('grid-focused');
        }
      }

      element.addClass("item-selected"); 

      if (this.image_toolbar) {
        this.image_toolbar.hide();  
      }
      
      this.setElementName(element);
      this.displayTooltipAt(element);
      this.activateBlock(element);

      if (element.hasClass("item-first") && element.closest('.block-first') != null) {
        this.reachedTop = true;
        if (element.querySelectorAll("br").length === 0) {
          return element.append(document.createElement("br"));
        }
      } else {
        this.reachedTop = false;
      }
    };

    Editor.prototype.activateBlock = function (elem) {
      this.elNode.querySelectorAll('.block-selected').forEach(el => el.removeClass('block-selected'));
      const bdc = elem.closest('.block-content');
      if(bdc != null) {
        bdc.addClass('block-selected');
      }
    };

    Editor.prototype.setupFirstAndLast = function() {
      const il = this.elNode.querySelector('.item-last');
      const imf = this.elNode.querySelector('.item-first');
      
      if(il != null) { il.removeClass('item-last'); }
      if(imf != null) { imf.removeClass('item-first'); }

      const blocks = this.elNode.querySelectorAll('.block-content-inner');
      if(blocks.length > 0) {
        const chh = blocks[0].children;
        if(chh != null && chh.length > 0) {
          chh[0].addClass('item-first');
        }
        const llh = blocks[blocks.length - 1];
        const cllh = llh.children;
        if(cllh != null && cllh.length > 0) {
          cllh[cllh.length - 1].addClass('item-last');
        }
      }
      return;
    };

    // DOM Related methods ends //
    // EDIT content methods //
    Editor.prototype.scrollTo = function(node) {
      if ( node.isElementInViewport() ) {
        return;
      }
      top = node.offsetTop;
      u.scrollToTop();
    };

    Editor.prototype.setupLinks = function(elems) {
      if(elems.length != 0) {
        elems.forEach( (ii) => {
          this.setupLink(ii);
        });
      }
    };

    Editor.prototype.setupLink = function(n) {
      var href, parent_name;
      parent_name = n.parentNode.tagName.toLowerCase();
      n.addClass("markup-" + parent_name);
      href = n.attr("href");
      return n.attr("data-href", href);
    };

    // EDIT content methods ends //
    // Toolbar related methods //
    Editor.prototype.displayTooltipAt = function(element) {
      if (!this.content_bar) {
        return;
      }

      if (!element || element.tagName === "LI") {
        return;
      }

      this.hideContentBar();
      this.content_bar.hide();

      this.content_bar.elNode.removeClass('on-darkbackground');

      if (!element.textContent.isEmpty() && element.querySelectorAll('.placeholder-text').length != 1) {
        return;
      }

      if(element.closest('.with-background') != null) {
        this.content_bar.elNode.addClass('on-darkbackground');
      }
      const rect = element.getBoundingClientRect();
      this.positions = { top: element.offsetTop, left: rect.left };
      
      if (element.hasClass('item-h2')) {
        this.positions.top += 10;
      }else if(element.hasClass('item-h3')) {
        this.positions.top += 5;
      }else if(element.hasClass('item-h4')) {
        this.positions.top += 5;
      }

      var pl = document.querySelector('.hide-placeholder');
      if (pl != null) {
        pl.removeClass('hide-placeholder');
      }

      if (element.querySelectorAll('.placeholder-text').length) {
        element.addClass('hide-placeholder');
      }else {
        element.removeClass('hide-placeholder');
      }

      this.content_bar.show(element);
      return this.content_bar.move(this.positions);
    };

    Editor.prototype.displayTextToolbar = function(sel) {
      return setTimeout(() => {
          var pos;
          pos = u.getSelectionDimensions();
          this.text_toolbar.render();        
          this.relocateTextToolbar(pos);
          this.toolbar = this.text_toolbar;
          return this.text_toolbar.show();
        }, 10);
    };

    Editor.prototype.handleTextSelection = function(anchor_node) {
      if(!anchor_node) {
        return;
      }
      var text = this.getSelectedText();

      if (this.mode == 'read' && text && (text.length < 10 || text.length > 160)) {
        this.text_toolbar.hide();
        return;
      }
      
      if (this.image_toolbar) {
        this.image_toolbar.hide();
      }

      if ( anchor_node.matches(".item-mixtapeEmbed, .item-figure") && !text.isEmpty() ) {
        this.text_toolbar.hide();
        var sel = this.selection(), range, caption;
        if (sel) {
          range = sel.getRangeAt(0),
          caption,
          eleme = range.commonAncestorContainer;
          caption = eleme.closest('.caption');
          if (caption != null) {
            this.current_node = anchor_node;    
            return this.displayTextToolbar();  
          }
        }
      }
      
      if (!anchor_node.matches(".item-mixtapeEmbed, .item-figure") && !text.isEmpty() && anchor_node.querySelectorAll('.placeholder-text').length == 0) {
        this.current_node = anchor_node;
        return this.displayTextToolbar();
      } else {
        this.text_toolbar.hide();
      }

    };


    Editor.prototype.relocateTextToolbar = function(position) {
      var height, left, padd, top;
      let elRect = this.toolbar.elNode.getBoundingClientRect();
      height = elRect.height;
      padd = elRect.width / 2;
      
      left = position.left + (position.width / 2) - padd;

      if (left < 0) {
        left = position.left;
      }

      if (this.isIOS) {
        top = position.top + window.scrollY + height;
        this.text_toolbar.elNode.addClass('showing-at-bottom')
      } else {
        this.text_toolbar.elNode.removeClass('showing-at-bottom')
        top = position.top + window.scrollY - height;
      }

      const elCss = this.text_toolbar.elNode.style;
      elCss.left = left + 'px';
      elCss.top = top + 'px';
      elCss.position = 'absolute';

    };
    // Toolbar related methods ends //

    Editor.prototype.hidePlaceholder = function (node, ev) {
      let ev_type = ev.key || ev.keyIdentifier;

      if([UPARROW, DOWNARROW, LEFTARROW, RIGHTARROW].indexOf(ev.which) != -1) {
        this.skip_keyup = true;
        return;
      }

      if (node && node.hasClass('item-figure')) {
        node.querySelectorAll('.placeholder-text').forEach(el => el.parentNode.removeChild(el));
        return;
      }

      if (node && node.querySelectorAll('.placeholder-text').length) {
        node.innerHTML = '<br />';
        this.setRangeAt(node);
      }
    };

    // EVENT LISTENERS //

    Editor.prototype.cleanupEmptyModifierTags = function (elements) {
      elements.querySelectorAll('i, b, strong, em').forEach( item => {
        if(item.textContent.killWhiteSpace().length == 0) {
          var pnt = item.parentNode;
          item.parentNode.replaceChild(document.createTextNode(''), item);
          if(pnt != null) {
            pnt.normalize();
          }
        }
      });
    };

    Editor.prototype.convertPsInnerIntoList = function (item, splittedContent, match) {
      var split = splittedContent,
          ht = '',
          k = 0,
          counter = match.matched[0].charAt(0);

      // FIXME .. counter checking for many chars which are not implements, not sure other languages have
      // 26 characters or more.. 
      // just avoid the splitting part if we have more than 26 characters and its not numerical
      if (['a','A','i','I','α','Ա','ა'].indexOf(counter) != -1 && split.length > 26) {
        return;
      }

      var count = isNaN(parseInt(counter)) ? counter: parseInt(counter) ;

      while (k < split.length) {
        
        var sf = '\\s*' + count +'(.|\\))\\s';
        var exp = new RegExp(sf);
        var sp = split[k].replace(exp, '');
        ht += '<li>' + sp + '</li>';
        k++;
        count = u.incrementCounter(count);
      }

      // we have a sequence..
      const olN = u.generateElement('<ol class="postList">' + ht + '</ol>');
      item.parentNode.replaceChild( olN, item );
        
      this.addClassesToElement( olN );

      if(olN.children) {
        Array.from(olN.children).forEach( elm => {
          this.setElementName(elm);
        });
      }
    };

    Editor.prototype.doesTwoItemsMakeAList = function (first, second) {
      var f = first,
          s = second,
          firstMatch = f.match(/\s*[1aA](\.|\))\s*/),
          secondMatch = s.match(/\s*[2bB](\.|\))\s*/);

      if (firstMatch && secondMatch) {
        return { matched: firstMatch, type: 'ol' };
      }

      firstMatch = f.match(/^\s*(\-|\*)\s*$/);
      secondMatch = s.match(/^\s*(\-|\*)\s*$/);

      if (firstMatch && secondMatch) {
        return {matched: firstMatch, type: 'ul'};
      }

      return {matched: false};
    };
    

    Editor.prototype.handleUnwrappedLists = function (elements) {
      let _this = this;
      elements.forEach( item => {
          if (item.hasClass('item-figure')) {
            return;
          }
          const html = item.innerHTML;
          if ( html.trim().length !== 0 ) {
            // first case
            var split = html.split('<br>');

            if (split.length >= 2 && split[1] != '') {
              var match = _this.doesTwoItemsMakeAList(split[0], split[1]);
              match.matched = false;

              if (match.matched) {
                _this.convertPsInnerIntoList($item, split, match);
              }  
            }
          }
      });
    };


    Editor.prototype.handleUnwrapParagraphs = function(elements) {
      elements.forEach( item => {
        var p = item.querySelectorAll('p');
        if (p.length) {
          var currNodeName = item.tagName.toLowerCase();
          if (currNodeName == 'blockquote') {
            var d = document.createElement('div');

            for (var i = 0; i < p.length; i = i + 1) {
              let len = p.children.length;
              for(let j = 0; j < len; j++) {
                d.appendChild(p.children[j]);
              }
              p.parentNode.removeChild(p);
            }

            let len = d.children.length;
            for(let i = 0; i < len; i++) {
              item.appendChild(d.children[i]);
            }

          }
        }
      });
    };


    Editor.prototype.handleUnwrappedImages = function(elements) {
      let _this = this;
      elements.forEach(item => {
        if (item.hasClass('ignore-block') && item.hasClass('item-uploading')) {
          return;
        }
        var img = item.querySelectorAll('img');
        if (img.length) {

          item.attr('data-pending', true);
          
          if (item && item.children) {
            const children = item.children;
            var div = document.createElement('p');
            for (let i = 0; i < children.length; i++) {
              var it = children[i];
              if (it == img[0]) {
                continue;
              } else {
                div.appendChild(it);
              }
            }

            div.insertAfter(item);
            _this.addClassesToElement(div);
            _this.setElementName(div);
          }

          return _this.image_uploader.uploadExistentImage(img);
        }
      });

    };

    Editor.prototype.handleUnwrappedFrames = function (elements) {
      elements.querySelectorAll('iframe').forEach( im => {
        this.video_uploader.uploadExistentIframe(im);
      });
    };

    Editor.prototype.handleSpanReplacements = function (element) {
      const replaceWith = element.querySelectorAll('.replace-with');

      replaceWith.forEach( node => {
        var hasBold = node.hasClass('bold'),
          hasItalic = node.hasClass('italic');

        if (hasBold && hasItalic) {
          node.parentNode.replaceChild(u.generateElement(`<i class="markup-i"><b class="markup-b">${node.innerHTML}</b></i>`), node);
        }else if(hasItalic) {
          node.parentNode.replaceChild(u.generateElement(`<i class="markup-i">${node.innerHTML}</i>`), node);
        } else if(hasBold) {
          node.parentNode.replaceChild(u.generateElement(`<b class="markup-i">${node.innerHTML}</b>`), node);
        }
      });
    };


    Editor.prototype.removeUnwantedSpans = function () {
      this.elNode.addEventListener('DOMNodeInserted', (ev) => {
        var node = ev.target;
        if(node.nodeType == 1 && node.nodeName == 'SPAN') {
          if(!node.hasClass('placeholder-text')) {
            const pn = node.parentNode;
            let lastInserted = null;
            Array.from(node.childNodes).forEach(el => {
              if(lastInserted == null) {
                pn.insertBefore(el, node.nextSibling);
                lastInserted = el;
              } else {
                pn.insertBefore(el, lastInserted.nextSibling);
                lastInserted = el;
              }
            });
            pn.removeChild(node);
            // node.parentNode.replaceChild(node, node.children);
          }
        }
      });
    };

    Editor.prototype.cleanPastedText = function (text) {
      var regs =  [
        // replace two bogus tags that begin pastes from google docs
        [new RegExp(/<[^>]*docs-internal-guid[^>]*>/gi), ''],
        [new RegExp(/<\/b>(<br[^>]*>)?$/gi), ''],

         // un-html spaces and newlines inserted by OS X
        [new RegExp(/<span class="Apple-converted-space">\s+<\/span>/g), ' '],
        [new RegExp(/<br class="Apple-interchange-newline">/g), '<br>'],

        // replace google docs italics+bold with a span to be replaced once the html is inserted
        [new RegExp(/<span[^>]*(font-style:italic;font-weight:bold|font-weight:bold;font-style:italic)[^>]*>/gi), '<span class="replace-with italic bold">'],

        // replace google docs italics with a span to be replaced once the html is inserted
        [new RegExp(/<span[^>]*font-style:italic[^>]*>/gi), '<span class="replace-with italic">'],

        //[replace google docs bolds with a span to be replaced once the html is inserted
        [new RegExp(/<span[^>]*font-weight:bold[^>]*>/gi), '<span class="replace-with bold">'],

         // replace manually entered b/i/a tags with real ones
        [new RegExp(/&lt;(\/?)(i|b|a)&gt;/gi), '<$1$2>'],

         // replace manually a tags with real ones, converting smart-quotes from google docs
        [new RegExp(/&lt;a(?:(?!href).)+href=(?:&quot;|&rdquo;|&ldquo;|"|“|”)(((?!&quot;|&rdquo;|&ldquo;|"|“|”).)*)(?:&quot;|&rdquo;|&ldquo;|"|“|”)(?:(?!&gt;).)*&gt;/gi), '<a href="$1">'],

        // Newlines between paragraphs in html have no syntactic value,
        // but then have a tendency to accidentally become additional paragraphs down the line
        [new RegExp(/<\/p>\n+/gi), '</p>'],
        [new RegExp(/\n+<p/gi), '<p'],

        // Microsoft Word makes these odd tags, like <o:p></o:p>
        [new RegExp(/<\/?o:[a-z]*>/gi), ''],

        // deductions over, now cleanup
        // remove all style related informations from the tags.
        [new RegExp(/(<[^>]+) style=".*?"/gi), '$1'],

        // remove multiple line breaks with one.
        [new RegExp(/<br\s*\/?>(?:\s*<br\s*\/?>)+/gi), '<br>'],

      ];

      for (i = 0; i < regs.length; i += 1) {
          text = text.replace(regs[i][0], regs[i][1]);
      }

      return text;
    };

    Editor.prototype.insertTextAtCaretPosition = function (textToInsert, haveMoreNodes) {
      if (document.getSelection && document.getSelection().getRangeAt) {
        var sel = document.getSelection();
        var range = sel.getRangeAt(0);
        var ca = range.commonAncestorContainer;
        var caption = ca.closest('figcaption');
        var getBlockContainer = (node) => {
          while (node) {
            if (node.nodeType == 1 && node.nodeName == 'FIGCAPTION') {
              return node;
            }
            node = node.parentNode;
          }
        }
        var generateRightParts = (node) => {
          if (sel.rangeCount > 0) {
           var blockEl = getBlockContainer(range.endContainer);
            if (blockEl) {
              var ran = range.cloneRange();
              ran.selectNodeContents(blockEl);
              ran.setStart(range.endContainer, range.endOffset);
              return ran.extractContents();
            }
          }
        };

        var generateLeftParts = (node) => {
          if (sel.rangeCount > 0) {
            var blockEl = getBlockContainer(range.startContainer);
            if (blockEl) {
              var ran = range.cloneRange();
              ran.selectNodeContents(blockEl);
              ran.setEnd(range.startContainer, range.startOffset);
              return ran.extractContents();
            }
          }
        };

        if (sel.type == 'Caret') {
          off = range.endOffset;
          var rest = '';
          rest = generateRightParts();

          if (ca.nodeType == 3) {
            ca = ca.parentNode;
          }
          ca.appendChild(textToInsert);
          if (!haveMoreNodes) {
            ca.appendChild(rest);
          }
          return rest;
        }
        if (sel.type == 'Range') {
          var left = '';
          var right = '';
          left = generateLeftParts();
          if (haveMoreNodes) {
            right = generateRightParts();
          }
          if (ca.nodeType == 3) {
            ca = ca.parentNode;
          }
          ca.innerHTML = left;
          ca.appendChild(textToInsert);
          if (!haveMoreNodes) {
            ca.appendChild(right);
          }
          return right;
        }
      }
    };

    Editor.prototype.doPaste = function (pastedText) {

      if (pastedText.match(/<\/*[a-z][^>]+?>/gi)) {

        pastedText = this.cleanPastedText(pastedText);
        const pei = document.querySelector(this.paste_element_id);
        if(pei != null) {
          document.querySelector(this.paste_element_id).parentNode.removeChild(pei);
        }

        document.body.appendChild(u.generateElement(`<div id='${this.paste_element_id.replace('#', '')}' style='display:none;'></div>`));
        if(pei != null) {
          pei.innerHTML = `<span>${pastedText}</span>`;
        }

        // fix span with related tags 
        this.handleSpanReplacements(pei);

        this.pastingContent = true;
        let _this = this;

        this.setupElementsClasses(pei, () => {
            let last_node, new_node, nodes, num, top;
            nodes = u.generateElement( document.querySelector(this.paste_element_id).innerHTML ).insertAfter(this.aa );

            var aa = this.aa;
            var caption;

            if (aa.hasClass('item-figure')) {
              if (aa.hasClass('figure-in-row')) {
                var grid = aa.closest('.block-grid');
                if(grid != null) {
                  caption = grid.querySelector('.block-grid-caption');
                }
              } else {
                caption = aa.querySelector('figcaption');
              }
            } else if(aa.hasClass('block-grid-caption')) {
              caption = aa;
            }

            if (caption && caption.length) {
              var first = nodes;
              var firstText = first.textContent;
              var leftOver = '';
              if (aa.hasClass('item-text-default')) {
                caption.innerHTML = firstText;
              } else {
                leftOver = this.insertTextAtCaretPosition(firstText, nodes.length - 1); // don't count the current node
              }
              aa.removeClass('item-text-default');
              nodes.splice(0, 1);
              first.parentNode.removeChild(first);
              if (leftOver != '') {
                var o = document.createElement('p');
                o.appendChild(u.generateElement(leftOver));
                o.insertAfter(nodes.lastElementChild);
              }
            }

            if (!nodes.length) {
              return;
            }
            if (aa.textContent == '') {
              aa.parentNode.removeChild(aa);
            }

            var pt = document.querySelector(this.paste_element_id).querySelector('figure');

            if(pt != null) {
              const pei = document.querySelector(this.paste_element_id);
              pei.parentNode.removeChild(pei);
            }

            last_node = nodes[nodes.length - 1];
            if (last_node && last_node.length) {
              last_node = last_node[0];
            }
            num = last_node.childNodes.length;
            this.setRangeAt(last_node, num);
            new_node = this.getNode();
            top = new_node.offsetTop;
            this.markAsSelected(new_node);

            this.displayTooltipAt(this.elNode.querySelector(".item-selected"));

            this.cleanupEmptyModifierTags(nodes);

            // handle unwrapped images
            this.handleUnwrappedImages(nodes);
            // unwrapped iframes, if we can handle, we should
            this.handleUnwrappedFrames(nodes);
            // unwrapped lists items, inside p's or consective p's
            this.handleUnwrappedLists(nodes);

            // unwrap p's which might be inside other elements
            this.handleUnwrapParagraphs(nodes);

            var figs = this.elNode.querySelectorAll('figure');
            figs.forEach( (ite) => {
              let it = ite;
              if (it.querySelectorAll('img').length == 0) {
                it.parentNode.removeChild($it);
              }
            });

            var captions = this.elNode.querySelectorAll('figcaption');
            captions.forEach((ite) => {
              let it = ite.closest('.item');
              if (it != null && it.querySelectorAll('img').length == 0) {
                it.parentNode.removeChild(it);
              }
            });

            return u.scrollToTop(top);
            
            /* 
            return $('html, body').animate({
              scrollTop: top
            }, 200); 
            */
          }
        );
        return false;
      } else {
        //its plain text
        var $node = this.aa;
        if ($node.hasClass('item-figure') ) {
          var caption;
          if ($node.hasClass('figure-in-row')) {
            var grid = $node.closest('.block-grid');
            caption = grid != null ? grid.querySelector('.block-grid-caption') : null;
          } else {
            caption = node.querySelector('figcaption');
          }
          if (caption != null) {
            caption.innerHTML = pastedText;
            return false;
          }
        }
      }
    };


    Editor.prototype.handlePaste = function(ev) {
      var cbd, pastedText;
      this.aa = this.getNode();
      pastedText = void 0;

      if (window.clipboardData && window.clipboardData.getData) {
        pastedText = window.clipboardData.getData('Text');
      } else if (ev.clipboardData && ev.clipboardData.getData) {
        cbd = ev.clipboardData;
        pastedText = cbd.getData('text/html').isEmpty() ? cbd.getData('text/plain') : cbd.getData('text/html');
      }
      return this.doPaste(pastedText);
    };


    Editor.prototype.handleDblclick = function(e) {
      var node;
      var tg = e.target.closest('.main-controls');
      if (tg != null) {
        return false;
      }
      node = this.getNode();
      if (!node) {
        this.setRangeAt(this.prev_current_node);
      }
      return false;
    };

    Editor.prototype.handleMouseDown = function (e) {
      var node, anchor_node,
        el = e.toElement;

      if (el.hasClass('placeholder-text') || el.querySelectorAll('.placeholder-text').length) {
        node = el.closest('.figure-caption');
        if(node != null) {
          e.preventDefault();
          u.setCaretAtPosition(node, 0);
        }else {
          node =  el.closest('.item');
          if(node != null) {
            e.preventDefault();
            u.setCaretAtPosition(node, 0);
          }  
        }
      }else if(el.hasClass('block-background') || el.hasClass('table-view') || el.hasClass('table-cell-view')) {
        var section = el.closest('section');
        if(section != null) {
          this.selectFigure(section);
        }
      } else if(el.hasClass('block-grid-caption')) {
        let bg = el.closest('.block-grid');
        if(bg != null) {
          bg.addClass('grid-focused');
        }
      }

    };

    // NOTE don't use the event, as its just dummy, function gets called from selection change also
    Editor.prototype.handleMouseUp = function () {

      var anchor_node,
          selection = this.selection();
      
      if (!selection && selection.anchorNode.hasClass('main-divider')) {
        var new_anchor = selection.anchorNode,
            focusTo = new_anchor.nextElementSibling.querySelector('.block-content-inner:first-child .item:first-child');
          if (focusTo != null) {
            this.setRangeAt(focusTo);
            u.setCaretAtPosition(focusTo);
          }
      }

      anchor_node = this.getNode();

      if (!anchor_node) {
        return;
      }

      this.prev_current_node = anchor_node;
      this.handleTextSelection(anchor_node);
      this.markAsSelected(anchor_node);

      if (!anchor_node.hasClass('item-figure')) {
        return this.displayTooltipAt(anchor_node);  
      } else {
        this.hideContentBar();
        return this;
      }
    };

    Editor.prototype.handleArrow = function(ev) {
      var current_node;
      current_node = this.getNode();
      if (current_node != null) {
        this.markAsSelected(current_node);
        return this.displayTooltipAt(current_node);
      }
    };


    Editor.prototype.handleTab = function(anchor_node, event) {
      var nextTabable = function (node) {
        var next = node.next('.item');
        if (next != null) {
          return next;
        }
        var cont = node.closest('.block-content-inner');
        next = cont != null ? cont.nextElementSibling : null;
        if (next != null) {
          return next;
        }
        var sec = node.closest('.block-content');
        next = sec != null ? sec.next() : null;
        if (next != null) {
          var block = next.querySelector('.block-content-inner:last-child');
          if (block != null) {
            var item = block.querySelector('.item:last-child');
            if (item != null) {
              return item;
            } else {
              return block;
            }
          } else {
            return next;  
          }
        }
        return false;
      };

      var prevTabable = function (node) {
        var prev = node.prev('.item');
        if (prev != null) {
          return prev;
        }
        var cont = node.closest('.block-content-inner');
        cont = cont != null ? cont.previousElementSibling : null;

        if (cont != null && (cont.hasClass('block-grid') || cont.hasClass('full-width-column')) ) {
          return cont;
        } else if(cont.length && cont.hasClass('center-column')) {
          var i = cont.querySelector('.item:last-child');
          if (i != null) {
            return i;
          }
        }

        var sec = node.closest('.block-content');
        prev = sec.previousElementSibling;
        if (prev != null) {
          var last = prev.querySelector('.block-content-inner:last-child');
          if (last != null && last.hasClass('block-grid')) {
            return last;
          } else if(last != null && last.hasClass('center-column')) {
            var i = last.querySelector('.item:last-child');
            if (i != null) {
              return i;
            }
          }
        }
        return false;
      };
      var next;
      if (!anchor_node) {
        anchor_node = document.querySelector('.item-selected');
        if (!anchor_node) {
          anchor_node = document.querySelector('.grid-focused');
        }
      }
      if (!anchor_node) {
        return;
      }
      if (event.shiftKey) {
        next = prevTabable(anchor_node);
      } else {
        next = nextTabable(anchor_node);
      }
      if (next) {
        if (next.hasClass('block-grid')) {
          var cap = next.querySelector('.block-grid-caption');
          if (cap != null) {
            this.setRangeAt(cap);
          }
          next.addClass('grid-focused');
        } else if(next.hasClass('full-width-column')) {
          var fig = next.querySelector('.item-figure');
          if (fig != null) {
            var cap = fig.querySelector('figcaption');
            if (cap.length) {
              this.setRangeAt(cap);
            }
            this.selectFigure(fig);
          }
        } else if(next.hasClass('item-figure')) {
          var cap = next.querySelector('figcaption');
          if (cap != null) {
            this.setRangeAt(cap);
          }
          this.selectFigure(next);
        } else if(next.hasClass('with-background')) {
          var items = next.querySelector('.item:first-child');
          if (items != null) {
            this.setRangeAt(items[0]);
          }
          this.selectFigure(next);
        } else {
          this.setRangeAt(next);
          this.markAsSelected(next);
          this.displayTooltipAt(next);  
        }  
        return this.scrollTo(next);
      }
      
    };    

    Editor.prototype.handleArrowForKeyDown = function(ev) {
      if (ev.shiftKey) { // probably trying
        return
      }
      let caret_node, current_node, ev_type, n, next_node, num, prev_node, crossing_section = false, cn;
      caret_node = this.getNode();
      current_node = caret_node;

      ev_type = ev.key || ev.keyIdentifier;

      switch (ev_type) {
        case "Left":
        case "Right":
          if ( !current_node || !current_node.length) {
            if (document.querySelector(".item-selected") != null) {
              current_node = document.querySelector(".item-selected");
            }
          }
          if(current_node.querySelectorAll('.placeholder-text').length == 1) {
            u.stopEvent(ev);
            return false;
          }
          break;
        case "Down":
          if ( !current_node || !current_node.length) {
            if (document.querySelector(".item-selected") != null) {
              current_node = document.querySelector(".item-selected");
            }
          }

          next_node = current_node.nextElementSibling;

          if (next_node == null) {
            n = this.findNextFocusableElement(current_node);
            next_node = n.node;
            crossing_section = n.section_crossed;
          }

          if (current_node.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
            // we move to caption unles its a partialwidth
            if (current_node.hasClass('figure-in-row') && next_node && !next_node.hasClass('figure-in-row')) {
              var cont = current_node.closest('.block-content-inner');
              if (cont != null) {
                var last = cont.querySelector('.item-figure:last-child');
                if (last != null && last.attr('name') == current_node.attr('name')) {
                  next_node = cont.closest('.block-grid').querySelector('.block-grid-caption');
                }
              }
            } else if (!next_node || !current_node.hasClass('figure-in-row')) {
               next_node = current_node.querySelector('.figure-caption');
            }
          } else if (current_node.hasClass('item-figure') && $(ev.target).hasClass('figure-caption')) {
            if (current_node.hasClass('figure-in-row')) {
              current_node.closest('.block-content-inner').removeClass('figure-focused');
            } 
            if(!next_node.length) { // we don't have a next node
              var cont = current_node.closest('.block-content-inner').nextElementSibling;
              if (cont != null) {
                next_node = cont.querySelector('.item:first-child');
              }
            } 
          }
          cn = current_node;

          if (!cn.hasClass("item") && cn.nodeName != 'FIGCAPTION') {
            return;
          }

          if (cn.hasClass('item-last') && u.editableCaretOnLastLine(current_node)) {
            return;
          }

          if (!next_node) {
            return;
          }

          if (next_node.hasClass('figure-caption') || next_node.hasClass('block-grid-caption')) {
            var figure = next_node.closest('.item-figure');
            if (figure != null || current_node.hasClass('figure-in-row')) {
              this.hideImageToolbar();
              this.markAsSelected(figure);
              this.setRangeAt(next_node);
              if (figure.hasClass('figure-in-row')) {
                figure.closest('.block-content-inner').addClass('figure-focused'); 
              }
              if (current_node.hasClass('figure-in-row')) {
                current_node.closest('.block-grid').addClass('grid-focused');
              }
              u.setCaretAtPosition(next_node);
              ev.preventDefault();
              return false;
            }
          }

          if (current_node.hasClass("item-figure") && next_node.hasClass("item-figure")) {
            this.scrollTo(next_node);
            this.skip_keyup = true;
            this.selectFigure(next_node);
            return false;
          }

          if (next_node.hasClass("item-figure") && caret_node) {
            this.skip_keyup = true;
            this.selectFigure(next_node);
            ev.preventDefault();
            return false;
          } else if (next_node.hasClass("item-mixtapeEmbed")) {
            n = current_node.next(".item-mixtapeEmbed");
            num = n.childNodes.length;
            this.setRangeAt(n, num);
            this.scrollTo(n);
      
            return false;
          } 

          if (current_node.hasClass("item-figure") && next_node.hasClass("item")) {
            this.scrollTo(next_node);
      
            if(next_node.querySelectorAll('.placeholder-text').length) {
              this.markAsSelected(next_node);
              this.setRangeAt(next_node); 
              u.setCaretAtPosition(next_node,0);
              ev.preventDefault();
              return false;
            }else {
              this.markAsSelected(next_node);
              this.setRangeAt(next_node);  
              ev.preventDefault();
              return false;
            }
          }

          if (next_node.hasClass('item-last') && next_node.querySelector('.placeholder-text') != null) {
            u.stopEvent(ev);
            u.setCaretAtPosition(next_node, 0);
            return false;
          }

          if(next_node.querySelectorAll('.placeholder-text').length) {
            u.setCaretAtPosition(next_node, 0);
            return false; 
          }

          if (crossing_section) {
            ev.preventDefault();
            this.setRangeAt(next_node);
            u.setCaretAtPosition(next_node, 0);
            this.markAsSelected(next_node);
            return false
          }

          this.markAsSelected(next_node);

          break;
        case "Up":
          if ( !current_node || !current_node.length) {
            if (document.querySelector(".item-selected") != null) {
              current_node = document.querySelector(".item-selected");
            }
          }

          prev_node = current_node.previousElementSibling;

          if (prev_node == null) {
            n = this.findPreviousFocusableElement(current_node);
            prev_node = n.node;
            crossing_section = n.section_crossed;
          }

          if (typeof prev_node == 'undefined') {
            prev_node = current_node.previousElementSibling;
          }

          if (current_node.hasClass('block-grid-caption')) {
            var lastRow = current_node.closest('.block-grid').querySelector('.block-grid-row');
            if (lastRow != null) {
              prev_node = lastRow.querySelector('.item-figure:last-child');
            }
            
          } else if (current_node.hasClass('block-grid-row') && ev.target.hasClass('figure-caption')) {
              prev_node = current_node.querySelector('.figure-in-row:last-child');
          } else if(current_node.hasClass('block-grid-row')) {

          } else {
            if (prev_node.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
              if (prev_node.hasClass('figure-in-row')) {
                var cont = prev_node.closest('.block-content-inner'),
                lastGraf = cont ? cont.querySelector('.item-figure:last-child') : null;
                if (cont != null && lastGraf != null && lastGraf.attr('name') == prev_node.attr('name')) {
                  prev_node = prev_node.querySelector('.figure-caption');
                }
              }else {
                var caption = prev_node.querySelector('.figure-caption');
                prev_node = caption;
              }
            } else if (current_node.hasClass('item-figure') && ev.target.hasClass('figure-caption')) {
              if (current_node.hasClass('figure-in-row')) {
                prev_node = current_node;
              } else {
                prev_node = current_node;
              }
            }  
          }
          cn = current_node;

          if (!cn.hasClass("item") && !cn.hasClass('block-grid-caption')) {
            return;
          }
          if (!(cn.hasClass("item-figure") || !cn.hasClass('item-first'))) {
            return;
          }

          if (prev_node.hasClass('block-grid-caption')) {
            var grid = prev_node.closest('.block-grid');
            grid.addClass('grid-focused');
          }

          if (prev_node.hasClass('figure-caption')) {
            var figure = prev_node.closest('.item-figure');
            this.hideImageToolbar();
            this.markAsSelected(figure);
            this.setRangeAt(prev_node);
            this.scrollTo(prev_node);
            if (figure.hasClass('figure-in-row')) {
              figure.closest('.block-content-inner').addClass('figure-focused');
            }
            u.setCaretAtPosition(prev_node);
            ev.preventDefault();
            return false;
          }

          if (prev_node.hasClass("item-figure")) {
            document.activeElement.blur();
            this.elNode.focus();
            this.selectFigure(prev_node);
            return false;
          } else if (prev_node.hasClass("item-mixtapeEmbed")) {
            n = current_node.prev(".item-mixtapeEmbed");
            if(n != null) {
              num = n.childNodes.length;
              this.setRangeAt(n, num);
              this.scrollTo(n);
            }
            return false;
          }

          if (current_node.hasClass("item-figure") && prev_node.hasClass("item")) {

            if(document.activeElement) {
              document.activeElement.blur();  
              this.elNode.focus();
            }
            
            this.hideImageToolbar();

            this.markAsSelected(prev_node);
            this.scrollTo(prev_node);

            this.setRangeAt(prev_node);
            u.setCaretAtPosition(prev_node);
            this.skip_keyup = true;
            ev.preventDefault();
          
            return false;
          } else if (prev_node.hasClass("item") && !crossing_section) {
            n = current_node.prev(".item");
            if (n != null) {
              this.scrollTo(n);  
            }else {
              this.scrollTo(prev_node);
            }

            this.markAsSelected(prev_node);

            if(prev_node.hasClass('item-first') && prev_node.querySelector('.placeholder-text') != null) {              
              u.stopEvent(ev);
              u.setCaretAtPosition(prev_node, 0);
            }

            return false;
          }

          if (crossing_section) {
            ev.preventDefault();
            this.setRangeAt(prev_node);
            u.setCaretAtPosition(prev_node, 0);
            this.markAsSelected(prev_node);
            return false
          }
      }
    };

    Editor.prototype.insertFancyChar = function (event, text) {
      u.stopEvent(event);
      var node = this.getNode(),
          textVal,
          range = this.selection().getRangeAt(0);

        range.deleteContents();
      if(text == 'single' || text == 'double') {
        textVal = node.textContent;
        var leftQuote = false, rightQuote = false;

        if((text == null || (text != null && text.trim().length == 0)) || this.isFirstChar() || /\s/.test(textVal.charAt(textVal.length - 1)) ) {
          leftQuote = true;
        }

        if (text == 'single') {
          if (leftQuote) {
            text = QUOTE_LEFT_UNICODE;
          } else {
            text = QUOTE_RIGHT_UNICODE;
          }
        } else if (text == 'double') {
          if (leftQuote) {
            text = DOUBLEQUOTE_LEFT_UNICODE;
          } else {
            text = DOUBLEQUOTE_RIGHT_UNICODE;
          }
        }
      }else if(text == 'dash') {
        text = DASH_UNICODE;
      }

      var appended = false;
      if (node.hasClass('pullquote') && !node.hasClass('with-cite') && (text == DOUBLEQUOTE_RIGHT_UNICODE || text == DASH_UNICODE)) {
        if (u.editableCaretAtEnd(node)) {
          let cite = ('<cite class="item-cite">' + DASH_UNICODE + ' </cite>');
          node.appendChild(u.generateElement(cite));
          u.setCaretAtPosition(cite,2);
          node.addClass('with-cite');
          appended = true;
        }
      } 

      if (!appended) {
        var textNode, range, sel, doc = document;
        textNode = doc.createTextNode(text);
        range.insertNode(textNode);

        range = doc.createRange();
        sel = this.selection();

        range.setStart(textNode, 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
    };

    // TODO for special chars insertion, keydown code is not differentiable
    Editor.prototype.handleKeyPress = function(e) { 
      var which = e.which;

      switch(which) {
        case SINGLE_QUOTE_WHICH:
          this.insertFancyChar(e, 'single');
        break;
        case DOUBLE_QUOTE_WHICH:
          this.insertFancyChar(e, 'double');
        break;
        case DASH_WHICH:
          this.insertFancyChar(e, 'dash');
        break;
      }
    };

    Editor.prototype.handleShortCutKeys = function (e) {
      var which = e.which;
      
      this.current_node = this.getNode();
      var node = this.current_node;

      if (e.ctrlKey && which == CHAR_LINK) {
        if (this.image_toolbar && (node.hasClass('item-figure') || node.hasClass('item-iframe')) ) {
          return this.image_toolbar.addLink(e);
        }
      }

      if (e.ctrlKey && e.altKey) {
        if (SHORT_CUT_KEYS.indexOf(which) != -1 && this.text_toolbar) {
          
          return this.text_toolbar.shortCutKey(which);
        }
      } else if(e.ctrlKey && (which == CHAR_CENTER || which == CHAR_LINK)) {
        return this.text_toolbar.shortCutKey(which, e);
      }
    };

    Editor.prototype.handleKeyDown = function(e) {
      var tg = e.target;
      if (tg.hasClass('.autocomplete')) {
        this.skip_keyup = true;
        return;
      }

      if (e.ctrlKey && !e.shiftKey && [LEFTARROW,DOWNARROW, UPARROW, DOWNARROW].indexOf(e.which) != -1 && tg.hasClass('item-figure')) {
        return this.handleKeyDownOnFigure(e, tg);
      }

      
      if (e.ctrlKey && !e.shiftKey && e.which >= 49 && e.which <= 52 && (tg.hasClass('item-figure') || document.querySelectorAll('.with-background.figure-focused').length) ) {
        if (this.image_toolbar) {
          this.image_toolbar.shortCutKey(e.which , e);
        }
        return false;
      }

      var anchor_node,
          eventHandled, li, parent, utils_anchor_node;

      anchor_node = this.getNode();
      parent = anchor_node;

      if (anchor_node) {
        this.markAsSelected(anchor_node);
      }

      this.hidePlaceholder(anchor_node, e); // hide placeholder if we are in placeholder item

      this.handleShortCutKeys(e);

      if (e.which == ESCAPE) {
        if (this.text_toolbar) {
          this.skip_keyup = true;
          this.text_toolbar.hide();
        }
        if (this.image_toolbar) {
          this.skip_keyup = true;
          this.image_toolbar.hide();
        }
        return false;
      }
      if (e.which === TAB) {
        this.handleTab(anchor_node, e);
        return false;
      }

      if (e.ctrlKey && !e.shiftKey && e.which == 67 && (!anchor_node || anchor_node.length == 0) && document.querySelector('.figure-focused') != null) {
        if (document.createRange) {
          var range = document.createRange();
          var figure = document.querySelector('.figure-focused .item-image');
          this.skip_keyup = true;
          if (figure != null) {
            var sel = this.selection();
            sel.removeAllRanges();
            range.selectNode(figure);
            sel.addRange(range);  
          }
        }
      }

      if (e.which == DELETE) {

        if (this.reachedTop && this.isFirstChar() && anchor_node.next('.item') == null) {
          var sec = anchor_node.closest('.block-content');

          if (sec != null && sec.next('.block-content') != null) {
            this.content_options.forEach( w => {
              if (w && w.contentId && w.contentId == 'SECTION') {
                w.handleDeleteKey(e, anchor_node);
              }
            });
          }

          var df = anchor_node.querySelector('.placeholder-text');
          const intt = anchor_node.next('.item');
          if (df != null && intt != null && intt.querySelectorAll('.placeholder-text').length)  {
            intt.parentNode.removeChild(intt);
            anchor_node.addClass('item-last');
            anchor_node.innerHTML = '<br />';
          } else {
            anchor_node.addClass('item-empty');
            anchor_node.innerHTML = '<br />';
          }
          u.setCaretAtPosition(anchor_node);
          return false;
        } else {
          if (anchor_node.querySelectorAll('.placeholder-text').length) {
            anchor_node.addClass('item-empty');
            anchor_node.innerHTML = '<br />';
            u.setCaretAtPosition(anchor_node);
            return false;
          }
        }

        this.content_options.forEach( w => {
          if (w.handleDeleteKey) {
            return w.handleDeleteKey(e, parent);
          }
        });
        
      }


      if (e.which === ENTER) {
        var sel = this.elNode.querySelector('.item-selected'),
            placeholderText = sel != null ? sel.querySelector('.placeholder-text') : null;

        if (sel != null && !sel.hasClass('item-figure') && placeholderText != null) {
          sel.innerHTML = '<br />';
          sel.addClass('item-empty');
          placeholderText.parentNode.removeChild(placeholderText);
        }
        if(sel != null) {
          sel.removeClass("item-selected");
        }

        if (parent.hasClass("item-p")) {
          li = this.handleSmartList(parent, e);
          if (li) {
            anchor_node = li;
          }
        } else if (parent.hasClass("item-li")) {
          this.handleListLineBreak(parent, e);
        }

        this.content_options.forEach( w => {
          if (w.handleEnterKey) {
            return w.handleEnterKey(e, parent);
          }
        });
        
        if (e.handled) {
          return false;
        }

        if (sel.hasClass('block-grid-caption')) {
          this.handleLineBreakWith("p", parent);
          this.setRangeAtText(document.querySelector(".item-selected"));
          document.querySelector('.item-selected').dispatchEvent(new Event("mouseup"));
          // $(".item-selected").trigger("mouseup");
          return false;
        }
        
        if (parent.hasClass("item-mixtapeEmbed") || parent.hasClass("item-iframe") || parent.hasClass("item-figure")) {
          
          if ( e.target.hasClass('figure-caption') ) {
            this.handleLineBreakWith("p", parent);
            this.setRangeAtText(document.querySelector(".item-selected"));
            document.querySelector('.item-selected').dispatchEvent(new Event("mouseup"));
            return false;
          } else if (!this.isLastChar()) {
            return false;
          }
        }

        if (parent.hasClass("item-iframe") || parent.hasClass("item-figure")) {
          if (this.isLastChar()) {
            this.handleLineBreakWith("p", parent);
            this.setRangeAtText(document.querySelector(".item-selected"));
            document.querySelector('.item-selected').dispatchEvent(new Event("mouseup"));
            return false;
          } else {
            return false;
          }
        }

        if (anchor_node && this.toolbar.lineBreakReg.test(anchor_node.nodeName)) {
          if (this.isLastChar()) {
            e.preventDefault();
            this.handleLineBreakWith("p", parent);
          }
        }
        let _this = this;
        setTimeout(function() {
          var node = _this.getNode();

          if ( !node ) {
            return;
          }
          
          node.removeAttribute('name');

          _this.setElementName(node);

          if (node.nodeName.toLowerCase() === "div") {
            node = _this.replaceWith("p", node);
          }
          let pctAll = node && node.nodeType == 1 ? node.children : null;
          if(pctAll != null && pctAll.length) {
            Array.from(pctAll).forEach(pa => {
              if(pa.matches('.placeholder-text')) {
                pct.parentNode.removeChild(pct);
              }
            });
          }
          // const pct = node.querySelector('> .placeholder-text');
          // if(pct != null) {
          //   pct.parentNode.removeChild(pct);
          // }

          _this.markAsSelected(node);
          _this.setupFirstAndLast();
          
          if ( node.textContent.isEmpty() ) {
            Array.from(node.children).forEach(n => {
              n.parentNode.removeChild(n);
            });
            node.appendChild(document.createElement("br"));
            if (_this.isTouch) {
              //$node.hammer({});
            }
          }
          return _this.displayTooltipAt(_this.elNode.querySelector(".item-selected"));
        }, 15);
      }

      if (e.which === BACKSPACE) {
        
        eventHandled = false;
        this.toolbar.hide();
        anchor_node = this.getNode();

        var sel_anchor = this.selection().anchorNode;

        if (this.reachedTop) {
    
        }

        if(anchor_node.length && anchor_node.querySelectorAll('.placeholder-text').length) {
          e.preventDefault();
          anchor_node.addClass('item-empty');
          anchor_node.innerHTML = '<br />';
          this.skip_keyup = true;
          this.setRangeAt(anchor_node);
          return false;
        }

        if ( (this.prevented || this.reachedTop && this.isFirstChar()) && !sel_anchor.hasClass('block-background')) {
          return false;
        }

        utils_anchor_node = u.getNode();  

        this.content_options.forEach( w => {
          var handled;
          if (w.handleBackspaceKey && !handled) {
            return handled = w.handleBackspaceKey(e, anchor_node);
          }
        });

        if (eventHandled) {
          e.preventDefault();
          return false;
        }

        // Undo to normal quotes and dash if user immediately pressed backspace
        var existingText = this.getCharacterPrecedingCaret(), 
            existingTextLength = existingText.length;
            charAtEnd = existingText.charAt(existingText.length - 1);

        if ( UNICODE_SPECIAL_CHARS.indexOf(charAtEnd) != -1) {
          this.handleSpecialCharsBackspace(charAtEnd);
          return false;
        }

        if (parent.hasClass("item-li") && this.getCharacterPrecedingCaret().length === 0) {
          return this.handleListBackspace(parent, e);
        }

        if (anchor_node.hasClass("item-p") && this.isFirstChar()) {
          if (anchor_node.previousElementSibling && anchor_node.previousElementSibling.hasClass("item-figure")) {
            //e.preventDefault();
            
            //return false;
          }
        }

        if ( utils_anchor_node.hasClass("main-body") || utils_anchor_node.hasClass("item-first")) {
          if ( utils_anchor_node.textContent.isEmpty() ) {
            return false;
          }
        }

        if (anchor_node && anchor_node.nodeType === 3) {
    
        }

        if (anchor_node.hasClass("item-mixtapeEmbed") || anchor_node.hasClass("item-iframe")) {
          if (anchor_node.textContent.isEmpty() || this.isFirstChar()) {
      
            this.inmediateDeletion = this.isSelectingAll(anchor_node);
            if (this.inmediateDeletion) {
              this.handleInmediateDeletion(anchor_node);
            }
            return false;
          }
        }

        if (anchor_node.previousElementSibling != null && anchor_node.previousElementSibling.hasClass("item-mixtapeEmbed")) {
          if (this.isFirstChar() && !anchor_node.textContent.isEmpty() ) {
            return false;
          }
        }

        if (anchor_node.hasClass("item-first")) {
          if( (anchor_node.textContent.isEmpty() || anchor_node.textContent.length == 1) && anchor_node.closest('.block-first') != null) {
    
            if(anchor_node.nextElementSibling && anchor_node.nextElementSibling.hasClass('item-last')) {
              anchor_node.innerHTML = '';
              return false;
            }
          }
        }

        var _this = this;
        setTimeout(function () {
          var backspacedTo = window.getSelection();
          if (backspacedTo.type == 'Caret') {
            _this.markAsSelected(backspacedTo.anchorNode);
          }
        }, 30);

      }

      if (e.which === SPACEBAR) {
  
        if (parent.hasClass("item-p")) {
          this.handleSmartList(parent, e);
        }
      }

      if (anchor_node) {
        if (!anchor_node.textContent.isEmpty() && anchor_node.querySelectorAll('.placeholder-text').length == 0) {
          this.hideContentBar();
          anchor_node.removeClass("item-empty");
        }
      }

      if ([UPARROW, DOWNARROW, LEFTARROW, RIGHTARROW].indexOf(e.which) != -1) {
        this.handleArrowForKeyDown(e);
      }

    };


    Editor.prototype.handleSpecialCharsBackspace = function (charAtEnd) {
      var anchor_node = '';
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.type != 'Caret') { return; }
        var range = sel.getRangeAt(0);
        var commonAn = range.commonAncestorContainer;
        if (commonAn.nodeType == 3) { // its a text node
          var nv = commonAn.nodeValue;
          var toReplaceWith = '';
          if (charAtEnd == QUOTE_LEFT_UNICODE || charAtEnd == QUOTE_RIGHT_UNICODE) {
            toReplaceWith = "'";
          } else if (charAtEnd == DOUBLEQUOTE_LEFT_UNICODE || charAtEnd == DOUBLEQUOTE_RIGHT_UNICODE) {
            toReplaceWith = '"';
          } else if(charAtEnd == DASH_UNICODE) {
            toReplaceWith = "-";
          }
          var position = range.startOffset;
          if (nv.length == 1) {
            commonAn.nodeValue = toReplaceWith;
            var nrange = document.createRange();
            var sele = sel;
            
            nrange.setStart(commonAn, 1);
            nrange.collapse(true);
            sele.removeAllRanges();
            sele.addRange(nrange);  
          } else {
            var newNodeValue = nv.substr(0, position - 1) + toReplaceWith + nv.substr(position);
            commonAn.nodeValue = newNodeValue;
            var nrange = document.createRange();
            var sele = sel;

            nrange.setStart(commonAn, position);
            nrange.collapse(true);
            sele.removeAllRanges();
            sele.addRange(nrange);  
          }
        }
      }

    };

    Editor.prototype.handleKeyUp = function(e, node) {
      var anchor_node, next_item, utils_anchor_node, $utils_anchor_node;
      if (this.skip_keyup) {
        this.skip_keyup = null;
        return false;
      }

      this.toolbar.hide();
      this.reachedTop = false;
      anchor_node = this.getNode();
      
      utils_anchor_node = u.getNode();

      this.handleTextSelection(anchor_node);
      if ([BACKSPACE, SPACEBAR, ENTER].indexOf(e.which) != -1) {
        if (anchor_node.hasClass("item-li")) {
          this.removeSpanTag($anchor_node);
        }
      }

      if ([LEFTARROW, UPARROW, RIGHTARROW, DOWNARROW].indexOf(e.which) != -1) {
        return this.handleArrow(e);
      }

      if (e.which === BACKSPACE) {
        if (utils_anchor_node.hasClass("article-body")) {
    
          this.handleCompleteDeletion(this.elNode);
          if (this.completeDeletion) {
            this.completeDeletion = false;
            return false;
          }
        }
        if (utils_anchor_node.hasClass("main-body") || utils_anchor_node.hasClass("item-first")) {
    
          if ( utils_anchor_node.textContent.isEmpty() ) {
            next_item = utils_anchor_node.next(".item");
            if (next_item) {
              this.setRangeAt(next_item);
              utils_anchor_node.parentNode.removeChild(utils_anchor_node);
              this.setupFirstAndLast();
            } else {
              var cont = utils_anchor_node.closest('.with-background');
              if (cont != null && cont.next('.block-content') != null) {
                var nxtSection = cont.next('.block-content');
                var item = nxtSection != null ? nxtSection.querySelector('.item') : null;
                if (item != null) {
                  this.setRangeAt(item);
                }
                cont.parentNode.removeChild(cont);
                this.fixSectionClasses();
                this.setupFirstAndLast();
              } else if(cont != null && cont.next('.block-content') != null) {
                var havePrev = cont.prev('.block-content');
                if (havePrev != null) {
                  var items = nxtSection.querySelectorAll('.item');
                  if (items.length) {
                    var item = items[items.length - 1];
                    if (item) {
                      this.setRangeAt(item);
                    }  
                    cont.remove();
                    this.fixSectionClasses();
                    this.setupFirstAndLast();
                  }
                } else {
                  this.handleCompleteDeletion(utils_anchor_node);
                }
              }
            }
            return false;
          }
        }

        if (!anchor_node) {
          this.handleNullAnchor();
          return false;
        }

        if (anchor_node.hasClass("item-first")) {
          if (this.getSelectedText() === this.getNode().textContent) {
            this.getNode().innerHTML = "<br>";
          }
          this.markAsSelected(anchor_node);
          this.setupFirstAndLast();
          return false;
        }

        if (anchor_node.hasClass("item-last")) {
          if( anchor_node.textContent.isEmpty() && anchor_node.closest('.block-first') != null) {
            if(anchor_node.previousElementSibling && anchor_node.previousElementSibling.hasClass('item-first')) {
              u.stopEvent(e);
              anchor_node.innerHTML = this.subtitle_placeholder;
              return false;
            }
          }
        }

        if (anchor_node.hasClass("item-first")) {
          if(anchor_node.textContent.isEmpty() && anchor_node.closest('.block-first') != null) { 
      
            if(anchor_node.nextElementSibling && anchor_node.nextElementSibling.hasClass('item-last')) {
              u.stopEvent(e);
              anchor_node.innerHTML = this.title_placeholder;
              return false;
            }
          }
        }
      }
      
      var $tg = e.target;
      if ($tg.nodeName && $tg.nodeName.toLowerCase() == 'figcaption') {
        if ( $tg.textContent.isEmpty() ) {
          if ($tg.hasClass('block-grid-caption')) {
            if($tg.closest('.block-grid') != null) {
              $tg.closest('.block-grid').addClass('item-text-default');
            }
          } else {
            if($tg.closest('.item-figure') != null) {
              $tg.closest('.item-figure').addClass('item-text-default');
            }
          }
        } else {
          if ($tg.hasClass('block-grid-caption')) {
            if($tg.closest('.block-grid') != null) {
              $tg.closest('.block-grid').removeClass('item-text-default');
            }
          } else {
            if($tg.closest('.item-figure') != null) {
            $tg.closest('.item-figure').removeClass('item-text-default');
            }
          }
        }
      }

      if (e.which == BACKSPACE && $tg.hasClass('figure-caption')) {
        var caption = e.target, text = caption.textContent;
        if( text.killWhiteSpace().isEmpty() || (text.length == 1 && text == " ")) {
          if (!caption.attr('data-placeholder-value')) {
            caption.attr('data-placeholder-value', 'Type caption for image(Optional)');
          }
          caption.appendChild(u.generateElement('<span class="placeholder-text">' + caption.attr('data-placeholder-value') + '</span>'));
          if(caption.closest('.item-figure') != null) {
            caption.closest('.item-figure').addClass('item-text-default');
          }
        }
      }
    };

    /** image drag and drop **/
    Editor.prototype.__positionsCache = [];
    Editor.prototype.createElementPositionsCache = function () {
      if (this.__positionsCache.length == 0) {
        var nodes = this.elNode.querySelectorAll('.item');
        var cache = [];
        for (var i = 0; i < nodes.length; i = i + 1) {
          var it = nodes[i];
          var o = it.getBoundingClientRect();
          cache.push([it.attr('name') ,o.top + it.height, o.left]);
        }
        cache.sort(function(a, b) {return a[1] - b[1]})
        this.__positionsCache = cache;
      }
    };

    Editor.prototype.generatePlaceholderForDrop = function(position) {
      var i = 0, cache = this.__positionsCache, len = cache.length;
      for (; i < len; i = i + 1) {
        if (cache[i][1] > position) {
          break;
        }
      }
      var item = i > 0 ? cache[i - 1] : cache[0];
      if(item) {
        var already = document.querySelector('#drag_pc_' + item);
        if (!already) {
          const dp = document.querySelector('.drop-placeholder');
          dp.parentNode.remove(dp);
          var o = `<div class="drop-placeholder" id="drag_pc_${item}"></div>`;
          u.generateElement(o).insertAfter( document.querySelector('[name="' + item + '"]'));
        }  
      }
    };


    Editor.prototype.handleDragEnter = function (e) {
      e.stopPropagation();
      this.createElementPositionsCache();
    };

    Editor.prototype.handleDragEnd = function (e) {
      e.stopPropagation();
      this.__positionsCache = {};
    };

    Editor.prototype.handleDrag = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var o = e.pageY;
      this.generatePlaceholderForDrop(o);
    };

    Editor.prototype.handleDrop = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var dragItem = e.dataTransfer;
      var files = dragItem.files;
      var haveUploads = false;
      if (!files || files.length == 0) {
        this.image_uploader.uploadFiles(files, true);
        haveUploads = true;
      } else {
        var html = dragItem.getData('text/html');
        if (html != '') {
          var placeholder = this.elNode.querySelector('.drop-placeholder');
          var m = placeholder.next('.item');
          if (m.length) {
            this.aa = m;
          } else {
            m = placeholder.prev('.item');
            if (m.length) {
              this.aa = m;
            } else {
              this.aa = this.getNode();
            }
          }
          this.doPaste(html);
        }
      }
      if (haveUploads) {
        document.querySelector('.drop-placeholder').hide();  
      } else {
        document.querySelector('.drop-placeholder').remove();
      }
      
      return false;
    };

    Editor.prototype.handleLineBreakWith = function(element_type, from_element) {
      var new_paragraph;
      new_paragraph = u.generateElement("<" + element_type + " class='item item-" + element_type + " item-empty item-selected'><br/></" + element_type + ">");

      if (from_element.hasClass('block-grid-caption')) {
        var cont = from_element.closest('.block-grid');
        if(cont != null) {
          new_paragraph.insertAfter(cont);
        }
      } else if (from_element.parentNode.matches('[class^="item-"]')) {
        new_paragraph.insertAfter(from_element.parentNode);
      } else {
        new_paragraph.insertAfter( from_element);
      }
      this.setRangeAt(new_paragraph);
      return this.scrollTo(new_paragraph);
    };

    Editor.prototype.replaceWith = function(element_type, from_element) {
      var new_paragraph;
      new_paragraph = u.generateElement("<" + element_type + " class='item item-" + element_type + " item-empty item-selected'><br/></" + element_type + ">");
      from_element.replaceWith(new_paragraph);
      this.setRangeAt(new_paragraph);
      this.scrollTo(new_paragraph);
      return new_paragraph;
    };
    
    // EVENT LISTENERS END //

    Editor.prototype.findNextFocusableElement = function (current_node) {
      var inner, cont, crossing_section = false,
        next_node;
      
      if (current_node.hasClass('item-li')) {
        var list = current_node.closest('.postList');
        if (list.nextElementSibling != null) {
          next_node = list.nextElementSibling;
        }
      }

      if (!next_node) {
        if (current_node.hasClass('figure-in-row')) {
           var row = current_node.closest('.block-grid-row');
           var nextRow = row != null ? row.nextElementSibling : null;

           if (nextRow != null && !nextRow.hasClass('block-grid-caption')) {
             next_node = nextRow.querySelector('.item-figure:first-child');
           } else if (nextRow != null && nextRow.hasClass('block-grid-caption')) {
            next_node = nextRow;
           }

        } else {
          inner = current_node.closest('.block-content-inner');
          cont = inner != null ? inner.nextElementSibling : null;
          if (cont.hasClass('block-grid')) {
            next_node = cont.querySelector('.block-grid-row:first-child .item:first-child');
          } else if (cont != null) {
            next_node = cont.querySelector('.item:first-child');
          }else { // probably a new section below then
            var section = inner.closest('section'),
                next_section = section != null ? section.nextElementSibling : null;
            if (next_section != null) {
              cont = next_section.querySelector('.main-body .block-content-inner:first-child');
              if (cont != null) {
                next_node = cont.querySelector('.item:first-child');
                crossing_section = true;
              }
            }
          }  
        }
      }
      
      return {node: next_node, section_crossed: crossing_section};
    };

    Editor.prototype.findPreviousFocusableElement = function(current_node) {
      let cont = current_node.closest('.block-content-inner');
        cont = cont != null ? cont.previousElementSibling : null;
      let prev_node, crossing_section = false;

      if (current_node.hasClass('figure-in-row')) {
        var cr = current_node.closest('.block-grid');
        var first = cr != null ? cr.querySelector('.block-grid-row:first-child .figure-in-row:first-child') : null;

        if (first != null && first == current_node) {
          var pr = cr.previousElementSibling;
          if (pr != null && !pr.hasClass('block-grid')) {
            prev_node = pr.querySelector('> .item:last-child');
          } else if(pr && pr.hasClass('block-grid')) {
            var lastCap = pr.querySelector('.block-grid-caption');
            prev_node = lastCap;
          }
        }
      }

      if (!prev_node) {
        if (cont.length && cont.hasClass('block-grid')) {
          var caption = cont.querySelector('.block-grid-caption');
          prev_node = caption;
        } else {
          if (cont != null) {
            prev_node = cont.querySelector('.item:last-child');
          } else {
            var section = current_node.closest('section'), 
              prev_section = section != null ? section.previousElementSibling : null;

            if (prev_section != null) {
              cont = prev_section.querySelector('.main-body .block-content-inner:last-child');
              if (cont != null) {
                prev_node = cont.querySelector('.item:last-child');
                crossing_section = true;
              }
            }
          }
        }  
      }
      return {node: prev_node, section_crossed: crossing_section};
    };


    Editor.prototype.moveFigureUp = function (figure) {
      var prev = figure.previousElementSibling;
      var toGrid = false;

      if (prev != null) {
        if (prev.hasClass('item')) {
          figure.insertBefore(prev);
        }
      } else if(figure.hasClass('figure-full-width')) {

      } else {
        var column = figure.closest('.block-content-inner');
        var prevColumn = column.prev('.block-content-inner');
        if (prevColumn != null) {
          if (prevColumn.hasClass('block-grid')) {
            this.moveFigureInsideGrid(figure, nextColumn, false);
            toGrid = true;
          } else if (prevColumn.hasClass('center-column')) {
            prevColumn.appendChild(figure);
          } else if (prevColumn.hasClass('full-width-column')) {
            var prevBeforeFW = prevColumn.previousElementSibling;
            if (prevBeforeFW != null) {
              if (prevBeforeFW.hasClass('center-column')) {
                prevBeforeFW.appendChild(figure);
              } else if(prevBeforeFW.hasClass('full-width-column') || prevBeforeFW.hasClass('block-grid')) {
                var centerColumn = this.pushCenterColumn(prevBeforeFW, false);
                centerColumn.appendChild(figure);
              }
            }
          }
        }
      }

      if (!toGrid) {
        const fc = figure.classList;
        fc.remove('figure-in-row can-go-right can-go-down can-go-left');
      }
    };


    Editor.prototype.moveFigureDown = function (figure) {
      var next = figure.nextElementSibling, toGrid = false;
      figure.removeClass('figure-in-row');

      if (next != null) {
        if (next.hasClass('item')) {
          figure.insertAfter(next);
        }
      } else if (figure.hasClass('figure-full-width')) { // full width image.. find next container
        
      } else { // figure is first item in the column
        var column = figure.closest('.block-content-inner');
        var nextColumn = column != null ? column.next('.block-content-inner') : null;
        if (nextColumn != null) {
          if (nextColumn.hasClass('block-grid')) { // next item is grid, add image to the grid
            this.moveFigureInsideGrid(figure, nextColumn, true);
            toGrid = true;
          } else if (nextColumn.hasClass('center-column')) {  // next is text based center clumn.. prepend item there..
            u.prependNode(figure, nextColumn);

          } else if (nextColumn.hasClass('full-width-column')) { //next is full width image..move image to next column after that..
            var nextAfterFW = nextColumn.nextElementSibling;
            if (nextAfterFW != null) { // we have something after next column
              if (nextAfterFW.hasClass('center-column')) { // its centered column
                u.prependNode(figure, nextAfterFW);

              } else if (nextAfterFW.hasClass('full-width-column') || nextAfterFW.hasClass('block-grid')) { // anotehr full width here..or block grid put a center column inbetween and put figure there
                var centerColumn = this.pushCenterColumn(nextAfterFW, true);
                centerColumn.appendChild(figure);
              } 
            }
          }
        }
      }

      if (!toGrid) {
        const fcl = figure.classList;
        fcl.remove('can-go-left can-go-right can-go-down figure-in-row');
      }
    };


    Editor.prototype.moveFigureInsideGrid = function (figure, grid, firstItem) {
      if (firstItem) {
        var row = grid.querySelector('.block-grid-row:first-child');

        figure.addClass('figure-in-row');
        u.prependNode(figure, row);

        var figures = row.querySelectorAll('.item-figure');

        const evnt = new CustomEvent('Katana.Images.Restructure', {
          type: 'Katana.Images.Restructure',
          container: row,
          count: figures.length,
          figures: figures
        });

        this.elNode.dispatchEvent(evnt);
      } else {
        var row = grid.querySelector('.block-grid-row:last-child');
        figure.addClass('figure-in-row');
        row.appendChild(figure);

        var figures = row.querySelectorAll('.item-figure');

        const evnt = new CustomEvent('Katana.Images.Restructure', {
          type: 'Katana.Images.Restructure',
          container: row,
          count: figures.length,
          figures: figures
        });

        this.elNode.dispatchEvent(evnt);
      }
    };

    Editor.prototype.pushCenterColumn = function (place, before) {
      var div = u.generateElement(`<div class="center-column block-content-inner"></div>`);
      if(before) {
        div.insertBefore(place);
      } else {
        div.insertAfter( place);
      }
      return div;
    }

    Editor.prototype.addClassesToElement = function(element, forceKlass) {
      var n, name, new_el;
      n = element;

      let fK = typeof forceKlass != 'undefined' ? forceKlass : false;

      name = n.nodeName.toLowerCase();

      if (name == 'blockquote') {
        n.removeClass('text-center');
      } else {
        n.removeClass('text-center');
        n.removeClass('pullquote');
      }

      var hasEmpty = false;
      if (n.hasClass('item-empty')) {
        hasEmpty = true;
      }

      switch (name) {
        case "p":
        case "pre":
          n.removeAttribute('class');
          n.addClass("item item-" + name);

          if(fK) {
            n.addClass(forceKlass);
          }

          if (name === "p" && n.querySelectorAll("br").length === 0) {
            n.appendChild(document.createElement("br"));
          }
        break;
        case "div":
          if (n.hasClass('block-grid-row')) {

          } else if (!n.hasClass("item-mixtapeEmbed")) {
            n.removeAttribute('class');
            n.addClass("item item-" + name);
          }
          break;
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          if (name === "h1") {
            new_el = u.generateElement(`<h2 class='item item-h2'>${n.textContent}</h2>`);
            n.parentNode.replaceChild(new_el, n);

            this.setElementName(n);
          } else {
            n.removeAttribute('class');
            n.addClass("item item-" + name);
          }

          if(fK) {
            n.addClass(forceKlass);
          }

          break;
        case "code":
          n.removeAttribute('class');
          n.unwrap().wrap(`<p class='item item-pre'></p>`);
          n = n.parentNode;
          break;
        case "ol":
        case "ul":
          n.removeAttribute('class');
          n.addClass("postList");

          n.querySelectorAll('li').forEach( li => {
            li.removeAttribute('class');
            li.addClass('item item-li');
          })

          break;
        case "img":
          this.image_uploader.uploadExistentImage(n);
          break;
        case "a":
        case 'strong':
        case 'em':
        case 'br':
        case 'b':
        case 'u':
        case 'i':
          n.removeAttribute('class');
          n.addClass('markup-' + name);
          n.wrap(`<p class='item item-p'></p>`);
          n = n.parentNode;
          break;  
        case "blockquote":
          n.removeAttribute('class');
          if (n.hasClass('pullquote')) {
            n.addClass('pullquote');
          };
          if (n.hasClass('with-cite')) {
            n.addClass('with-cite');
          }
          n.addClass('item item-' + name);
          break;
        case "figure":
          if (n.hasClass("item-figure")) {
            n = n;
          }
          break;
        case "figcaption":
          if (n.hasClass('block-grid-caption') || n.hasClass('figure-caption')) {
            n = n;
          }
        break;
        default:
          n.wrap(`<p class='item item-${name}'></p>`);
          n = n.parentNode;
      }

      if (['figure', 'img', 'iframe', 'ul', 'ol'].indexOf(name) == -1) {
        /*var n = n;
        n.html(n.html().replace(/&nbsp;/g, ' ')); */
      }
      if (hasEmpty) {
        n.addClass('item-empty');
      }

      return n;
    };

    Editor.prototype.addHammer = function (element) {
      if (this.isTouch) {
        // $(element).hammer({});
      }
    };

    Editor.prototype.setupElementsClasses = function(element, cb) {
      if (!element) {
        this.element = this.elNode.querySelectorAll('.block-content-inner');
      } else {
        this.element = element;
      }
      let _this = this;
      setTimeout(() => {
          _this.cleanContents(_this.element);
          _this.wrapTextNodes(_this.element);

          let ecC = [];
          let allAs = [];
          _this.element.forEach(elcc => {
            let cc = elcc.children ? Array.from(elcc.children) : [];
            ecC = ecC.concat(cc);
            let aas = elcc.querySelectorAll('a');
            if(aas.length) {
              aas = Array.from(aas);
              allAs = allAs.concat(aas);
            }
          });

          ecC.forEach( (n) => {
            _this.addClassesToElement(n);
            _this.setElementName(n);
          });

          _this.setupLinks( allAs );
          _this.setupFirstAndLast();
          if (Object.toString.call(cb) === '[object Function]') {
            return cb();
          }
      }, 20);

    };

    Editor.prototype.cleanContents = function(element) {

      var s;
      if (!element) {
        this.element = this.elNode.querySelectorAll('.block-content-inner');
      } else {
        this.element = element;
      }
 
      s = new Sanitize({
        elements: ['strong', 'img', 'em', 'br', 'a', 'blockquote', 'b', 'u', 'i', 'pre', 'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li','iframe','figcaption','cite'],
        attributes: {
          '__ALL__': ['class','name', 'data-action', 'title'],
          a: ['href', 'title', 'target'],
          img: ['src','data-height','data-width','data-image-id','data-delayed-src','data-frame-url','data-frame-aspect'],
          iframe: ['src','width','height'],
          ol: ['type']
        },
        protocols: {
          a: {
            href: ['http', 'https', 'mailto']
          }
        },
        transformers: [
          function (input) {
            if (input.node_name === "iframe") {
              var src = input.node.attr('src');
              if (u.urlIsFromDomain(src, 'youtube.com') || u.urlIsFromDomain(src, 'vimeo.com')) {
                return {
                  whitelist_nodes: [input.node]
                };
              } else {
                return null;
              }
            }
          },function(input) {
            if (input.node_name === "span" && input.node.hasClass("placeholder-text")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else {
              return null;
            }
          }, function(input) {
            const kls = input.node.classList ? input.node.classList : [];
            
            if (input.node_name === 'div' && ( kls.contains("item-mixtapeEmbed") || kls.contains("padding-cont") || kls.contains("block-grid-row") || kls.contains("ignore-block") )) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if(input.node_name == 'div' && ( kls.contains("item-controls-cont") || kls.contains("item-controls-inner") ) && input.node.closest('.item-figure') != null) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'a' && kls.contains("item-mixtapeEmbed")) {
              return {
                attr_whitelist: ["style"]
              };
            } else {
              return null;
            }
          }, function(input) {
            const kls = input.node.classList ? input.node.classList : [];
            const prntNode = input.node.parentNode ? input.node.parentNode : false;
            const prntKls = prntNode ? prntNode.classList : [];
            // const prntKls = [];
            if (input.node_name === 'figure' && kls.contains("item-iframe")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'div' && kls.contains("iframeContainer") && prntKls.contains("item-iframe")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'iframe' && prntKls.contains("iframeContainer")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'figcaption' && prntKls.contains("item-iframe")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'div' && kls.contains('item-controls') && input.node.closest('.item-figure') != null) {
              return {
                whitelist_nodes: [input.node]
              };
            } else {
              return null;
            }
          }, function(input) {
            const kls = input.node.classList ? input.node.classList : [];
            const prntNode = input.node.parentNode ? input.node.parentNode : false;
            const prntKls = prntNode ? prntNode.classList : [];
            if (input.node_name === 'figure' && kls.contains("item-figure")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'div' && (kls.contains("padding-cont") && prntKls.contains("item-figure"))) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'div' && (kls.contains("padding-box") && prntKls.contains("padding-cont"))) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'img' && input.node.closest(".item-figure") != null) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'a' && prntKls.contains("item-mixtapeEmbed")) {
              return {
                attr_whitelist: ["style"]
              };
            } else if (input.node_name === 'figcaption' && prntKls.contains("item-figure")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'figcaption' && prntKls.contains("block-grid")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'span' && prntKls.contains("figure-caption")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else if (input.node_name === 'span' && prntKls.contains("block-grid-caption")) {
              return {
                whitelist_nodes: [input.node]
              };
            } else {
              return null;
            }
          }
        ]
      });

      if (this.element.length) {
        for (var i = 0; i < this.element.length; i = i + 1) {
          var el = this.element[i];
          let cleanNode = s.clean_node( el );
          el.innerHTML = '';
          el.appendChild(cleanNode);
        }
      }

    };

    Editor.prototype.wrapTextNodes = function(element) {
      if (!element) {
        element = this.elNode.querySelectorAll('.block-content-inner');
      } else {
        element = element;
      }
      let ecChildren = [];
      element.forEach( (elm) => {
        let elmc = elm.children ? Array.from(elm.children) : [];
        ecChildren = ecChildren.concat(elmc);
      });

      const ecw = ecChildren.filter( (item) => {
        const ii = item;
        if(ii.nodeType === 3) {
          const ht = ii.innerHTML;
          if(ht.trim().length > 0) {
            return true;
          }
        }
        return false;
      });

      u.arrayToNodelist(ecw).wrap("<p class='item grap--p'></p>");
    };

    Editor.prototype.setElementName = function(element) {
      let el = element;
      if (el.tagName == 'LI') {
        return el.attr('name', u.generateId());
      }
      if (!el.matches('[name]')) {
        if(el.tagName == 'UL') {
          let lis = el.querySelectorAll(' > li');
          lis.forEach( item => {
            var li = item;
            if(!li.matches('[name]')) {
              li.attr('name', u.generateId());
            }
          });
        }
        return el.attr("name", u.generateId());
      }
    };


    Editor.prototype.handleSmartList = function(item, e) {
      var li, chars, match, regex;

      chars = this.getCharacterPrecedingCaret();
      match = chars.match(/^\s*(\-|\*)\s*$/);
      if (match) {
        e.preventDefault();
        regex = new RegExp(/\s*(\-|\*)\s*/);
        li = this.listify(item, "ul", regex, match);
      } else {
        match = chars.match(/^\s*[1aAiI](\.|\))\s*$/);
        if (match) {
          e.preventDefault();
          regex = new RegExp(/\s*[1aAiI](\.|\))\s*/);
          li = this.listify(item, "ol", regex, match);
        }
      }
      return li;
    };

    Editor.prototype.handleListLineBreak = function(li, e) {
      var list, paragraph, content;
      this.hideContentBar();
      list = li.parentNode;

      paragraph = document.createElement('p');

      if (list.children != null && list.children.length === 1 && li.textContent.trim() === "") {
        this.replaceWith("p", list);
      } else if (li.textContent.trim() === "" && (li.nextElementSibling !== null)) {
        e.preventDefault();
      } else if (li.nextElementSibling !== null) {
        if (li.textContent.isEmpty()) {
          e.preventDefault();          
          paragraph.parentNode.insertBefore(list, paragraph.nextElementSibling);

          // list.after(paragraph);
          li.addClass("item-removed");
          li.parentNode.removeChild(li);
        } else if (li.previousElementSibling !== null && li.previousElementSibling.textContent.trim() === "" && this.getCharacterPrecedingCaret() === "") {
          e.preventDefault();
    
          content = li.innerHTML;
          paragraph.parentNode.insertBefore(list, paragraph.nextElementSibling);
          // list.after(paragraph);
          if(li.previousElementSibling) {
            li.previousElementSibling.parentNode.removeChild(li.previousElementSibling);
          }
          li.addClass("item-removed");
          li.parentNode.removeChild(li);
          paragraph.innerHTML = content;
        }
      }
      if (list && list.children.length === 0) {
        list.parentNode.removeChild(list);
      }

      if (li.hasClass("item-removed")) {
        this.addClassesToElement(paragraph);
        this.setRangeAt(paragraph);
        this.markAsSelected(paragraph);
        return this.scrollTo(paragraph);
      }
    };

     Editor.prototype.listify = function(paragraph, listType, regex, match) {
      let li, list, content;
      this.removeSpanTag(paragraph);

      content = paragraph.innerHTML.replace(/&nbsp;/g, " ").replace(regex, "");
      var type = match[0].charAt(0);
      switch (listType) {
        case "ul":
          list = document.createElement('ul');
          break;
        case "ol":
          list = document.createElement('ol');
          break;
        default:
          return false;
      }
      
      this.addClassesToElement(list);
      this.replaceWith("li", paragraph);

      if (type != 1) {
        list.addClass('postList--' + type);
        list.attr('type', type);
      }

      li = document.querySelector(".item-selected");
      if(li != null) {
        this.setElementName(li);
        li.innerHTML = content;
        if(li.children != null) {
          li.children.wrap(list);
        }
        if (li.querySelectorAll("br").length === 0) {
          li.appendChild(document.createElement("br"));
        }
        this.setRangeAt(li);
      }
      return li;
    };


    Editor.prototype.handleListBackspace = function(li, e) {
      var list, paragraph, content;
      list = li.parentNode;
      liPr = li.parentNode.tagName.toLowerCase();
      if(liPr != 'ul' && liPr != 'ol') {
        return;
      }
      if(li.previousElementSibling != null) {
        e.preventDefault();
        list.insertBefore(li);
        content = li.innerHTML;
        this.replaceWith("p", li);
        paragraph = document.querySelector(".item-selected");
        if(paragraph != null) {
          paragraph.removeClass("item-empty");
          paragraph.innerHTML = content;
        }
        if (list.children != null && list.children.length == 0) {
          list.parentNode.removeChild(list);
        }
        return this.setupFirstAndLast();
      }
    };


    Editor.prototype.removeSpanTag = function(item) {
      item.querySelectorAll("span").forEach((sp) => {
        if(!sp.hasClass('placeholder-text')) {
          if(sp.children != null) {
            const content = Array.from(sp.children);
            content.forEach(cn => {
              sp.parentNode.insertBefore(cn, sp);
            });
            sp.parentNode.removeChild(sp);
          }
        }
      });
      return item;
    };


    Editor.prototype.handleInmediateDeletion = function(element) {
      var new_node;
      this.inmediateDeletion = false;
      new_node = u.generateElement(this.baseParagraphTmpl()).insertBefore(element);
      new_node.addClass("item-selected");
      this.setRangeAt( element.previousElementSibling );
      return element.parentNode.removeChild(element);
    };

    Editor.prototype.handleUnwrappedNode = function(element) {
      var new_node, tmpl;
      tmpl = u.generateElement(this.baseParagraphTmpl());
      this.setElementName(tmpl);
      element.wrap(tmpl);
      new_node = document.querySelector("[name='" + (tmpl.attr('name')) + "']");
      new_node.addClass("item-selected");
      this.setRangeAt(new_node);
      return false;
    };

    /*
    This is a rare hack only for FF (I hope),
    when there is no range it creates a new element as a placeholder,
    then finds previous element from that placeholder,
    then it focus the prev and removes the placeholder.
    a nasty nasty one...
     */

    Editor.prototype.handleNullAnchor = function() {
      var node, num, prev, range, sel, span;
      sel = this.selection();

      if (sel.isCollapsed && sel.rangeCount > 0) {
        if ( sel.anchorNode.hasClass('block-background') ) {
          return;
        }
        range = sel.getRangeAt(0);
        span = u.generateElement(this.baseParagraphTmpl());
        range.insertNode(span);
        range.setStart(span, 0);
        range.setEnd(span, 0);
        sel.removeAllRanges();
        sel.addRange(range);

        node = range.commonAncestorContainer;
        prev = node.previousElementSibling;
        num = prev.children;

        if (prev != null && prev.hasClass("item")) {
          this.setRangeAt(prev, num);
          node.parentNode.removeChild(node);
          this.markAsSelected(this.getNode());
        } else if (prev != null && prev.hasClass("item-mixtapeEmbed")) {
          this.setRangeAt(prev, num);
          node.parentNode.removeChild();
          this.markAsSelected(this.getNode());
        } else if (!prev) {
          this.setRangeAt(this.elNode.querySelector(".block-content-inner p"));
        }
        return this.displayTooltipAt(this.elNode.querySelector(".item-selected"));
      }
    };

    Editor.prototype.handleCompleteDeletion = function(element) {
      if(element.textContent.isEmpty()) {
        this.selection().removeAllRanges();
        this.render();
        const _this = this;
        setTimeout( () => {
          _this.setRangeAt( _this.elNode.querySelector('.block-content-inner p') );
        }, 20);
        this.completeDeletion = true;
        return ;
      }
    };

    // Anchor tooltip //
     Editor.prototype.displayPopOver = function(ev, matched) {
      return this.tooltip.displayAt(ev, matched);
    };

    Editor.prototype.hidePopOver = function(ev, matched) {
      return this.tooltip.hide(ev, matched);
    };
    // Anchor tooltip ends //

    // Image toolbar related  //
    Editor.prototype.displayImageToolbar = function () {
      if (!this.image_toolbar) {
        return;
      }

      setTimeout(() => {
        var pos;
          pos = u.getImageSelectionDimension();  
          this.image_toolbar.render();
          this.relocateImageToolbar(pos);
          return this.image_toolbar.show();
      }, 10);

    };

    Editor.prototype.relocateImageToolbar = function (position) {
      var height, left, padd, top, scrollTop;
      const ebr = this.image_toolbar.elNode.getBoundingClientRect();

      height = ebr.height;      
      padd = ebr.width / 2;
      top = position.top - height;
      left = position.left + (position.width / 2) - padd;
      scrollTop = window.scrollTop;

      if (scrollTop > top) {
        top = scrollTop;
      }
      const cst = this.image_toolbar.elNode.style;
      cst.left = left;
      cst.top = top;
      cst.position = 'absolute';
    };

    Editor.prototype.selectFigure = function (figure) {
      if(!figure) {
        return;
      }
      
      if (this.image_toolbar) {
        this.image_toolbar.hide();
      }

      this.elNode.querySelectorAll(".figure-focused").forEach(el => el.removeClass("figure-focused"));

      if (figure.hasClass('with-background')) {
        figure.addClass('figure-focused');
        this.displayImageToolbar();
        var item = figure.querySelector('.item');
        if (item != null) {
          u.setCaretAtPosition(item, 0);
          item.focus();
          return;
        }
      }else {
        this.markAsSelected(figure.querySelector('.padding-cont'));
        figure.addClass('figure-focused item-selected');
        const bg = figure.closest(".block-grid");
        if(bg != null) {
          bg.addClass('figure-focused');
        }
        this.selection().removeAllRanges();
        this.displayImageToolbar();  
      }

      if (figure.hasClass('figure-in-row')) {
        const bci = figure.closest('.block-content-inner');
        if(bci != null) {
          bci.addClass('figure-focused grid-focused');
        }
      }

      figure.focus();
    };

    Editor.prototype.handleGrafFigureSelectImg = function (ev) {
      var element;
      var text = this.getSelectedText();
      if (text && text.killWhiteSpace().length > 0) {
        return false;
      }
      element = ev.currentTarget;
      var sec = element.closest('.with-background');
      if (sec != null) {
        this.selectFigure(sec);
      } else {
        this.selectFigure(element.closest('.item-figure'));  
      }
      
      if (this.mode == 'write' || this.mode == 'read') {
        //ev.preventDefault();
        return false;
      }
    };

    Editor.prototype.handleGrafFigureTypeCaption = function(ev) {
      var element = ev.currentTarget,
          text = element.textContent,
          figure = element.closest('figure');

      if(figure != null) {
        if(!text || text.isEmpty()) {
          figure.addClass('item-text-default');
        } else {
          figure.removeClass('item-text-default');
        }
      }
      return;
    };

    Editor.prototype.handleFigureAnchorClick = function (ev) {
      
    };

    Editor.prototype.handleKeyDownOnFigure = function (ev, figure) {
      var keyCode = ev.keyCode;
      if (!this.image_toolbar) {
        return;
      }
      switch(keyCode) {
        case LEFTARROW:
          this.image_toolbar.commandPositionSwitch('left', figure);
          ev.preventDefault();
          return false;
        break;
        case RIGHTARROW:
          this.image_toolbar.commandPositionSwitch('right', figure);
          ev.preventDefault();
          return false;
        break;
        case UPARROW:
          ev.preventDefault();
          this.image_toolbar.commandPositionSwitch('up', figure);
          return false;
        break;
        case DOWNARROW:
          ev.preventDefault();
          this.image_toolbar.commandPositionSwitch('down', figure);
          return false;
        break;
        case ENTER:
        break;
      }
    };

    Editor.prototype.handleImageActionClick = function (ev) {
      var tg = ev.currentTarget,
        action = tg.attr('data-action'),
        figure = tg.closest('figure');
      
      switch(action) {
        case 'remove':
        if (this.image_toolbar) {
          ev.preventDefault();
          this.image_toolbar.removeFigure(figure);
          return false;
        }
        break;
        case 'goleft':
          if (this.image_toolbar) {
            ev.preventDefault();
            this.image_toolbar.commandPositionSwitch('left', figure);
            return false;
          }
        break;
        case 'goright':
          if (this.image_toolbar) {
            ev.preventDefault();
            this.image_toolbar.commandPositionSwitch('right', figure);
            return false;
          }
        break;
        case 'godown':
          if (this.image_toolbar) {
            ev.preventDefault();
            this.image_toolbar.commandPositionSwitch('down', figure);
            return false;
          }
        break;
        case 'goup':
          if (this.image_toolbar) {
            ev.preventDefault();
            this.image_toolbar.commandPositionSwitch('up', figure);
            return false;
          }
        case 'addpic':
          var row = figure.closest('.block-grid-row');
          if (row != null) {
            const aEvent = new CustomEvent('Katana.Images.Add', {type: 'Katana.Images.Add', row: row});
            this.elNode.dispatchEvent(aEvent);
          } else {
            const fEvent = new CustomEvent('Katana.Images.Add', {type: 'Katana.Images.Add', figure: figure});
            this.elNode.dispatchEvent(fEvent);
          }
          
        break;
        case 'stretch':
          if (this.image_toolbar) {
            this.image_toolbar.commandPositionSwitch('stretch', figure);
            return false;
          }
        break;
      }
    };

    Editor.prototype.embedIFrameForPlayback = function (ev) {
      var elem = ev.target,
          frameContainer = elem.closest('.iframeContainer'),
          image = null;
      if(frameContainer != null) {  
        image = frameContainer.querySelector('[data-frame-url]');
      }
      if (image != null) {
        var frameUrl = image.attr('data-frame-url') + '&autoplay=1';
        var iframe = u.generateElement('<iframe src="' + frameUrl + '"></iframe>');
        image.parentNode.replaceChild(iframe, image);
        frameContainer.addClass('hide-controls');
      }
    };

    // Image toolbar related ends //

    /** 
    * after image/embeds layout manipulation, we may end up with lots of linear same layouts
    * function merges them together
    */
    Editor.prototype.mergeInnerSections = function (section) {
      let _this = this;
      let merge = function() {
        var inners = section.querySelectorAll('.block-content-inner');
        if(inners.length) {
          for(var i = 0; i < inners.length; i = i + 1) {
            var curr = inners[i],
                k = i + 1,
                next = typeof inners[k] != 'undefined' ? inners[k] : false;
            if (next) {
              if(next.querySelectorAll('.item').length == 0) {
                next.parentNode.removeChild(next);
                return merge();
              }
              if (!curr.hasClass('block-grid') && u.elementsHaveSameClasses(curr, next)) {
                next.querySelectorAll('.item').forEach(elm => {
                  curr.appendChild(elm);
                });
                _this.setupFirstAndLast();
                next.parentNode.removeChild(next);
                return merge();
              }
            }
          }
        }
      };
      merge(0);
    };

    Editor.prototype.cleanUpInnerSections = function () {
      var inners = this.elNode.querySelectorAll('.block-content-inner');
      for( var i = 0; i < inners.length; i = i + 1) {
        var curr = inners[i];
        if (curr.querySelectorAll('.item').length == 0) {
          curr.parentNode.removeChild(curr);
        }
      }
      var blockGrid = this.elNode.querySelectorAll('.block-grid');
      for (var i = 0; i < blockGrid.length; i = i + 1) {
        var curr = blockGrid[i];
        if (curr.querySelectorAll('.item-figure').length == 0 ) {
          curr.parentNode.removeChild(curr);
        }
      }

      var blockRows = this.elNode.querySelectorAll('.block-grid-row');
      for (var i = 0; i < blockRows.length; i = i + 1) {
        var curr = blockRows[i];
        if (curr.querySelectorAll('.item-figure').length == 0 ) {
          curr.parentNode.removeChild(curr);
        }
      }      
    };

    Editor.prototype.fixSectionClasses = function () {
      this.elNode.querySelectorAll('section').forEach(el => { 
        el.removeClass('block-first');
        el.removeClass('block-last');
      });
      const fc = this.elNode.querySelector('section:first-child');
      if(fc != null) {
        fc.addClass('block-first');
      }
      const lc = this.elNode.querySelector('section:last-child');
      if(lc != null) {
        lc.addClass('block-last');
      }
    };

    Editor.prototype.refreshStoriesMenus = function (val) {
      if (val == '') {
        return;
      }
      var toAdd = null;
      if (val == 'featured') {
        var menu = this.menuOpts[0];
        toAdd = document.createElement('option');
        toAdd.value = menu[0];
        toAdd.text = menu[1];
      } else if(val == 'latest') {
        var menu = this.menuOpts[1];
        toAdd = document.createElement('option');
        toAdd.value = menu[0];
        toAdd.text = menu[1];
      }

      var stfors = this.elNode.querySelectorAll('.block-stories [data-for="storytype"]');
      if (stfors.length) {
        for (var i = 0; i < stfors.length; i = i + 1) {
          var stf = stfors[i];
          if(toAdd != null) {
            stf.appendChild(toAdd);
          }
        }
      }
    };


    Editor.prototype.removeUnnecessarySections = function () {
      var sects = this.elNode.querySelectorAll('section');
      for (var i = 0; i < sects.length; i = i + 1) {
        var sec = sects[i];
        if (sec.querySelectorAll('.item').length == 0) {
          sec.parentNode.removeChild(sec);
        }
      }
      this.parallaxCandidateChanged();
    };


    Editor.prototype.mergeWithUpperSection = function (curr) {
      let upper = curr.prev('.block-content');
      if (upper != null) {
        const mb = upper.querySelector('.main-body');
        if(mb != null) {
          const cmb = curr.querySelector('.main-body > .block-content-inner');
          mb.appendChild(cmb);
        }
        curr.parentNode.removeChild(curr);
        this.mergeInnerSections(upper);
        let newLast = upper.querySelector('.item:last-child');
        if(newLast != null) {
          this.markAsSelected(newLast);
        }
      }
      this.parallaxCandidateChanged();
    };


    Editor.prototype.splitContainer = function (atNode, insrtSection, carryContent) {
      let currContainer = atNode.closest('.block-content'),
          currInner  = atNode.closest('.block-content-inner'),
          insertAfterContainer,
          newContainer,
          newInner,
          carry = carryContent ? true : carryContent,
          insertSection = typeof insrtSection == 'undefined' || insrtSection == null ? u.generateElement(this.getSingleSectionTemplate()) : insrtSection,
          carryContainer = false;

      if (!carry) {
        newContainer = insertSection;
        newContainer.insertAfter(currContainer);
        carryContainer = u.generateElement(this.getSingleSectionTemplate());
        carryContainer.insertAfter(newContainer);
        newContainer = carryContainer;
        insertAfterContainer = carryContainer;
      }else {
        newContainer = insertSection;
        insertAfterContainer = currContainer;
      }

      newInner = newContainer.querySelector('.main-body');

      if(currInner != null) {
        while (currInner.nextElementSibling != null) {
          newInner.appendChild(currInner.nextElementSibling);
        }
      }

      var splittedLayout = u.generateElement(this.getSingleLayoutTempalte());
      splittedLayout.attr('class', currInner.attr('class'));

      while (atNode.nextElementSibling != null) {
        splittedLayout.appendChild(atNode.nextElementSibling);
      }

      splittedLayout.insertBefore(atNode, splittedLayout.firstChild);
      newInner.insertBefore(splittedLayout, newInner.firstChild);
      
      newContainer.insertAfter(insertAfterContainer);

      this.removeUnnecessarySections();
      this.fixSectionClasses();
    };


    Editor.prototype.appendTextSection = function () {
      const sec = u.generateElement(this.getSingleSectionTemplate());
      const mb = sec.querySelector('.main-body');
      if(mb != null) {
        const mbs = '<div class="block-content-inner center-column"><p class="item item-p item-empty" name="'+u.generateId()+'"><br /></p></div>';
        mb.appendChild(u.generateElement(mbs));
      }
      this.elNode.appendChild(sec);
    };

    Editor.prototype.parallaxImages = [];

    // canvas scrolling related stuff
    Editor.prototype.parallaxCandidateChanged = function () {

      var sects = this.elNode.querySelectorAll('.image-in-background'),
          scrolling,
          _this = this,
          parallaxRect = this.parallax.getBoundingClientRect();
  
      if (this.parallaxContext && sects.length) {
        sects.forEach(se => {
          se.addClass('talking-to-canvas');
          se.removeClass('talk-to-canvas');
        });
      }

      this.parallaxImages = [];
      this.sectionsForParallax = sects;

      for (var i = 0; i < sects.length;i = i + 1) {
        var item = sects[i];
        var bg = item.querySelector('.block-background-image');
        if(bg != null) {
          // const styles = getComputedStyle(bg);
          let path = u.getStyle(bg, 'backgroundImage'); // styles.getPropertyValue('background-image');
          path = /^url\((['"]?)(.*)\1\)$/.exec(path);
          path = path ? path[2] : '';
          if (path != '') {
            var img = new Image();
            img.src = path;
            this.parallaxImages.push(img);  
          }
        }
      }

      scrolling = function() {
        _this.checkViewPortForCanvas();
      };

      if (sects != null && sects.length) {
        u.unregisterFromScroll('katana', scrolling);
        u.registerForScroll('katana', scrolling);
        this.checkViewPortForCanvas();
      }else if(!sects.length) {
        this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
        u.unregisterFromScroll('katana', scrolling);
      }
    };

    Editor.prototype.calculatePosition = function (img, sect) {
      var iratio = img.naturalWidth / img.naturalHeight,
          sectionRect = sect.getBoundingClientRect(),
          sectionWidth = sectionRect.width,
          sectionHeight = sectionRect.height,
          sectionBottom = sectionRect.bottom,
          parallaxRect = this.parallax.getBoundingClientRect(),
          canvasHeight = parallaxRect.height,
          scaledImageWidth = sectionWidth,
          scaledImageHeight = scaledImageWidth / iratio;

      var padding = 50, singlePad = padding / 2;

      var iX, iY, iWidth, iHeight, cX, cY, cWidth, cHeight;
      
      if (sectionHeight > (scaledImageHeight - padding)) {
        var delta = sectionHeight - canvasHeight,
            buffer = scaledImageHeight - canvasHeight,
            factor = buffer / delta;

        if (sectionRect.top >= 0) {
          iY = 0;
          cY = sectionRect.top;
          cHeight = canvasHeight;
        } else if(sectionBottom < canvasHeight) {
          iY = canvasHeight - sectionBottom;
          cHeight = sectionBottom;
          cY = 0;
        }else {
          iY = -1 * sectionRect.top * factor;
          cY = 0;
          cHeight = sectionRect.height + sectionRect.top;
        }

        iHeight = (img.naturalWidth * cHeight) / sectionWidth;
        
      } else {

        if (sectionRect.top >= 0) {
          iY = 0;
          cY = sectionRect.top;
          cHeight = sectionRect.height - sectionRect.top;
        }else {
          iY = -1 * sectionRect.top;
          cY = 0;
          cHeight = sectionRect.height + sectionRect.top;
        }
        iHeight = (img.naturalWidth * cHeight) / sectionWidth;
      }

      iX = 0;
      cX = 0;
      iWidth = img.naturalWidth;
      cWidth = sectionWidth;

      return {
        ix: iX,
        iy: iY,
        iw: iWidth,
        ih: iHeight,
        cx: cX,
        cy: cY,
        cw: cWidth,
        ch: cHeight
      };
    };

    Editor.prototype.checkViewPortForCanvas = function () {
      var i = 0,
          sect,
          sections = this.sectionsForParallax,
          isVisible = false
          draf = [],
          videos = [];

      for (; i < sections.length; i = i + 1) {
        sect = sections[i];
        isVisible = sect.isElementVerticallyInViewPort();

        if (isVisible) {
          if (this.mode == 'read' && sect.hasClass('video-in-background')) {
            videos.push(sect);
          } else {
            var img = this.parallaxImages[i],
              pos = this.calculatePosition(img, sect);
              draf.push([img, pos]);  
          }
        }
      }

      const parallaxRect = this.parallax.getBoundingClientRect();

      if (draf.length  > 0) {
        this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
        this.addImageToCanvas(draf);
      } else {
        this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
      }
      
      if (this.mode == 'read') {
        if (videos.length) {
          Katana.Player.cameInView(videos);  
        } else {
          Katana.Player.notInView();
        }
      }
      
    };

    Editor.prototype.addImageToCanvas = function (draf, image, pos) {
      for (var i = 0; i < draf.length;i = i + 1) {
        var image = draf[i][0];
        var pos = draf[i][1];
        this.parallaxContext.drawImage(
          image,
          pos.ix, pos.iy, 
          pos.iw, pos.ih, 
          pos.cx, pos.cy, 
          pos.cw, pos.ch);
      }
    };

    /** notes related **/
    Editor.prototype.showNoteIcon = function (ev) {
      if (this.notesManager) {
        this.notesManager.showNote(ev);
      }
    };
    /** notes related ends **/


    /** mobile touch handling **/
    var _pressWatch = null,
    _pressHappened = false;
    Editor.prototype.handleTap = function (ev) {
      if (_pressHappened) {
        setTimeout( () => {
          var txt = this.getSelectedText();
          if (txt == '' && _pressWatch) {
            clearInterval(_pressWatch);
            _pressHappened = false;
          }
        }, 100); // force wait
      }
    };

    Editor.prototype.handlePress = function (ev) {
      let _pressHappened = true, prev, _this = this;

      _pressWatch = setInterval( function() {
        var txt = _this.getSelectedText();
        if (prev && txt != prev && txt != '') {
          u.animationFrame.call(window, function() {
            _this.handleMouseUp(false);
          });
        } else if (!prev && txt != ''){
          u.animationFrame.call(window, function() {
            _this.handleMouseUp(false);
          });
        }
        prev = txt;
      }, 250);
    };

    /** mobile touch handling ends **/

    /** section stories event handling **/
    Editor.prototype.handleSectionToolbarItemClicked = function (ev) {
      const tg = ev.currentTarget,
          action = tg.attr('data-action');

      if (this.section_options) {    
        this.section_options.command(action, tg);
        this.activateBlock(tg);
        return;
      }
    };

    Editor.prototype.handleSectionToolbarItemKeyUp = function (ev) {
      const which = ev.which,
        stopFor = [BACKSPACE, DELETE, LEFTARROW, RIGHTARROW];

      if(stopFor.indexOf(which) != -1) {
        ev.stopPropagation();
        ev.stopImmediatePropagation();
      }
      return;
    };

    Editor.prototype.handleSectionToolbarItemKeyDown = function (ev) {
      const which = ev.which,
        stopFor = [BACKSPACE, DELETE, LEFTARROW, RIGHTARROW];

      if(stopFor.indexOf(which) != -1) {
        ev.stopPropagation();
        ev.stopImmediatePropagation();
      }
      
      return;
    };

    Editor.prototype.handleSectionToolbarItemKeyPress = function (ev) {
      
    };

    Editor.prototype.handleSectionToolbarItemMouseUp = function (ev) {
      u.simpleStop(ev);
      return;
    };

    Editor.prototype.handleSectionToolbarItemMouseDown = function (ev) {
      u.simpleStop(ev);
      return;
    };

    Editor.prototype.handleSectionToolbarItemDblclick = function (ev) {
      u.simpleStop(ev);
      return;
    };

    Editor.prototype.handleSelectionStoryTypeChange = function (ev) {
      var ctg = ev.currentTarget,
      cont = ctg.closest('.main-controls'),
      input = cont != null ? cont.querySelector('[data-for="tagname"]') : null,
      autoCont = input != null ? input.closest('.autocomplete-buttons') : null;
      if (ctg.value == 'tagged') {
        autoCont.show();
        input.focus();
      } else {
        autoCont.hide();
      }
    };

    Editor.prototype.handleSelectionStoryCountChange = function (ev) {
      var ctg = ev.currentTarget;
      var section = ctg.closest('.block-stories');
      var val = parseInt(ctg.value);
      if (!isNaN(val) && section != null) {
        section.attr('data-story-count', val);
        var bd = section.querySelector('.main-body');
        this.fillStoryPreview(bd, val);
      }
    };

    return Editor;
  })(Katana.Base);

}).call(this);
(function () {
  var Player = {},
  u = Katana.utils;

  window.Katana.Player = Player;

  function YouTubePlayer(url) {
    this._url = url;
    this.init(url);
  };

  YouTubePlayer.prototype.init = function() {
    this.parse();
    this.createContainers();

    this.onYoutubePlayerReady = u.__bind(this.onYoutubePlayerReady, this);
    return this;
  };

  
  YouTubePlayer.prototype.parse = function () {
    var a = document.createElement('a');
    a.href = this._url;
    var path = a.pathname;
    var videoId = path.replace('/embed/','');
    this.videoId = videoId;
    return this;
  };

  YouTubePlayer.prototype.locateContainer = function (){
    var nodes = $('.block-background-image[data-frame-url="' + this._url + '"]');
    if (nodes.length) {
      return nodes;
    }
    return false;
  };

  YouTubePlayer.prototype.createContainers = function () {
    var nodes = this.locateContainer(); // in case we have multiple video embeds in background , but video is same.
    if (nodes) {
      for (var i = 0; i < nodes.length; i = i + 1) {
        var playerContainer = this._addContainer(nodes[i]);
        this.initPlayer(playerContainer);
      }
    }
  };

  YouTubePlayer.prototype.backgroundContainerTemplate = function () {
    var ht = '';
    ht += '<div class="video-container container-fixed in-background" name="' + u.generateId() + '">';
    ht += '<div class="actual-wrapper" id="' + u.generateId() + '"></div>'
    ht += '</div>';
    return ht;
  };

  YouTubePlayer.prototype._addContainer = function (node) {
    if (node.hasClass('block-background-image')) {
      const sec = node.closest('.video-in-background');
      if(sec == null) {
        return;
      }
      const alreadyAdded = sec.querySelector('.video-container');
      if (alreadyAdded != null) {
        const tmpl = this.backgroundContainerTemplate();
        const aspect = node.attr('data-frame-aspect');

        if (aspect && aspect.substring(0,4) == '1.77') {
          tmpl.addClass('video16by9');
        } else if (!aspect) {
          tmpl.addClass('video16by9');
        }
        tmpl.hide();
        tmpl.insertBefore($node);
        return tmpl;  
      } else {
        return alreadyAdded;
      }
    }
  };

  YouTubePlayer.prototype.initPlayer = function (container) {
    if (typeof container == 'undefined') {
      return;
    }
    var containerWrapper = container.querySelector('.actual-wrapper');
    if(containerWrapper == null) {
      return;
    }
    var containerId = containerWrapper.attr('id'),
        containerWrapper = container.closest('.block-background'),
        width,
        height;

    var playerOptions = {
      autohide: true,
      autoplay: false,
      controls: 0,
      disablekb: 1,
      iv_load_policy: 3,
      loop: 0,
      modestbranding:1,
      showinfo:0,
      rel:0
    };

    if (containerWrapper != null) {
      const wrapperRect = containerWrapper.getBoundingClientRect();
      width = wrapperRect.right - wrapperRect.left;
      const wH = wrapperRect.bottom - wrapperRect.top;
      height = wH < u.getWindowHeight() ? wH : u.getWindowHeight();
    }else {
      playerOptions.controls = 1;
    }
    
    var player = new YT.Player(containerId, {
      videoId: this.videoId,
      playerVars: playerOptions,
      events: {
        'onReady': this.onYoutubePlayerReady
      }
    });
    // this.players[containerId] = player;
  };

  YouTubePlayer.prototype.onYoutubePlayerReady = function (event){
    var target = event.target;
    var frame = target.getIframe(),
        frameWrap = frame.closest('.video-container'),
        sectionBackground = frame.closest('.block-background'),
        containerSection = frame.closest('.video-in-background');

    if (frameWrap != null && containerSection != null) {
      var wh = u.getWindowHeight(),
          ww = u.getWindowWidth(),
          buttonsCont = u.generateElement('<div class="button-controls"><div class="container"><div class="row"><div class="col-lg-12 columns"></div></div></div></div>');
          playButton = u.generateElement('<span class="play-button" stat="play"><i class="mfi-action"></i></span>'),
          muteButton = u.generateElement('<span class="mute-button" stat="unmute"><b><i class="mfi-action"></i></b></span>')
          asp = frameWrap.hasClass('video16by9') ? 1.77 : 1.33;

      var frameHeight = ww / asp;

      frame.attr('height', frameHeight);
      frame.removeAttribute('width');

      var neg = -1 * (frameHeight - wh) / 2 ;
      
      const fsty = frameWrap.style;
      fsty.position = 'absolute';
      fsty.zIndex =  0;
      fsty.top = neg + 'px';
      
      const columns = buttonsCont.querySelector('.columns');
      if(columns != null) {
        columns.append(playButton);
        columns.append(muteButton);
      }

      buttonsCont.insertAfter(sectionBackground);
      sectionBackground.style.height = wh + 'px';
      sectionBackground.style.overflow = 'hidden';
      
      containerSection.addClass('video-frame-loaded player-youtube');

      containerSection.style.position = relative;
      const cf = containerSection.querySelector('.container-fixed');
      if(cf != null) {
        cf.show();
      }

      playButton.addEventListener('click', function () {
        const $ths = playButton;
        if ($ths.attr('stat') == 'pause') {
          containerSection.toggleClass('video-playing').toggleClass('video-paused');
          target.pauseVideo();
          $ths.attr('stat', 'play');
        }else {
          containerSection.toggleClass('video-playing');
          containerSection.addClass('hide-preview');
          target.playVideo();
          $ths.attr('stat', 'pause');
        }
      });

      muteButton.addEventListener('click', function () {
        var $ths = muteButton
        if ($ths.attr('stat') == 'unmute') {
          target.unMute();
          $ths.attr('stat', 'mute');
        } else {
          target.mute();
          $ths.attr('stat', 'unmute');
        }
      });
    }

    //target.playVideo();
    // target.mute();
  };

  Player.manage = function (videos) {
    if (!videos) {
      return;
    }
    var youtubeLoadTimer,
        _this = this;
    if (videos.youtube) {
      if (YoutubeScriptLoaded) {
        _this.addYoutubePlayers(videos.youtube);
      }else {
        youtubeLoadTimer = setInterval(function () {
          if (YoutubeScriptLoaded) {
            clearInterval(youtubeLoadTimer);
            _this.addYoutubePlayers(videos.youtube);
          }
        }, 1000);
      }
    }
  };

  Player.addYoutubePlayers = function (urls) {
    for (var i = 0; i < urls.length; i = i + 1) {
      var url = urls[i];
      new YouTubePlayer(url);
    }
  };

  Player.notInView = function() {

  };

  Player.cameInView = function (sects) {

  };

}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Tooltip = (function(_super) {
    u.__extends(Tooltip, _super);

    function Tooltip() {
      return Tooltip.__super__.constructor.apply(this, arguments);
    }

    Tooltip.prototype.el = "body";

    Tooltip.prototype.events = {
      "mouseover .popover": "cancelHide",
      "mouseout  .popover": "hide"
    };

    Tooltip.prototype.initialize = function(opts) {
      if (opts == null) {
        opts = {};
      }
      this.editor = opts.editor;
      this.hideTimeout;
      return this.settings = {
        timeout: 300
      };
    };

    Tooltip.prototype.template = function() {
      return `<div class='popover popover-tooltip popover-bottom active'> 
          <div class='popover-inner'>
            <a href='#' target='_blank'> Link </a>
          </div> 
          <div class='popover-arrow'> </div> </div>`;
    };

    Tooltip.prototype.positionAt = function(ev) {
      var left_value, popover_width, 
        target, target_height, target_offset, target_positions, 
        target_width, top_value, target_is_figure;

      target = ev.currentTarget;

      var o = this.resolveTargetPosition(target);
      target_positions = o.position;
      target = o.target;
      target_is_figure = o.figure;
      
      target_offset = target.offset();
      target_width = target.outerWidth();
      target_height = target.outerHeight();

      var popover = this.elNode.querySelector('.popover');

      popover_width = popover.outerWidth();

      if (target_is_figure) {
        popover.addClass('pop-for-figure');
        top_value = target_offset.top;
        left_value = (target_offset.left + target_width) - popover_width - 15;
        popover.style.top = top_value + 'px';
        popover.style.left = left_value + 'px';
        popover.show();
      } else {
        popover.removeClass('pop-for-figure');
        top_value = target_offset.top + target_height;
        left_value = target_offset.left + (target_width / 2) - (popover_width / 2);
        popover.style.top = top_value + 'px';
        popover.style.left = left_value + 'px';
        popover.show();
      }
      return;
    };

    Tooltip.prototype.displayAt = function(ev, matched) {
      var target;
      this.cancelHide();
      if(matched) {
        target = matched;
      } else {
        target = ev.currentTarget;
      }
      const $el = document.querySelector(this.el);
      const an = $el.querySelector(".popover-inner a");
      if(an != null) {
        an.innerHTML = target.attr('href');
        an.attr('href', target.attr("href"));
      }
      this.positionAt(ev);

      const elNT = $el.querySelector(".popover-tooltip");
      if(elNT != null) {
        elNT.style.pointerEvents = 'auto';
      }
      return $el.show();
    };

    Tooltip.prototype.cancelHide = function() {
      return clearTimeout(this.hideTimeout);
    };

    Tooltip.prototype.hide = function(ev) {
      this.cancelHide();
      const $el = document.querySelector(this.el);
      this.hideTimeout = setTimeout(() => {
        const pp = $el.querySelector('.popover');
        if(pp != null) {
          pp.hide();
        }
      }, this.settings.timeout);
    };

    Tooltip.prototype.resolveTargetPosition = function(target) {
      if (target.parents(".item-figure").exists()) {
        var tg = target.parents(".item-figure");
        return {position: tg.position(), target: tg, figure: true};
      } else {
        return {position: target.position(), target: target, figure: false};
      }
    };

    Tooltip.prototype.render = function() {
      if (document.querySelector('.popover.popover-tooltip') == null) {
        u.generateElement(this.template()).insertAfter(this.editor.elNode);
      }
      return document.querySelector('.popover.popover-tooltip');
    };


    return Tooltip;
  })(Katana.Base);  
}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Content = (function(_super) {
    u.__extends(Content, _super);

    function Content() {
      this.initialize = u.__bind(this.initialize, this);
      return Content.__super__.constructor.apply(this, arguments);
    }

    Content.prototype.contentId = '';

    Content.prototype.initialize = function(opts) {
      if(opts == null) {
        opts = {};
      }
      this.icon = opts.icon;
      this.title = opts.title;
      return this.action = this.title;
    };

    return Content;

  })(Katana.Base);
}).call(this);

// ################################################## //
(function() {

  var u = Katana.utils;
  Katana.ContentBar = (function(_super) {
    u.__extends(Manager, _super);
    function Manager() {
      this.initialize = u.__bind(this.initialize, this);
      this.move = u.__bind(this.move, this);

      this.toggleOptions = u.__bind(this.toggleOptions, this);
      this.handleClick = u.__bind(this.handleClick, this);
      Manager.__super__.constructor.apply(this, arguments);
    }

    Manager.prototype.el = '#mfContentBase';
    Manager.prototype.showedAgainst = null;

    Manager.prototype.events = {
      'click .inlineTooltip-button.control': 'toggleOptions',
      'click .inlineTooltip-menu button': 'handleClick'
    };

    Manager.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.widgets = opts.widgets || [];
      this.current_editor = opts.editor;
    };

    Manager.prototype.template = function () {
      var menu;
      menu = "";
      this.widgets.forEach( b => {
        var data_action_value;
        data_action_value = b.action ? "data-action-value='" + b.action + "'" : "";
        if (b.template) {
          menu += b.template();
        } else {
          menu += `<button class="inlineTooltip-button scale" title="${b.title}" data-action="inline-menu-${b.action} ${data_action_value}"> <span class="tooltip-icon ${b.icon}"></span> </button>`;
        }
        return menu;
      });

      return `<button class='inlineTooltip-button control' data-action='inline-menu' title='Content Options'> <span class='tooltip-icon mfi-plus'></span> </button> <div class='inlineTooltip-menu'>${menu}</div>`;
    };

    Manager.prototype.render = function () {
      var template = this.template();
      this.elNode.innerHTML = template;
      return this;
    };

    Manager.prototype.getView = function () {
      return 'html'; // 
    };

    Manager.prototype.hide = function () {
      this.elNode.removeClass('is-active');
      this.elNode.removeClass('is-scaled');
      this.elNode.addClass('hide');
    };

    Manager.prototype.show = function (showedAgainst) {
      var hidden = document.querySelector('.hide-placeholder');

      if (hidden != null) {
        hidden.removeClass('hide-placeholder');
      }

      this.showedAgainst = showedAgainst;
      this.elNode.addClass('is-active');
      this.elNode.removeClass('hide');
    };

    Manager.prototype.move = function (coords) {
      let control_spacing, control_width, coord_left, coord_top, pull_size, tooltip;

      tooltip = this.elNode;
      control_width = tooltip.querySelector(".control").getBoundingClientRect().width;
      
      control_spacing = u.getStyle(tooltip.querySelector(".inlineTooltip-menu"), 'paddingLeft');
      pull_size = parseInt(control_width) + parseInt(control_spacing.replace(/px/, ""));
      if(isNaN(pull_size)) {
        pull_size = 0;
      }
      coord_left = coords.left - pull_size;
      coord_top = coords.top;
      if ( u.getWindowWidth() <= 768 ) {
        coord_left = 5;
      }
      this.elNode.style.top = coord_top + 'px';
      this.elNode.style.left = coord_left + 'px';
      return;
    };

    Manager.prototype.toggleOptions = function (ev) {
      this.elNode.removeClass('choose-section');
      if (this.elNode.hasClass('is-scaled')) {
        this.elNode.removeClass('is-scaled');
        if (this.showedAgainst && this.showedAgainst.querySelector('.placeholder-text') != null) {
          this.showedAgainst.removeClass('hide-placeholder');
        }
      } else {
        this.elNode.addClass('is-scaled');
        if (this.showedAgainst && this.showedAgainst.querySelector('.placeholder-text') != null) {
          this.showedAgainst.addClass('hide-placeholder');
        }
      }
      return false;
    };

    Manager.prototype.findWidgetByAction = function(name) {
      return this.widgets.filter( (e) => {
        return e.action === name || name.indexOf(e.action) != -1;
      });
    };

    Manager.prototype.handleClick = function (ev, matched) {
      var detected_widget, name, sub_name;
      if(matched) {
        name = matched.attr('data-action');
      } else {
        name = ev.currentTarget.attr('data-action');
      }
      sub_name = name.replace("inline-menu-", "");
      detected_widget = this.findWidgetByAction(sub_name);
      if (detected_widget != null && detected_widget.length > 0) {
        detected_widget[0].handleClick(ev);
      }
      return false;
    };
    return Manager;

  })(Katana.Base);

}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Content.Embed = (function (_super) {
    u.__extends(Embed, _super);

    function Embed() {
      this.handleClick = u.__bind(this.handleClick, this);
      this.initialize = u.__bind(this.initialize, this);
      return Embed.__super__.constructor.apply(this, arguments);
    }

    Embed.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.icon = 'mfi-embed';
      this.title = 'embed';
      this.action = 'embed';
    };

    Embed.prototype.handleClick = function (ev) {
      console.log('embed click');
    };

    return Embed;
  })(Katana.Content);
}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Content.Images = (function (_super) {

    u.__extends(Images, _super);

    function Images() {
      this.initialize = u.__bind(this.initialize, this);

      this.uploadCompleted = u.__bind(this.uploadCompleted, this);
      this.uploadExistentImage = u.__bind(this.uploadExistentImage, this);

      this.updateProgressBar = u.__bind(this.updateProgressBar, this);
      this.uploadFile = u.__bind(this.uploadFile, this);
      this.uploadFiles = u.__bind(this.uploadFiles, this);

      this.handleEnterKey = u.__bind(this.handleEnterKey, this);
      this.handleClick = u.__bind(this.handleClick, this);
      this.handleBackspaceKey = u.__bind(this.handleBackspaceKey, this);
      this.handleDeleteKey = u.__bind(this.handleDeleteKey, this);
      this.imageSelect = u.__bind(this.imageSelect, this);
      this.imageUploadCallback = u.__bind(this.imageUploadCallback, this);
      this.fixPositioningForMultipleImages = u.__bind(this.fixPositioningForMultipleImages, this);
      this.addImagesOnScene = u.__bind(this.addImagesOnScene, this);
      this.embedParagraphAboveImage = u.__bind(this.embedParagraphAboveImage, this);

      this.pushMultipleImageContainer = u.__bind(this.pushMultipleImageContainer, this);
      
      /*this.popup = document.querySelector('#placeable_popup');
      this.popupTitle = this.popup.querySelector('[place="title"]');
      this.popupMessage = this.popup.querySelector('[place="message"]');*/

      return Images.__super__.constructor.apply(this, arguments);
    }

    Images.prototype.contentId = 'IMAGES';

    Images.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.icon = 'mfi-photo';
      this.title = 'image';
      this.action = 'image';
      this.current_editor = opts.editor;
      this.editorEl = this.current_editor.$el;
      this.addImagesInContainer = false;
      this.personal_toolbar = opts.toolbar;
      this.image_cdn_path = '/';

      _this = this;

      this.editorEl.addEventListener('Katana.Images.Restructure', function (event) {
        _this.fixPositioningForMultipleImages(event.container, event.figures, event.count);
      });

      this.editorEl.addEventListener('Katana.Images.Add', function (event) {
        if (typeof event.row != 'undefined') {
          _this.addImagesInRow = event.row;  
          _this.imageSelect(event);
        } else if(typeof event.figure != 'undefined') {
          _this.imageSelect(event);
        }
      });
      return this;
    };

    Images.prototype.handleClick = function (ev) {
      this.imageSelect(ev);
    };

    Images.prototype.createRowAroundFigure = function (figure) {
      var row = this.pushMultipleImageContainer(2, figure);
      figure.addClass('figure-in-row');
      var img = figure.querySelector('.item-image');
      row.appendChild(figure);

      if(img != null) {
        img = img;
        this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
      }
      
      return row;
    };

    Images.prototype.thirdPartyQueue = {};

    Images.prototype.queueProcessTimer = null;

    Images.prototype.thirdPartyImageProcessed = function (image_element, key) {
      delete this.thirdPartyQueue[key];
      if (Object.keys(this.thirdPartyQueue).length == 0) {
        clearInterval(this.queueProcessTimer);
      }
    };

    Images.prototype.processSingleImageElement = function (image_element, opts, key) {
      const url = image_element.attr('src');
      const formData = new FormData();
      const _this = this;

      if (url.indexOf('data:image') == 0) {
        formData.append('image', url);
      } else {
        formData.append('url', url);
      }
    
      this.current_editor.currentRequestCount++;

      const oReq = new XMLHttpRequest();
      oReq.open("POST", '/upload-url', true);
      oReq.onload = function(event) {
        if (oReq.status == 200) {
          try {
            const data = JSON.parse(oReq.responseText);
            if(data.success) {
              var imgSrc = data.file,
                  imageId = data.id;
              _this.thirdPartyImageLoaded({url: url, file: imgSrc, imageId: imageId, key: key});
              _this.current_editor.currentRequestCount--;
            }
          } catch(e) {
            console.log('While uploading image');
            console.error(e);
            _this.current_editor.currentRequestCount--;
          }
        } else {
          _this.current_editor.currentRequestCount--;
        }
      };
      oReq.send(formData);
    };

    Images.prototype.processThirdPartyQueue = function () {
      var currentlyProcessing = 0, toProcess = [],
        process;

      for (var prop in this.thirdPartyQueue) {
        if (this.thirdPartyQueue.hasOwnProperty(prop)) {
          var item = this.thirdPartyQueue[prop];
          if(item && item.processing) {
            currentlyProcessing++;
          }else if(item && !item.processing) {
            toProcess.push(item);
          }
        }
      }

      if (currentlyProcessing == 2) {
        return;
      }

      for (var i = 0; i < toProcess.length; i = i + 1) {
        toProcess[i].processing = true;
        this.processSingleImageElement(toProcess[i].element, toProcess[i].opts, toProcess[i].key);
        if (i == 1) {
          break;
        }
      }
      
    };

    Images.prototype.handleThirdPartyImage = function(image_element, opts) {
      var url = image_element.attr('src');
      var key = url + Math.random(0, Math.random()).toString(32).substring(0,8);
      image_element.attr('data-key', key);
      this.thirdPartyQueue[url] = {element : image_element, opts: opts, key: key};
      var _this = this;

      if (this.queueProcessTimer == null) {
        this.queueProcessTimer = setInterval(function () {
          _this.processThirdPartyQueue();
        }, 3000);
      }

    };

    Images.prototype.thirdPartyImageLoaded = function (ob) {
      var oldImg = document.querySelector('[src="'+ob.url+'"]'),
          newUrl = this.image_cdn_path + '/fullsize/' + ob.file,
          tmpl = u.generateElement(this.current_editor.getFigureTemplate()),
          _this = this,
          img = tmpl.querySelector('img');

      img.attr('src', newUrl);
      img.attr('data-delayed-src', newUrl);
      img.attr('data-image-id', ob.imageId);

      var figure = img.closest('.item-figure');
      if(figure != null) {
        figure.removeClass('item-uploading');
      }

      this.replaceImg(oldImg, tmpl, newUrl, function (figure, image_element) {
        _this.thirdPartyImageProcessed(image_element, ob.key);

        var insideGraf = figure.closest('.item:not(".item-figure")');
        if (insideGraf != null) {
          do {
            figure.unwrap();
            insideGraf = figure.closest('.item:not(".item-figure")');
          } while(insideGraf != null);
        }
        if (figure.closest('.ignore-block.item-uploading') != null) {
          figure.unwrap();
        }
        image_element.parentNode.removeChild(image_element);
      });

    };

    Images.prototype.pastedImagesCache = {};

    Images.prototype.uploadExistentImage = function(image_element, opts) {
      var src = image_element.attr('src');

      var name;
      if (image_element.hasAttribute('name'))  {
        name = image_element.attr('name');
      }

      if (name) {
          if (typeof this.pastedImagesCache[name] != 'undefined') {
            return;
          }
      } else if (image_element.hasClass('marked')) {
        return;
      }

      image_element.addClass('marked');

      if (name) {
        this.pastedImagesCache[name] = true;
      }

      if (!u.urlIsFromDomain(src, 'mefacto.com')) {
        var div = u.generateElement(`<div class="ignore-block item-uploading" contenteditable="false"></div>`);
        image_element.parentNode.insertBefore(div, image_element);
        div.appendChild(image_element);
        return this.handleThirdPartyImage(image_element, opts);
      }

      var i, img, n, node, tmpl, _i, _ref,
          pasting = false;

      if (opts == null) {
        opts = {};
      }

      tmpl = u.generateElement(this.current_editor.getFigureTemplate());
      
      if (this.addImagesInContainer) {
        tmpl.addClass('figure-in-row');
      }

      if (image_element.closest(".item") != null) {
        if (image_element.closest(".item").hasClass("item-figure")) {
          return;
        }
        const itm = image_element.closest('.item');
        itm.parentNode.insertBefore(tmpl, itm);
        node = this.current_editor.getNode();
        if (node) {
          this.current_editor.addClassesToElement(node);
        }
      } else if(image_element.closest(this.current_editor.paste_element_id) != null) {
        pasting = true;
        image_element.parentNode.insertBefore(tmpl, image_element);
      }else {
        img = image_element.parentsUntil(".block-content-inner");
        if(img != null) {
          img = img.firstChild;
          img.parentNode.insertBefore(tmpl, img);
          img.parentNode.removeChild(img);
        }
      }

      if (!pasting) {
        this.replaceImg(image_element, document.querySelector("[name='" + (tmpl.attr('name')) + "']"));
        n = document.querySelector("[name='" + (tmpl.attr('name')) + "']");
        if(n != null) {
          n = n.parentsUntil(".block-content-inner");
          if (n != null) {
            for (i = _i = 0, _ref = n - 1; _i <= _ref; i = _i += 1) {
              document.querySelector("[name='" + (tmpl.attr('name')) + "']").unwrap();
            }
          }
        }
      }else {
        this.replaceImg(image_element, document.querySelector("[name='" + (tmpl.attr('name')) + "']"));
      }
      
      return ;
    };

    Images.prototype.replaceImg = function(image_element, figure, srcToUse, callback) {
      var img, self,sr;
      
      img = new Image();

      if (typeof srcToUse == 'undefined' && typeof callback == 'undefined') {
        img.attr('src', image_element.attr('src') );  
        sr = image_element.attr('src');
        var $img = image_element;
        const fig = $img.closest('figure');
        if(fig != null) {
          fig.parentNode.removeChild(fig);
        }
        $img.parentNode.removeChild($img);
        let ig = figure.querySelector('img');
        if(ig != null) {
          ig.attr('src', sr);
          ig.attr('data-delayed-src',sr);
        }
      } else {
        img.attr('src',srcToUse);
        sr = srcToUse;
      }

      img.attr('data-delayed-src', sr);
      
      self = this;
      return img.onload = function() {
        self.setAspectRatio(figure, this.width, this.height);

        const fig = figure.querySelector(".item-image");
        if(fig != null) {
          fig.attr("data-height", this.height);
          fig.attr("data-width", this.width);
        }

        if (this.width < 760) {
          figure.addClass('n-fullSize');
        }
        
        if (typeof srcToUse == 'undefined') {
          let ig = figure.querySelector('img');
          if(ig != null) {
            return ig.attr('src', sr);
          }
          return null;
        }else {
          let ig = figure.querySelector('img');
          if(ig != null) {
            ig.attr('src', srcToUse);
          }
          image_element.parentNode.insertBefore(figure, image_element);
          image_element.parentNode.removeChild(image_element);
        }

        if (typeof callback != 'undefined') {
          callback(figure, image_element);
        }
        
      };
    };

    Images.prototype.displayAndUploadImages = function(file, cont, callback) {
      this.displayCachedImage(file, cont, callback);
    };

    Images.prototype.viaDrop = false;

    Images.prototype.imageSelect = function(ev) {
      var $selectFile, self;
      $selectFile = u.generateElement('<input type="file" multiple="multiple">');
      $selectFile.click();
      self = this;
      return $selectFile.addEventListener('change', function() {
        var t;
        t = this;
        self.viaDrop = false;
        if(ev.row) {
          self.addImagesInRow = ev.row;
        }else {
          self.addImagesInRow = false;
        }

        if (typeof ev.figure != 'undefined') {
          self.wrapFigureWithAdditions = ev.figure;
        } else {
          self.wrapFigureWithAdditions = false;
        }
        self.addImagesInContainer = false;
        return self.uploadFiles(t.files);
      });
    };

    Images.prototype.displayCachedImage = function(file, cont, callback) {
      this.current_editor.content_bar.hide();
      window.URL = window.webkitURL || window.URL; // Vendor prefixed in Chrome.

      var img = document.createElement('img');
      var _this = this;
      img.onload = function(e) {
        
        if (_this.droppedCount) {
          _this.droppedCount--;
        }

        var img, node, self;
        node = _this.viaDrop ? document.querySelector('.drop-placeholder') : _this.current_editor.getNode();

        self = _this;
      
        var img_tag, new_tmpl, replaced_node;
        new_tmpl = u.generateElement(self.current_editor.getFigureTemplate());

        if(typeof cont != 'undefined' && cont != null) {
          new_tmpl.addClass('figure-in-row');

          if(cont.contains(node)) {
            replaced_node = node.parentNode.insertBefore(new_tmpl, node);
          }else {
            replaced_node = new_tmpl;
            cont.appendChild(replaced_node);
          }
        } else {
          replaced_node = node.parentNode.insertBefore(new_tmpl, node);
        }

        new_tmpl.addClass('item-uploading');
        
        img_tag = new_tmpl.querySelector('img.item-image');
        if(img_tag != null) {
          img_tag.attr('src', e.target.currentSrc ? e.target.currentSrc : e.target.result);
        }
        img_tag.height = this.height;
        img_tag.width = this.width;
        
        self.setAspectRatio(replaced_node, this.width, this.height);
        
        let rig = replaced_node.querySelector(".item-image");
        
        if(rig != null) {
          rig.attr("data-height", this.height);
          rig.attr("data-width", this.width);
        }

        if (img_tag.width < 700) {
          replaced_node.addClass('n-fullSize');
        }

        if(self.current_editor.image_options && self.current_editor.image_options.upload) {
          // release blob when actual image uploads starts
          window.URL.revokeObjectURL(this.src); // Clean up after yourself
        }

        if( typeof callback != 'undefined') {
          callback(replaced_node); // let the callback know the image has been places, we need to adjust width incase of multiple images select  
        }
        if (_this.droppedCount == 0) {
          let dp = document.querySelector('.drop-placeholder');
          if(dp != null) {
            dp.parentNode.removeChild(dp);
          }
        }
        self.uploadFile(file, replaced_node);
      };

      img.src = window.URL.createObjectURL(file);

    };

    Images.prototype.setAspectRatio = function(figure, w, h) {
      var fill_ratio, height, maxHeight, maxWidth, ratio, result, width;
      maxWidth = 760;
      maxHeight = 700;
      ratio = 0;
      width = w;
      height = h;

      if (figure.hasClass('figure-in-row')) {
        maxWidth = figure.closest('.block-grid-row').getBoundingClientRect().width;
        maxHeight = u.getWindowWidth();
      }
      
      if (width > maxWidth) {
        ratio = maxWidth / width;
        height = height * ratio;
        width = width * ratio;
      } else if (height > maxHeight) {
        ratio = maxHeight / height;
        width = width * ratio;
        height = height * ratio;
      }

      fill_ratio = height / width * 100;

      let pc = figure.querySelector(".padding-cont");
      if(pc != null) {
        pc.style.maxWidth = width + 'px';
        pc.style.maxHeight = height + 'px';
      }

      let pb = figure.querySelector(".padding-box");
      if(pb != null) {
        pb.style.paddingBottom = fill_ratio + "%";
      }
    };

    Images.prototype.formatData = function(file) {
      var formData;
      formData = new FormData();
      formData.append('file', file, file.name);
      return formData;
    };

    Images.prototype.droppedCount = -1;

    Images.prototype.uploadFiles = function(files, viaDrop) {
      this.batchesFiles = [];
      if (typeof viaDrop != 'undefined' && viaDrop) {
        this.viaDrop = true;
      }

      var sizeLimit = 17900000, // 8 MB

      acceptedTypes, file, i, _results;
      
      acceptedTypes = {
        "image/png": true,
        "image/jpeg": true,
        "image/gif": true
      };

      i = 0;
      _results = [],

      sizeError = false;
      
      while (i < files.length) {
        file = files[i];
        if (acceptedTypes[file.type] === true) {
          if (file.size <= sizeLimit) {
            this.batchesFiles.push(file);
          } else {
            sizeError = true;
          }
        }
        _results.push(i++);
      }

      if (sizeError) {
        this.current_editor.notifySubscribers('Katana.Error', {
            target : 'image',
            message: 'Max file size exceeded'
          });
        return;
      }

      if (this.batchesFiles.length == 0) {
        let dp = document.querySelector('.drop-placeholder');
        if(dp != null) {
          dp.parentNode.removeChild(dp);
        }
        this.viaDrop = false;
        this.droppedCount = this.batchesFiles.length;
      }

      this.addImagesOnScene();
      return _results;
    };

    Images.prototype.addImagesOnScene = function () {
      var batch = this.batchesFiles,
          size = batch.length,
          cont = false,
          i = 0;
      if(!size) {
        return;
      }

      if (this.wrapFigureWithAdditions) {
        var figure = this.wrapFigureWithAdditions;
        var row = this.pushMultipleImageContainer(2, figure);
        figure.addClass('figure-in-row');
        var img = figure.querySelector('.item-image');
        row.appendChild(figure);

        if(img != null) {
          this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
        }
        cont = row;
        this.wrapFigureWithAdditions = false;
      }

      if (this.addImagesInRow) {
        var len = size > 3 ? 3 : size;
        for (var i = 0; i < len; i = i + 1) {
          this.displayAndUploadImages(batch[i], this.addImagesInRow, this.imageUploadCallback);
        }
        return;
      }

      if (size == 1 && !cont) {
        this.displayAndUploadImages(this.batchesFiles[0], null, this.imageUploadCallback);
      } else if(size > 1 && size < 9 || cont) {
        if (!cont) {
          cont = this.pushMultipleImageContainer(size);  
        }
        k = 0;
        while (k < size) {
          var l = ((k + 3) > size) ? size : k + 3;

          for (i = k; i < l; i = i + 1) {
            this.displayAndUploadImages(batch[i], cont, this.imageUploadCallback);  
            k++;
          }

          if (k >= size) {
            break;
          }

          var newCount = size - l > 3 ? 3 : size - l;
          var newRow = this.blockGridRowTemplate(newCount);
          newRow.insertAfter(cont);
          cont = newRow;
        }
      }
    };

    Images.prototype.imageUploadCallback = function ($figure) {
      var node ,parentNode;
      node = $figure;
      parentNode = node.parentNode;
      if(parentNode != null && parentNode.hasClass('block-grid-row')) {
        var count = parentNode.attr('data-paragraph-count'),
        figures = parentNode.querySelectorAll('.figure-in-row');
        this.fixPositioningForMultipleImages(parentNode, figures, count);

        if (figures.length == count) {

          if(parentNode.querySelector('.item-selected') != null) { // move to next section , so that its width doesn't change
            var selected = parentNode.querySelector('.item-selected'),
                next_cont = parentNode.next('.block-content-inner'),
                first_child = null;

                if(next_cont != null) {
                  for(let i = 0; i < next_cont.children.length; i++) {
                    let ncc = next_cont.children[i];
                    if(ncc.hasClass('item')) {
                      first_child = ncc;
                      break;
                    }
                  }
                }

            if(first_child != null) {
              first_child.parentNode.insertBefore(selected, first_child);
            }else {
              next_cont.appendChild(selected);
            }
          }

          //this.current_editor.cleanUpInnerSections();
          this.current_editor.selectFigure(node);
        }
      }else {
        this.current_editor.setupFirstAndLast();
        this.current_editor.selectFigure($figure);
      }
    };

    Images.prototype.fixPositioningForMultipleImages = function (cont, figures, count)  {
      var ratios = [],
          rsum = 0,
          height, 
          len = figures.length,
          widths = [],
          totalWidth = cont.width(),
          i = 0;

      for (i; i < len; i = i + 1) {
        var fig = figures[i];
        var  ig = fig.querySelector('img')
        var nw = nh = 0;
        if(ig != null) {
          if (ig.hasAttribute('data-width')) {
            nw = parseInt(ig.attr('data-width'));
          } else {
            nw = ig.naturalWidth;
          }
          if (ig.hasAttribute('data-height')) {
            nh = parseInt(ig.attr('data-height'));
          } else {
            nh = ig.naturalHeight;
          }
        }
        this.setAspectRatio(fig, nw, nh);
      }

      for (i = 0; i < len; i = i +1 ) {
        var ig = figures[i].querySelector('img');
        if(ig != null) {
          r = parseFloat(ig.attr('data-width')) / parseFloat(ig.attr('data-height'));
          rsum += r;
          ratios[i] = r;
        }
      }

      height = totalWidth / rsum;

      for(i = 0; i < len; i = i +1 ) {
        var fig = figures[i],
            wid = ((ratios[i] * height) / totalWidth) * 100;
            fig.style.width = wid + '%';
      }

      if (count == 1) {
        let pcA = figures.querySelectorAll('.padding-cont');
        pcA.forEach(pc => {
          pc.removeAttribute('style');
        });
      }

      cont.attr('data-paragraph-count', figures.length);
      var grid = cont.closest('.block-grid');
      var figs = grid != null ? grid.querySelectorAll('.item-figure') : null;
      if(grid != null) {
        grid.attr('data-paragraph-count', figs.length);
      }
      
    };

    Images.prototype.blockGridRowTemplate = function (count) {
      return u.generateElement(`<div class="block-grid-row" data-name="${u.generateId()}" data-paragraph-count="${count}"></div>`);
    };

    Images.prototype.blockGridTemplate = function (count) {
      var ht = `<figure class="block-content-inner block-grid item-text-default" data-name="${u.generateId()}" >
      <div class="block-grid-row" data-name="${u.generateId()}" data-paragraph-count="${count}"></div>
      <figcaption class="block-grid-caption" data-name="${u.generateId()}" data-placeholder-value="Type caption for image (optional)"><span class="placeholder-text">Type caption for image (optional)</span></figcaption>
      </figure>`;
      return u.generateElement(ht);
    }

    Images.prototype.pushMultipleImageContainer = function (count, figure) {
      let node;
      if (typeof figure != 'undefined') {
        node = figure;
      } else if (document.querySelectorAll('.drop-placeholder').length) {
        node = document.querySelector('.drop-placeholder');
      } else {
        node = this.current_editor.getNode();
      }
      if(node == null) {
        return;
      }
      
      var parentContainer = node.closest('.block-content-inner');
      var item = node.closest('.item');
    
      var bottomContainer = u.generateElement(`<div class="${parentContainer.attr('class')}"></div>`);

      while(item.nextElementSibling != null) {
        bottomContainer.append(item.nextElementSibling);
      }

      var new_tmpl = this.blockGridTemplate(count);
      new_tmpl.insertAfter(parentContainer);
      bottomContainer.insertAfter(new_tmpl);

      this.addImagesInContainer = true;
      bottomContainer.prepend(item);
      this.current_editor.setRangeAt(document.querySelector('.item-selected'));

      return new_tmpl.querySelector('.block-grid-row');
    };

    Images.prototype.uploadFile = function(file, node) {
      if(!this.current_editor.image_options || !this.current_editor.image_options.upload) {
        return;
      }
      const _this = this;
      const formData = this.formatData(file);

      this.current_editor.currentRequestCount++;

      const oReq = new XMLHttpRequest();
      oReq.open("POST", this.current_editor.image_options.url, true);
      oReq.onprogress = this.updateProgressBar;
      oReq.onload = function(event) {
        if (oReq.status == 200) {
          _this.current_editor.currentRequestCount--;
          try {
            let resp = JSON.parse(oReq.responseText);
            if (_this.current_editor.upload_callback) {
              resp = _this.current_editor.upload_callback(resp);
            }
            _this.uploadCompleted(resp, node);
          } catch(e) {
            console.log('--- image upload issue ---');
            console.error(e);
            _this.current_editor.notifySubscribers('Katana.Error', e);
          }
        } else {
          _this.current_editor.currentRequestCount--;
        }
      };
      oReq.send(formData);

    };

    Images.prototype.updateProgressBar = function(e) {
      var complete;
      complete = "";
      if (e.lengthComputable) {
        complete = e.loaded / e.total * 100;
        complete = complete != null ? complete : {
          complete: 0
        };
        return u.log(complete);
      }
    };

    Images.prototype.uploadCompleted = function(ob, node) {
      var ig = node.querySelector('img');
      if(ig != null) {
        ig.attr('data-image-id', ob.id);
        var path = `${this.image_cdn_path}/fullsize/${ob.file}`;
        node.removeClass('item-uploading');
        ig.attr('data-delayed-src', path);
        return ig.attr('src', path);
      }
      return null;
    };

    Images.prototype._uploadCompleted = function (ob, node) {
      var ig = node.querySelector('img');
      if(ig != null) {
        ig.attr('data-image-id', ob.id);
        var path = `${this.image_cdn_path}/fullsize/${ob.file}`;
        return ig.attr('src', path);
      }
      return null;
    };

    /*
     * Handles the behavior of deleting images when using the backspace key
     *
     * @param {Event} e    - The backspace event that is being handled
     * @param {Node}  node - The node the backspace was used in, assumed to be from te editor's getNode() function
     *
     * @return {Boolean} true if this function handled the backspace event, otherwise false
     */

    Images.prototype.handleBackspaceKey = function(e, anchor_node) {      
      var figure = document.querySelector(".item-selected");
      if (figure != null && figure.hasClass("item-figure") && (typeof anchor_node === "undefined" || anchor_node === null)) {
        
        if(e.target.hasClass('figure-caption')) {
          return true;
        }
        this.personal_toolbar.removeFigure(figure);
        var ret = false;

        e.preventDefault();
        this.current_editor.image_toolbar.hide();
        return true;
      } else if(figure.hasClass('item-figure') && anchor_node && anchor_node.hasClass('item-figure') && e.target.tagName == "FIGCAPTION") {
        var haveTextBefore = this.current_editor.getCharacterPrecedingCaret();
        if (haveTextBefore.killWhiteSpace().length == 0) {
          e.preventDefault();
          this.current_editor.image_toolbar.hide();
          this.personal_toolbar.removeFigure(figure);
          return true;          
        }
        return false;
      }
      return true;
    };

    Images.prototype.handleDeleteKey = function (e, node) {
      var sel = document.querySelector('.item-selected');
      if (sel != null && sel.hasClass('item-figure') && (!node || node.length == 0)) {
        this.personal_toolbar.removeFigure(sel);
        e.preventDefault();
        this.current_editor.image_toolbar.hide();
        return true;
      }
      if (node && node.length && u.editableCaretAtEnd(node)) {
        var next = node.nextElementSibling;
        if (next != null && next.hasClass('item-figure') && !next.hasClass('figure-in-row')) {
          this.personal_toolbar.removeFigure(next);
          e.preventDefault();
          this.current_editor.image_toolbar.hide();
          u.setCaretAtPosition(node, node.textContent.length);
          return true;
        }
      }
      return false;
    };

    Images.prototype.embedParagraphAboveImage = function(figure) {
      var cont = figure.closest('.block-content-inner'),
          self = this,
          p = null,
        createAndAddContainer = function(before) {
          var div = u.generateElement(self.current_editor.getSingleLayoutTempalte());
          p = u.generateElement(self.current_editor.baseParagraphTmpl());
          div.appendChild(p);
          before.parentNode.insertBefore(div, before);
        };

      if(cont != null) {
        if (cont.hasClass('center-column')) { // just embed a paragraph above it
          p = u.generateElement(this.current_editor.baseParagraphTmpl());
          figure.parentNode.insertBefore(p, figure);
        } else if(cont.hasClass('full-width-column')) {
          var figures = cont.querySelectorAll('.item-figure');
          if (figures.length == 1) {
            createAndAddContainer(cont);
          }else {
            var bottomContainer = u.generateElement(`<div class="block-content-inner full-width-column"></div>`);
            while(figure.nextElementSibling != null) {
              bottomContainer.appendChild(figure.nextElementSibling);
            }
            u.prependNode(figure, bottomContainer);
            bottomContainer.insertAfter(cont);
            createAndAddContainer(bottomContainer);
          }
        }
      }

      this.current_editor.mergeInnerSections(figure.closest('section'));

      if(p != null) {
        self.current_editor.image_toolbar.hide();
        self.current_editor.markAsSelected(p);
        self.current_editor.setRangeAt(document.querySelector('.item-selected'));
      }
      
    };

    Images.prototype.handleEnterKey = function(e, node) {
      var figure = document.querySelector('.figure-focused');
      if (figure != null && figure.hasClass('item-figure')) {
        e.preventDefault();
        this.embedParagraphAboveImage(figure);
        return true;
      }
      return true;
    };

    return Images;

  })(Katana.Content);
}).call(this);
/** for the content section button **/
(function () {
  var u = Katana.utils;

  Katana.Content.Section = (function (_super) {
    u.__extends(Section, _super);

    function Section() {
      this.initialize = u.__bind(this.initialize, this);

      this.handleEnterKey = u.__bind(this.handleEnterKey, this);
      this.handleBackspaceKey = u.__bind(this.handleBackspaceKey, this);
      this.handleDeleteKey = u.__bind(this.handleDeleteKey, this);

      this.template = u.__bind(this.template, this);

      return Section.__super__.constructor.apply(this, arguments);
    }

    Section.prototype.contentId = 'SECTION';

    Section.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.icon = 'mfi-hyphens';
      this.title = 'section';
      this.action = 'section';
      this.editorType = opts.editorType || 'blog';

      this.publicationMode = this.editorType == 'publication' ? true : false;
      this.current_editor = opts.editor;
    };


    Section.prototype.template = function () {
      var t = function (title, action, icon) {
        return "<button class='inlineTooltip-button scale' title='" + title + "' data-action='inline-menu-" + action + "' data-action-value='"+ action+"' > <span class='tooltip-icon " + icon + "'></span> </button>";
      };
      var b = this;
      if (this.editorType == 'publication') {
        var ht = '';
        ht = t(this.title, this.action, this.icon);
        ht = ht + t('Stories', 'section-stories', 'mfi-grid-icon');
        return ht;
      }

      return t(this.title, this.action, this.icon);
    };

    Section.prototype.handleClick = function (ev) {
      var target = ev.currentTarget;

      var toolTipContainer = target.closest('.inlineContentOptions');
      var actionValue = target.attr('data-action-value');
      var storiesSection = false;
      if (this.publicationMode) {
        if (actionValue == 'section' && !toolTipContainer.hasClass('choose-section')) { // show other options
          toolTipContainer.addClass('choose-section');
          return false;
        } else if(actionValue == 'section-stories' && toolTipContainer.hasClass('choose-section')) { // make a section
          storiesSection = true;
        }   
      }
      
      var anchor_node = this.current_editor.getNode();
      if(anchor_node == null) {
        anchor_node = document.querySelectorAll('.item-selected');
      }
      if (anchor_node != null) {
        this.splitContainer(anchor_node, storiesSection);
        this.current_editor.content_bar.hide();
        return true;
      }
      return false;
    };

    Section.prototype.handleDeleteKey = function (e, node) {
      var sect, cont, last;
      if (this.current_editor.isLastChar()) {
        sect = $node.closest('.block-content');
        if (sect != null && !sect.hasClass('block-last')) {
          cont = node.closest('.block-content-inner');
          if(cont != null) {
            last = cont.querySelector('.item:last-child');
            if (last != null && last.attr('name') == node.attr('name')) {
              e.preventDefault();
              this.current_editor.mergeWithUpperSection(sect.next('.block-content'));
              return true;
            }
          }
        }
      }
      return true;
    };

    Section.prototype.handleBackspaceKey = function (e, node) {
      var sect,
          cont,
          first;
      if (this.current_editor.isFirstChar() && node) {
        sect = node.closest('.block-content');
        if(sect != null && !sect.hasClass('block-first')) {
          var cont = node.closest('.block-content-inner');
            if(cont != null) {
              first = cont.querySelector('.item:first-child');
              if (first != null && first.attr('name') == node.attr('name')) {
                this.current_editor.mergeWithUpperSection(sect);
                if (node != null) {
                  this.current_editor.setRangeAt(node);  
                  e.preventDefault();
                  if (!node.hasClass('.item-figure')) {
                    u.setCaretAtPosition(node);  
                    this.current_editor.markAsSelected(node);
                  }
                }  else {
                  console.log('node empty');
                }
                return true;
              }
            }          
        }
      } else {
        var sect = document.querySelector('.figure-focused.with-background');
        if (sect != null) {
          var sel = this.current_editor.selection();
          if (sel && sel.type == 'Caret') {
            var anchorNode = sel.anchorNode;
            if (anchorNode.hasClass('block-background')) {
              e.preventDefault();
              this.convertBackgroundSectionToPlain(anchorNode);
              return true;
            }
          } else if(sel && sel.type == 'None') {
            var anchorNode = sel.anchorNode;
            if (anchorNode.hasClass('block-background')) {
              e.preventDefault();
              this.convertBackgroundSectionToPlain(anchorNode);
              return true;
            }
          }
        }
      }
      return false;
    };

    Section.prototype.convertBackgroundSectionToPlain = function (node) {
      var sect = node.closest('.block-content');
      if(sect != null) {
        var newContainer = u.generateElement(this.current_editor.getSingleSectionTemplate());
        var currentBody = sect.querySelector('.main-body');
        if(newContainer != null) {
          var newContainerBody = newContainer.querySelector('.main-body');
          currentBody.parentNode.replaceChild(newContainerBody, currentBody);
          sect.parentNode.replaceChild(newContainer, sect);
          this.current_editor.removeUnnecessarySections();
          this.current_editor.cleanUpInnerSections();
          this.current_editor.fixSectionClasses();
        }
      }
    }

    Section.prototype.handleEnterKey = function (e, node) {
      var prev = node.previousElementSibling,
          onePrev = prev != null ? prev.previousElementSibling : null;
      if (e.ctrlKey) { // 
        if (node.querySelector('.placeholder-text') == null) {
          this.splitContainer(node);
          this.current_editor.content_bar.hide();
          e.handled = true;
          u.setCaretAtPosition(node[0]);
          this.current_editor.markAsSelected(node);
          this.current_editor.scrollTo(node);
        }
      }
      return false;
    };

    Section.prototype.fillPreview = function (container, count) {
      if (typeof count == 'undefined') {
        count = 6;
      }
      this.current_editor.fillStoryPreview(container, count);
    };

    Section.prototype.handlePreviousStoryTypeOptionsAfterAddition = function (newContainer) { 
      var stype = newContainer.querySelector('[data-for="storytype"]');
      if (stype != null) {
        var stval = stype.value;
        if (stval == 'tagged') {
          // no issue just return from here
          return;
        }

        var others = this.current_editor.elNode.querySelectorAll('.block-stories [data-for="storytype"]');

        for (var i = 0; i < others.length; i = i + 1) {
          var ot = others[i];
          if (ot == stype) {
            continue;
          }
          var curral = ot.value;
          var opts = ot.querySelectorAll('option');
          if (opts.length) {
            for (var m = 0; m < opts.length; m = m + 1) {
              var kopts = $(opts[m]);
              if (kopts.attr('value') == stval && stval != curral) {
                kopts.parentNode.removeChild(kopts);
              }
            }
          }
        }
      }
    };

    Section.prototype.splitContainer = function (atNode, storiesSection) {
      var newContainer;
      if (typeof storiesSection != 'undefined' && storiesSection) {
        newContainer = u.generateElement(this.current_editor.getSingleStorySectionTemplate());
      } else {
        newContainer = u.generateElement(this.current_editor.getSingleSectionTemplate());
      } 
      
      this.current_editor.splitContainer(atNode);

      if (this.publicationMode && storiesSection) {
        if (atNode != null) {
          var sec = atNode.closest('.block-content');
          if(sec != null) {
            newContainer.insertBefore(sec);
          }
          var ac = newContainer.querySelector('.autocomplete');
          if(ac != null) {
            $(ac).autocomplete();
            if(ac.closest('.autocomplete-buttons') != null) {
              ac.closest('.autocomplete-buttons').addClass('hide');
            }
          }
        }

        this.fillPreview(newContainer.querySelector('.main-body'), 6);
        this.handlePreviousStoryTypeOptionsAfterAddition(newContainer);
      }

      if (atNode.nextElementSibling != null && atNode.textContent.isEmpty()) {
        var next = atNode.nextElementSibling;
        this.current_editor.setRangeAt(next);
        if (!next.hasClass('item-figure')) {
          u.setCaretAtPosition(next);
          this.current_editor.markAsSelected(atNode);
        }
        atNode.parentNode.removeChild(atNode);
      } else if(atNode.nextElementSibling == null) {
        this.current_editor.setRangeAt(atNode);
        u.setCaretAtPosition(atNode);
        this.current_editor.markAsSelected(atNode);
      }
    };

    // commands when in publication mode
    Section.prototype.command = function (action, button) {
      var section = button.closest('.block-stories');
      if (section == null) {
        section = button.closest('.block-content');
      }
      if(section == null) {
        return;
      }
      switch (action) {
        case 'center-width':
          this.commandCenterWidth(section);
        break;
        case 'add-width':
          this.commandAddWidth(section);
          break;
        case 'full-width':
          this.commandFullWidth(section);
        break;
        case 'remove-block':
          this.commandRemoveBlock(section);
        break;
        case 'image-side':
          this.commandStructureImageList(section);
        break;
        case 'image-grid':
          this.commandStructureGrid(section);
        break;
        case 'list-view':
          this.commandStructureListView(section);
        break;
      }
    };

    Section.prototype.removeStructureClasses = function (section) {
      section.removeClass('as-list');
      section.removeClass('as-image-grid');
      section.removeClass('as-image-list');
    };

    Section.prototype.commandStructureGrid = function (section) {
      this.removeStructureClasses(section);
      section.addClass('as-image-grid');
    };

    Section.prototype.commandStructureImageList = function (section) {
      this.removeStructureClasses(section);
      section.addClass('as-image-list');
    };

    Section.prototype.commandStructureListView = function (section) {
      this.removeStructureClasses(section);
      section.addClass('as-list');
    };

    Section.prototype.removeLayoutClasses = function (section) {
      section.removeClass('block-full-width');
      section.removeClass('block-center-width');
      section.removeClass('block-add-width');
    };

    Section.prototype.mightAdjustFigures = function (section) {
      var figs = section.querySelectorAll('.item-figure:not(.figure-in-row)');
      figs.forEach((item) => {

        setTimeout( () => {
          const cm = new CustomEvent('Mizuchi.Images.Refit', {type: 'Mizuchi.Images.Refit',
          figure: item});
          this.current_editor.elNode.dispatchEvent(cm);
        }, 250);
        
      });
    };

    Section.prototype.commandCenterWidth = function (section) {
      this.removeLayoutClasses(section);
      section.addClass('block-center-width');
      this.mightAdjustFigures(section);
    };

    Section.prototype.commandAddWidth = function (section) {
      this.removeLayoutClasses(section);
      section.addClass('block-add-width');
      this.mightAdjustFigures(section);
    }

    Section.prototype.commandFullWidth = function (section) {
      this.removeLayoutClasses(section);
      section.addClass('block-full-width');
      this.mightAdjustFigures(section);
    };

    Section.prototype.commandRemoveBlock = function (section) {
      var needRefresh = section.hasClass('block-stories');
      var val = '';
      if (needRefresh) {
        val = section.querySelector('[data-for="storytype"]').value;
        if (val == 'tagged') {
          val = '';
        }
      }

      if (section.next('section') == null && section.prev('section') == null) {
        section.parentNode.removeChild(section);
        this.current_editor.handleCompleteDeletion();
      } else {
        section.parentNode.removeChild(section);
      }

      if (this.current_editor.elNode.querySelector('.block-content') == null) {
        this.current_editor.appendTextSection();
      }

      this.current_editor.fixSectionClasses();

      if (needRefresh) {
        this.current_editor.refreshStoriesMenus(val);
      }

    };

    return Section;
  })(Katana.Content);
}).call(this);

(function () {
  var u = Katana.utils;

  Katana.Content.Video = (function (_super) {
    u.__extends(Video, _super);

    function Video() {
      this.handleClick = u.__bind(this.handleClick, this);
      this.initialize = u.__bind(this.initialize, this);
      this.getEmbedFromNode = u.__bind(this.getEmbedFromNode, this);
      return Video.__super__.constructor.apply(this, arguments);
    }

    Video.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.icon = opts.icon || "mfi-video";
      this.title = opts.title || "Add a video";
      this.action = opts.action || "video";
      return this.current_editor = opts.editor;
    };

    Video.prototype.contentId = 'VIDEO';

    Video.prototype.handleClick = function (ev) {
      return this.displayEmbedPlaceHolder(ev);
    };
    Video.prototype.isYoutubeLink = function (url) {
      var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
      var m = url.match(p);
      if (url.match(p)) {
        return m[0]
      }
      return false;
    }
    Video.prototype.handleEnterKey = function(ev, $node) {
      if ($node.hasClass("is-embedable")) {
        return this.getEmbedFromNode($node);
      } else {
        var text = $node.textContent;
        texts = text.split(' ');
        if (texts.length == 1) {
          var validLink = this.isYoutubeLink(texts[0]);
          if (validLink) {
            return this.getEmbedFromNode($node, validLink);
          }
        }
      }
    };

    Video.prototype.hide = function () {
      this.current_editor.content_bar.hide();
    };  

    Video.prototype.uploadExistentIframe = function (iframe) {
      var src = iframe.attr('src')
      if (src) {
        if(u.urlIsFromDomain(src, 'youtube.com') || u.urlIsFromDomain(src, 'vimeo.com')) {
          this.loadEmbedDetailsFromServer(src, $iframe, function (node) {

            while (!(node.parentNode != null && node.parentNode.hasClass('block-content-inner'))) {
              node.unwrap();
            }

            // while(!$node.parent().hasClass('block-content-inner')) {
            //   $node.unwrap();
            // }      
          });
        }
      }
    };

    Video.prototype.displayEmbedPlaceHolder = function() {
      let ph = this.current_editor.embed_placeholder;
      this.node = this.current_editor.getNode();
      this.node.innerHTML = ph;
      this.node.addClass("is-embedable");
      this.current_editor.setRangeAt(this.node);
      this.hide();
      return false;
    };

    Video.prototype.loadEmbedDetailsFromServer = function (url, current_node, callback) {
      url = encodeURIComponent(url);
      url = url + '&luxe=1';

      this.current_editor.currentRequestCount++;
      $.ajax({
        url: '/embed-url',
        method: 'post',
        dataType: 'json',
        data: {url : url},
        success: (function (_this) {
          return function (resp) {
            _this.current_editor.currentRequestCount--;
            if (resp.success) {
              var dt = resp.data;
              if (dt.video) {
                _this.embedFramePlaceholder(dt, current_node, callback);
              }
            }
          };
        })(this),
        error: (function (_this) {
          return function (jqxhr) {
            _this.current_editor.currentRequestCount--;
          }
        })(this)
      });
    };

    Video.prototype.embedFramePlaceholder = function (ob, current_node, callback) {
      var thumb = ob.thumbUrl,
          frameUrl = ob.frameUrl,
          captionTitle = ob.captionTitle,
          captionHref = ob.captionHref,
          aspectRatio = ob.aspect,
          canGoBackground = ob.fs;

      if (thumb != '') {
        var figure = u.generateElement(this.current_editor.getFrameTemplate()),
            _this = this,
            src = thumb,
            img = new Image();
        img.src = src;
        img.onload = function() {
          var ar;
          ar = _this.getAspectRatio(this.width, this.height);
          const pdc = figure.querySelector('.padding-cont'),
                fim = figure.querySelector('.item-image'),
                fpb = figure.querySelector('.padding-box');

          if(pdc != null) {
            pdc.css({
              'max-width': ar.width,
              'max-height': ar.height
            });
          }
          if(fim != null) {
            fim.attr("data-height", this.height);
            fim.attr("data-width", this.width);
          }
          
          const fpdb = figure.querySelector('.padding-box');
          if(fpdb != null) {
            fpdb.style.paddingBotom = ar.ratio + "%"
          }
        
          if (this.width < 700) {
            figure.addClass('n-fullSize');
          }

          var $ig = figure.querySelector('img');
          if($ig != null) {
            $ig.attr("src", src);
            $ig.attr('data-frame-url', frameUrl);
            $ig.attr('data-frame-aspect', aspectRatio);
            $ig.attr('data-image-id', ob.embedId);
          }

          if (canGoBackground) {
            figure.addClass('can-go-background');
          }
          
          figure.insertBefore(current_node);
          current_node.parentNode.removeChild(current_node);
          // current_node.replaceWith(figure);

          var caption = figure.querySelector('figcaption');
          if (caption != null) {
            var capth = ' <a rel="nofollow" class="markup--anchor markup--figure-anchor" data-href="' + captionHref + '" href="' + captionHref + '" target="_blank">Watch Video here.</a>',
                lastChar;
            if (captionTitle != '') {
              captionTitle = captionTitle.trim();
              lastChar = captionTitle.charAt(captionTitle.length -1);
              if (lastChar != '.') {
                captionTitle = captionTitle + '.';
              }
              capth = captionTitle + capth;
            }
            caption.innerHTML = capth;
            figure.removeClass('item-text-default');
          }

          if (typeof callback != 'undefined') {
            callback(figure);
          }

          _this.current_editor.selectFigure(figure);
        };
      }
    };

    Video.prototype.getEmbedFromNode = function(node, extractedUrl) {
      this.node = node;
      this.node_name = this.node.attr("name");
      this.node.addClass("loading-embed");
      this.node.attr('contenteditable','false');
      this.node.appendChild(u.generateElement('<i class="loader small dark"></i>'));

      var url = typeof extractedUrl != 'undefined' ? extractedUrl : this.node.textContent, 
          canGoBackground = false;

      if (url.indexOf('vimeo') != -1) {
        url = url + '?badge=0&byline=0&portrait=0&title=0';
        canGoBackground = true;
      }else if (url.indexOf('youtube') != -1){
        url = url;
        canGoBackground = true;
      }

      url = url + '&luxe=1';
      this.loadEmbedDetailsFromServer(url, node);
    };


    Video.prototype.getAspectRatio = function (w, h) {
      var fill_ratio, height, maxHeight, maxWidth, ratio, result, width;
      maxWidth = 760;
      maxHeight = 700;
      ratio = 0;
      width = w;
      height = h;

      if (w < maxWidth) {
        width = maxWidth;
        var fr = w/h;
        height = width / fr;
      }

      if (width > maxWidth) {
        ratio = maxWidth / width;
        height = height * ratio;
        width = width * ratio;
      } else if (height > maxHeight) {
        ratio = maxHeight / height;
        width = width * ratio;
        height = height * ratio;
      }
      fill_ratio = height / width * 100;
      result = {
        width: width,
        height: height,
        ratio: fill_ratio
      };
      
      return result;
    };

    return Video;
  })(Katana.Content);
}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Model = (function () {
    function Model() {
      var opts = arguments.length ? arguments[0] : {};    
      this.factory = opts.factory;

      this.contentTags = ['h1','h2','h3','h4','h5','h6','p','pre','blockquote','li', 'figcaption'];
      this.markupTags = ['a','b','strong','u','i','em','cite'];
      
    }

    Model.prototype.readMarkups = function (element) {
      if (typeof jQuery === "function" && element instanceof jQuery) {
        element = element[0];
      }
      var original = element,
          workingCopy = original.cloneNode(true),
          textContent = workingCopy.textContent,
          markups = [];

      const workOnChildren = (el) => {
        var children = el.childNodes;
        for (var i = 0; i < children.length; i = i + 1) {
          var node = children[i];

          if (node.nodeType == Node.ELEMENT_NODE) {
            var tagName = node.nodeName.toLowerCase();

            if (this.markupTags.indexOf(tagName) != -1) {
              tagName = tagName == 'b' ? 'strong' : tagName;
              tagName = tagName == 'i' ? 'em' : tagName;

              var o = {};
              o.tag = tagName;
              if(o.tag == 'a') {
                o.href = node.attr('href');
              }
              o.position = this.findPositionInElement(node, original);
              markups.push(o);
            }
            workOnChildren(node);
          }
        }
      };

      workOnChildren(element);

      return markups;
    };

    Model.prototype.findPositionInElement = function (positionOf, inElement) {
      var baseElement = positionOf;

      while(baseElement.parentNode != inElement) {
        baseElement = baseElement.parentNode;
      }

      var childNodes = inElement.childNodes, start, end , textSoFar = 0;
      for (var i = 0; i < childNodes.length; i = i + 1) {
        var node = childNodes[i];
        if (baseElement != node) {
          if (node.nodeType == Node.ELEMENT_NODE) {
            textSoFar += node.textContent.length;
          }else if(node.nodeType == Node.TEXT_NODE) {
            textSoFar += node.nodeValue.length;
          }
        }else {
          break;
        }
      }
      start = textSoFar;
      end = start + positionOf.textContent.length;
      return {start: start, end: end};
    };

    return Model;
  })();
}).call(this);
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
(function () {
  var u = Katana.utils;

  Katana.Model.Item = (function (_super) {
    u.__extends(Item, _super);

    function Item() {

      return Item.__super__.constructor.apply(this, arguments);
    }

    Item.prototype.getType = function (element) {
      var tagName = element.tagName.toLowerCase();
      if ( this.contentTags.indexOf(tagName) != -1)  {
        return 10;
      } else {
        return 11;
      }
    };

    Item.prototype.build = function (element, index, sectionName) {
      var ob = {};
      this.elNode = element;
      this.index = index;
      ob.type = this.getType(element);
      ob.name = this.elNode.attr('name');
      ob.index = this.index;
      ob.section = sectionName;
      ob.tag = this.elNode.tagName.toLowerCase();

      if (ob.type == 10) {
        if (this.elNode.querySelectorAll('.placeholder-text').length) {
          ob.empty = true;
        } else if (ob.tag == 'li') {
          ob.text = this.elNode.textContent;
          ob.markups = this.readMarkups(this.elNode);
          this.buildList(this.elNode, ob);
        } else {
          ob.text = this.elNode.textContent;  
          ob.markups = this.readMarkups(this.elNode);
          if (this.elNode.hasClass('text-center')) {
            ob.center = this.elNode.hasClass('text-center');
          }

          if (this.elNode.hasClass('pullquote')) {
            ob.quote = true;
            if (this.elNode.hasClass('with-cite')) {
              ob.citation = true;
            }
          }
        }        
      }else if (ob.type == 11) {
        if (ob.tag == 'figure') {
          this.buildFigure(this.elNode, ob);
        } 
      }

      this.factory.addTo[ob.name] = ob;

    };

    Item.prototype.buildFigure = function (element, ob) {
      if (element && element.hasClass('item-text-default')) {
        ob.text = '';
        ob.empty = true;
      } else {
        var caption = element.querySelector('figcaption');
        if (caption != null && caption.querySelector('.placeholder-text') != null) {
          ob.empty = true;
        }else {
          ob.text = caption.textContent;
          ob.markups = this.readMarkups(caption);  
        }
      }

      var meta = {};
      var img = element.querySelector('img');

      if(img != null) {
        meta.resourceId = img.attr('data-image-id');
        meta.resourceUrl = img.attr('data-delayed-src');
        const pboxStyle = element.querySelector('.padding-box') != null ? element.querySelector('.padding-box').attr('style') : '';
        meta.resourceMarkup = {
          w: img.attr('data-width'), 
          h: img.attr('data-height'),
          a: pboxStyle
        };
      } else {
        meta.resourceMarkup = {};
      }

      if(element.hasClass('figure-to-left')) {
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('style') : '';
        meta.pos = 0;
      }else if(element.hasClass('figure-full-width')){
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('data-style') : '';
        meta.pos = 2;
      }else if (element.hasClass('figure-in-row')) {
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('style') : '';
        meta.pos = 3;
        var st = element.attr('style') ? element.attr('style') : '';
        meta.width = st.replace('width:','').replace('%','').replace(';','');
      }else {
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('style') : '';
        meta.pos = 1;
      }

      if (element.hasClass('figure-in-row')) {
        var inner = element.closest('.block-content-inner');
        meta.partial = inner.attr('data-name');
        meta.count = inner.attr('data-paragraph-count');
        var row = element.closest('.block-grid-row');
        meta.grid = -1;

        var first = inner.querySelector('.block-grid-row:first-child .item-figure:first-child');
        if (first != null && first == element) {
          var gridCaption = inner.querySelector('.block-grid-caption');
          if (gridCaption != null && gridCaption.querySelector('.placeholder-text') == null) {
            ob.text = gridCaption.textContent;
            ob.markups = this.readMarkups(gridCaption);
            ob.empty = false;
          }
        }

        if (inner.hasClass('block-grid-full')) {
          meta.grid = 2;
        } else if(inner.hasClass('block-grid-center')) {
          meta.grid = 0;
        }

        if (row.length) {
          meta.row = row.attr('data-name');
          meta.rowElementCount = row.attr('data-paragraph-count');
        }

      }else {
        meta.partial = false;
      }

      if (element.hasClass('item-figure') && !element.hasClass('item-iframe')) {
        ob.type = 12;
      }else if(element.hasClass('item-iframe')) {
        ob.type = 13;
        meta.resourceFrame = img.attr('data-frame-url');
        meta.resourceAspect = img.attr('data-frame-aspect');
        meta.resourceUrl = img.attr('src');
        if (element.hasClass('can-go-background')) {
          meta.allowbg = true;
        }else {
          meta.allowbg = false;
        }
      }

      if (img != null && img.parentNode.hasClass('markup-anchor')) {
        meta.link = img.parentNode.attr('href');
      }else {
        meta.link = false;
      }

      ob.meta = meta;

    };

    Item.prototype.buildList = function (element, ob) {
      var prnt = element.closest('.postList'),
          prntTag = prnt != null ? prnt.tagName.toLowerCase() : null;

      if(prntTag == 'ul') {
        ob.type = 14;
      }else if(prntTag == 'ol') {
        ob.type = 15;
      }

      if(prnt.length) {
        if(prnt.attr('type')) {
          ob.listType = prnt.attr('type');
        }
      }
    };

    return Item;
  })(Katana.Model);

}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Model.Section = (function (_super) {
    u.__extends(Section, _super);

    function Section() {
      this.build = u.__bind(this.build, this);
      return Section.__super__.constructor.apply(this, arguments);
    }

    Section.prototype.handleSelf = function () {
      var name = this.elNode.attr('name'),
          ob = {},
          grounded,
          markup;
      ob.name = name;
      ob.index = this.index;
      ob.type = 0;

      if (this.elNode.hasClass('block-add-width')) {
        ob.width = 'add';
      }

      if (this.elNode.hasClass('with-background')) {
        grounded = this.elNode.querySelector('.block-background');
        ob.type = 1;
        markup = {};

        if (this.elNode.hasClass('talk-to-canvas')) {
          markup.canvas = true;
        }

        if (grounded != null) {
          markup.resourceId = grounded.attr('data-image-id');
          markup.resourceType = 'image';
          markup.resourceMarkup = { w: grounded.attr('data-width'), h: grounded.attr('data-height'), a: grounded.attr('data-aspect'), s: grounded.attr('data-style') };  
        }

        var bgImage = this.elNode.querySelector('.block-background-image');
        if(bgImage != null) {
          var path = u.getStyle(bgImage, 'backgroundImage');
          path = /^url\((['"]?)(.*)\1\)$/.exec(path);
          path = path ? path[2] : '';

          if (this.elNode.hasClass('video-in-background')) {
            markup.resourceFrame = bgImage.attr('data-frame-url');
            markup.resourceAspect = bgImage.attr('data-frame-aspect');
            ob.type = 2;
          } 
  
          markup.resourceUrl = path;
        }
      
        ob.meta = markup;
        var caption = this.elNode.querySelector('.section-caption');
        if (caption != null) {
          if (caption.querySelector('.placeholder-text') != null) {
            ob.caption = {empty:true};
          }else {
            ob.caption = {};
            ob.caption.text = caption.textContent;
            ob.caption.markups = this.readMarkups(caption);  
          }
        }
      }else if(this.elNode.hasClass('block-stories')) {
        ob.type = 5;
        markup = {};
        var storyType = this.elNode.querySelector('[data-for="storytype"]'),
            storyCount = this.elNode.attr('data-story-count');

        if(storyType != null) {
          markup.storyType = storyType.value;
        }

        if (markup.storyType == 'tagged') {
          var auto = this.elNode.querySelector('.autocomplete');
          if(auto != null) {
            var tagData = $(auto).autocomplete('read');
            markup.storyTag = tagData;
          }
        }

        if (!storyCount) {
          storyCount = 6;
        }

        storyCount = parseInt(storyCount);
        if (isNaN(storyCount) || storyCount > 10) {
          storyCount = 6;
        }

        markup.storyCount = storyCount;

        if (this.elNode.hasClass('as-list')) {
          markup.list = 'list';
        } else if (this.elNode.hasClass('as-image-list')) {
          markup.list = 'image-list';
        } else if (this.elNode.hasClass('as-image-grid')) {
          markup.list = 'image-grid';
        }

        if (this.elNode.hasClass('block-center-width')) {
          ob.width = 'center';
        } else if(this.elNode.hasClass('block-add-width')) {
          ob.width = 'add';
        } else if(this.elNode.hasClass('block-full-width')) {
          ob.width = 'full';
        }
        ob.meta = markup;
      }

      this.factory.addTo[name] = ob;
    };

    Section.prototype.build = function (element, index) {
      this.elNode = element;
      this.index = index;
      var sectionName = this.elNode.attr('name');
      this.handleSelf();

      var layouts = this.elNode.querySelectorAll('.main-body .block-content-inner'),
          i = 0,
          layout;
          childCount = 0;
      for (; i < layouts.length; i = i + 1) {
        layout = layouts[i];
        var items = layout.querySelectorAll('.item'),
            serializer = this.factory.getSerializer('item');
        if (items.length == 0) {
          layout.parentNode.removeChild(layout);
        }
        for (var k = 0; k < items.length; k = k + 1) {
          serializer.build(items[k], childCount + k, sectionName);
        }
        childCount = childCount + items.length;
      }
      
    };

    return Section;
  })(Katana.Model);
}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Notes = (function (_super) {
    u.__extends(Notes, _super);

    function Notes() {
      this.handleMouseOver = u.__bind(this.handleMouseOver, this);
      this.handleNoteIconClick = u.__bind(this.handleNoteIconClick, this);

      this.incrementCounter = u.__bind(this.incrementCounter, this);
      this.decrementCounter = u.__bind(this.decrementCounter, this);

      return Notes.__super__.constructor.apply(this, arguments);
    }

    Notes.prototype.el = '#notes_container';

    Notes.prototype.initialize = function (opts) {
      var _this = this;
      if (opts == null) {
        opts = {};
      }

      this.current_editor = opts.editor;

      opts.icon = this;

      this.detailsHandler = new Katana.Notes.Details(opts);
      this.options = opts;
      this.existing_notes = opts.currentNotes || [];
      this.$el = $(this.el);
      this.layout = opts.layout || 'side';

      this.commentsCloserElement.on('click', function () {
        _this.detailsHandler.closePreviousBox();
        _this.deactivateAll();          
      });

      var w = ('innerWidth' in window) ? window.innerWidth : $(window).width();
      this.smallScreen = w <= 480 ? true : false;
      var layoutWidth = $('.center-column').width();
      var cen = (w - layoutWidth) / 2,
          tot = (cen + layoutWidth + 355);
      this.llShift = false;
      if (tot > w) {
        this.llShift = false;
        $('body').addClass('notes-ll-shift');
      }

      this.readNotes();
    };

    Notes.prototype.events = {
      'click .note-icon' :  'handleNoteIconClick'
    };

    Notes.prototype.readNotes = function () {
      var read_url = this.options.info.read_url + '/' + this.options.info.story.id;
      $.ajax({
        url : read_url,
        type: 'GET',
        dataType: 'json',
        success: (function (_this) {
          return function (resp) {
            _this.parseNotes(resp);
          }
        })(this),
        error: (function (_this) {
          return function (jqxhr) {

          }
        })(this)
      });
    };

    Notes.prototype.parseNotes = function (data) {
      if (data && data.success) {
        var dt, notes = [];

        dt = data.data;

        var pieces = {};
        if (dt.notes) {
          notes = dt.notes;
          for (var i = 0; i < notes.length;i = i + 1) {
            pieces[notes[i].piece] = notes[i].count;
          }
        }
        
        this.existing_notes = pieces;
        this.refresh();
      }
    };

    /** EVENTs handlers **/
    Notes.prototype.handleNoteIconClick = function (ev) {
      var currentHovered = ev.currentTarget,
          name;

      if (currentHovered && currentHovered.nodeType == 1) {
        name = currentHovered.attr('note-for');
        against = $('[name="' + name + '"]');
        if (against.length) {
          this.deactivateAll();
          var _this = this;
          var $curr = $(currentHovered);
          $('body').addClass('notes-opened');
          $curr.addClass('is-clicked');

          if (!_this.smallScreen) {

            setTimeout(function () {
              _this.repositionIcon($curr, against);
              _this.activateCloser(against);
              _this.detailsHandler.showDetailsFor(name, $curr );
            }, 300);

            // $curr.animate({left: '-=160'}, 200, function () {
            //   _this.activateCloser($curr); 
              
            // });  
          } else {
            _this.activateCloser(against); 
            _this.detailsHandler.showDetailsFor(name, $curr );
          }
        }
      }

    };

    Notes.prototype.commentsCloserElement = document.querySelector('#comments_closer');

    Notes.prototype.activateCloser = function(against) {
      this.commentsCloserElement.addClass('active');
      var w = $(window).width();
      var o = against.offset().left + against.width();
      this.commentsCloserElement.css({right: (w - o) + 'px'});
    };

    Notes.prototype.deactivateCloser = function() {
      this.commentsCloserElement.removeClass('active');
      $('body').removeClass('notes-opened');
    };

    Notes.prototype.deactivateAll = function () {
      var clicked = this.$el.querySelectorAll(".is-clicked");
      if (clicked.length) {
        clicked.removeClass('is-clicked').addClass('hide');
        var _this = this;
        setTimeout(function () {
          _this.repositionIcon(clicked, undefined);
        }, 240);
      }
      this.deactivateCloser();
    };

    Notes.prototype.hidePreviousVisible = function () {
      let nics = this.$el.querySelector('.note-icon.empty:not(.is-clicked)');
      if(nics != null) {
        nics.removeClass('is-active');
      }
      this.deactivateCloser();
    };

    Notes.prototype.showNoteIcon = function (ob) {
      var noteIcon = this._getNoteIcon(ob);
      noteIcon.addClass('is-active');
      if (ob.selection != null) {
        var range,
          selection = ob.selection;
        if (selection.getRangeAt) {
          range = selection.getRangeAt(0);
        } else {
          range = selection[0];
        }
      }
    };

    Notes.prototype._getNoteIcon = function (ob) {
      var name = ob.node.attr('name'),
          $node = ob.node,
          onDark = false;

      if ($node.closest('.with-background') != null) {
        onDark = true;
      }
      var existing = this.$el.querySelector('[note-for="' + name + '"]');

      if (existing ==  null) {
        if (typeof this.existing_notes[name] == 'undefined') {
          existing = this._addIcon(name, 0);  
        } else {
          existing = this._addIcon(name, this.existing_notes[name]);
        }
      }

      if(onDark) {
        existing.addClass('on-dark');
      } else {
        existing.removeClass('on-dark');
      }

      this.positionIcon(existing, $node, ob.show);
      return existing;
    };

    Notes.prototype.calculateIconPosition = function (against) {
      var aoffset = against.offset();
      var top = aoffset.top,
          left = aoffset.left + against.width() + 5;
      if (this.smallScreen) {
        if (left < 790) {
          left = 800;
        }  
      }

      if (against.hasClass('item-h2')) {
        top += 20;
      } else if(against.hasClass('item-blockquote')) {
        left += 42;
      }

      return {
        left: left,
        top: top
      };
    };

    Notes.prototype.repositionIcon = function (icon, against) {
      var name = icon.attr('note-for');
      var ag;
      if (typeof against != 'undefined') {
        ag = against;
      }else {
        ag = $('[name="'+name+'"]');
      } 
      if (ag.length) {
        var pos = this.calculateIconPosition(ag);
        const st = icon.style;
        st.left = pos.left + 'px';
        st.top = pos.top + 'px';
        st.position = 'absolute';
        //icon.css({left: pos.left, top : pos.top , position: 'absolute'});  
        setTimeout(function () {
          icon.removeClass('hide');
        },100);
      }
    };

    Notes.prototype.positionIcon = function (icon, against, show) {
      if (against.length) {
        if (this.smallScreen) {
          //icon.addClass('open');
          $('.item-clicked').removeClass('item-clicked');
          if (typeof show != 'undefined' && show) {
            this.$el.removeClass('open');
            var _this = this;
            setTimeout(function () {
              _this.$el.addClass('open');  
            }, 200);
          } else {
            this.$el.removeClass('open');
          }
          
          icon.addClass('item-clicked');
          //icon.css({left:0, top:0, position:'absolute'});
        } else {
          var pos = this.calculateIconPosition(against);
          const ist = icon.style;
          ist.left = pos.left + 'px';
          ist.top = pos.top + 'px';
          ist.position = 'absolute';
          //icon.css({left: pos.left, top : pos.top , position: 'absolute'});  
        }
      }
    };

    Notes.prototype.getIconTemplate = function () {
      var ht = `<div class="notes-marker-container note-icon empty">
      <span class="notes-counter" data-note-count=""></span>
      <i class="mfi-comment"></i>
      </div>`;
      return u.generateElement(ht);
    };

    Notes.prototype._addIcon = function (name, currentCount) {
      var icon = this.getIconTemplate();
      var iconSpan = icon.querySelector('.notes-counter');
      if (currentCount > 0) {
        icon.removeClass('empty');
        iconSpan.text(currentCount);
        iconSpan.attr('data-note-count', currentCount);
      }
      icon.attr('note-for', name);
      this.$el.append(icon);
      return icon;
    };

    /** event handlers end **/

    Notes.prototype.init = function () {
      var _this = this;
      this.current_editor.$el.addEventListener('Katana.Event.Notes', function (ev) {
        var node = ev.node,
            text = ev.selectedText,
            selection = null;
            if (typeof ev.selectedText != 'undefined') {
              selection = u.saveSelection();
            }
        _this.showNoteIcon({node: $(node), text: text, selection: selection});
      });
    };

    Notes.prototype.existingNotes = function (notes) {
      this.existing_notes = notes;
      this.refresh();
    };


    Notes.prototype.currentHover = null;

    // called by editor on mouse over or tap in case of mobile
    Notes.prototype.showNote = function (ev) {
      var currentHovered = ev.currentTarget,
          name;
      if (currentHovered && currentHovered.nodeType == 1) {
        name = currentHovered.attr('name');
        if (name != null && this.currentHover != name && !$(currentHovered).hasClass('item-empty') && !$(currentHovered).hasClass('item-figure')) {
          this.hidePreviousVisible();
          var ob = {node : $(currentHovered), text: '', show: true};
          this.showNoteIcon(ob);
          this.currentHover = name;
        }
      }
    };

    Notes.prototype.refresh = function () {
      this.deactivateCloser();
      var notes = this.existing_notes;
      for (var name in notes) {
        if (notes.hasOwnProperty(name)) {
          var sel = this.current_editor.$el.querySelector('[name="' + name + '"]');
          if (sel != null) {
            this.showNoteIcon({node: sel, text: ''});
          }
        }
      }
      this.detailsHandler.existingNotes(notes);
    };

    Notes.prototype.incrementCounter = function (name) {
      var icon = this.$el.querySelector('[note-for="' + name + '"]');
      if (icon != null) {
        var counter = icon.querySelector('.notes-counter');
        if(counter != null) {
          var currentCount = parseInt(counter.attr('data-note-count'));
          if (isNaN(currentCount)) {
            currentCount = 0;
          }
          currentCount++;
          counter.text(currentCount);
          counter.attr('data-note-count', currentCount);
          icon.removeClass('empty');
        }
      }
    };

    Notes.prototype.decrementCounter = function (name) {
      var icon = this.$el.querySelector('[note-for="' + name + '"]');
      if (icon != null) {
        var counter = icon.querySelector('.notes-counter');
        if(counter != null) {
          var currentCount = parseInt(counter.attr('data-note-count'));
          currentCount--;
          counter.text(currentCount);
          counter.attr('data-note-count', currentCount);
          if (currentCount == 0) {
            icon.addClass('empty');
          }
          if (currentCount == 0) {
            counter.text('+');
          }    
        }
      }
    };

    return Notes;

  })(Katana.Base);
}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Notes.Details = (function (_super) {
    u.__extends(Details, _super);

    function Details() {
      this.handleSaveClick = u.__bind(this.handleSaveClick, this);
      this.handleCancelClick = u.__bind(this.handleCancelClick, this);
      this.showDetailsFor = u.__bind(this.showDetailsFor, this);

      Details.__super__.constructor.apply(this, arguments);
    }

    Details.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }

      if(opts.notes == null) {
        opts.notes = {};
      }

      this.current_editor = opts.editor;
      this.existing_notes = opts.notes || [];
      this.iconHandler = opts.icon;
      this.options = opts;

      this.commentable = opts.info.commentable;

      this.story = opts.info.story;
      this.read_url = opts.info.read_url || '';
      this.save_url = opts.info.save_url || '';
      this.delete_url = opts.info.delete_url || '';
      this.edit_url = opts.info.edit_url || '';
      this.reply_url = opts.info.reply_url || '';
      this.privacy_url = opts.info.privacy_url || '';
      this.smallScreen = $(window).width() <= 480 ? true : false;
      this.currentUser = typeof Mefacto.User != 'undefined' && Mefacto.User.id != 0 ? Mefacto.User.id : false;
    };

    Details.prototype.isLoggedIn = function () {
      if (_.isUndefined(this.story.user_name)) {
        return false;
      }
      return true;
    };

    Details.prototype.el = '#markers_container';

    Details.prototype.events = {
      'click .read-prev-notes' : 'loadPreviousNotes',
      'click .note-delete-link' : 'handleDeleteClick',
      'click .note-save-link'   : 'handleSaveClick',
      'click .note-cancel-link' : 'handleCancelClick',
      'click .note-reply' : 'handleReplyClick',
      'click .note-edit': 'handleEditClick',
      'click .note-edit-editor': 'handleEditorEditClick',
      'click .note-delete-editor-link' : 'handleEditorDeleteClick',
      'click .note-cancel-editor-link' : 'handleEditorCancelClick',
      'click .note-visibility-change' : 'handleVisibilityChangeClick',

      'click .note-update-link' : 'handleUpdateClick',
      'click .note-login-btn': 'handleLoginAttempt',
      'click .note-close-btn': 'handleCancelClick'
    };

    Details.prototype.handleLoginAttempt = function () {
      this.$el.trigger({
        type: 'Mefacto.UserRequired',
        from: 'notes'
      });
      return false;
    };

    Details.prototype.replyFormTemplate = function () {
      return ` 
      <div class="notes-form">
      <textarea id="notes_textarea" class="camouflaged editable text-autogrow notes-textarea text-small" placeholder="Type here.."></textarea>
      <div>
      <a class="note-update-link notes-form-link" data-progress="Saving.." tabindex="0">Save</a>
      <a class="note-save-link notes-form-link" data-progress="Saving.." tabindex="0">Save</a>
      <a class="note-delete-link notes-form-link danger" data-progress="Deleting.." tabindex="0">Delete</a>
      <a class="note-cancel-link  notes-form-link plain" tabindex="0">Cancel</a>
      </div>
      </div>`;
    };

    Details.prototype.containerTemplate = function (name) {
      return `<div class="notes-list-wrapper" data-cont-for="${name}">
        <div class="loading-notes"> <span class="loader dark small ib"></span>loading..</div>
        <ul class="notes-list no-margin"></ul>
        <div class="notes-form-container"></div>
        </div>`;
    };

    Details.prototype.getForm = function (mode) {
      let textArea = null;
      if (this.replyForm == null) {
        this.replyForm = u.generateElement(this.replyFormTemplate());
        textArea = this.replyForm.querySelector('.notes-textarea');
        if(textArea != null) {
          textArea.value = '';
        }
        //var ta = this.replyForm.find('.notes-textarea').autogrow();
      }

      this.replyForm.removeClass('for-editing');
      this.replyForm.removeAttribute('data-note-id');
      this.replyForm.removeAttribute('disabled');

      const updater = this.updateButtonClasses(this.replyForm);
      if (mode == 'new') {
        updater.element('.note-delete-link').add('hide').remove('show');  
        updater.element('.note-save-link').add('show').remove('hide');
        updater.element('.note-update-link').add('hide').remove('show');
        updater.element('.note-cancel-link').add('show').remove('hide');        
      } else if (mode == 'edit') {
        updater.element('.note-delete-link').remove('hide').add('show');
        updater.element('.note-update-link').add('show').remove('hide');
        updater.element('.note-save-link').add('hide').remove('show');
        updater.element('.note-cancel-link').add('show').remove('hide');
      } 

      if(textArea) {
        textArea.value = '';
      }

      this.replyForm.show();

      return this.replyForm;
    };

    Details.prototype.updateButtonClasses = function(form) {
      const handler = function () {
        let e = null;
        const element = (sel) => {
          el = form.querySelector(sel);
          return this;
        }
        const add = (kls) => { 
          if(el != null) { 
            el.addClass(kls);
          }
          return this;
        }
        const remove = (kls) => {
          if(el != null) {
            el.removeClass(kls);
          }
          return this;
        }
        return {element, add, remove};
      }
      return new handler();
    }

    Details.prototype.getNotesList = function (notes) {
      var ht = '';
      for ( var i = 0; i < notes.length; i = i + 1) {
        var html = this.getSingleNoteTemplate(notes[i]);
        ht += html;
      }
      return ht;
    };

    Details.prototype.createContainer = function (name, notes) {
      var wrap = u.generateElement(this.containerTemplate(name)),
          eNotes = '';
      if (notes.length) {
        eNotes = this.getNotesList(notes);
        let notesList = wrap.querySelector('.notes-list');
        if(notesList != null) {
          notesList.append(u.generateElement(eNotes));
        }
      } else {
        let notesList = wrap.querySelector('.notes-list');
        if(notesList != null) {
          notesList.addClass('notes-list-empty');
        }
      }
      this.$el.append(wrap);
      return wrap;
    };

    Details.prototype.getContainer = function (name) {
      var cont = this.$el.querySelector('[data-cont-for="' + name + '"]');
      if (cont != null) {
        var notes = typeof this.existing_notes[name] == 'undefined' ? [] : this.existing_notes[name];
        cont = this.createContainer(name, notes);
      }
      return cont;
    };

    Details.prototype.getSingleNoteTemplate = function (ob) {
      let ht = `<li class="post-note-item clearfix" data-note-id="${ob.noteId}">
        <div class="post-note-avatar smarty-photo rounded thumb bordered left">
          <div class="profile-pic-bg" style="background-image:url('${ob.avatarUrl}');" ></div>
        </div>
        <div class="post-note-content-wrap">
          <span class="post-note-author-name">
            <a href="${ob.authorUrl}" title="${ob.authorName}" > ${ob.authorName} </a>
          </span>
          <span class="post-note-content">
            ${ob.content}
          </span>`;
      if (ob.edit && this.currentUser && this.currentUser == ob.user) {
        if (typeof ob.changeTo != 'undefined') {
          ht += `<div data-editor-actions data-note="${ob.noteId}" data-change-visibility="${ob.changeTo}">
              <a class="note-edit text-small" data-note-id="${ob.noteId}" tabindex="0">Edit</a>
              <a class="note-edit-editor" data-edit-btn  tabindex="0">More</a>
              </div>`;
        } else {
          ht += `<div><a class="note-edit text-small" data-note-id="${ob.noteId}"  tabindex="0">Edit</a></div>`;
        }
      } else if (ob.edit && typeof ob.changeTo == 'undefined') {
        ht += `<div><a class="note-edit text-small" data-note-id="${ob.noteId}" tabindex="0">Edit</a></div>`;
      }else if(ob.edit && typeof ob.changeTo != 'undefined') {
        ht += `<div data-editor-actions data-note="${ob.noteId}" data-change-visibility="${ob.changeTo}"><a class="note-edit-editor" data-edit-btn  tabindex="0">Edit</a></div>`;
      }
      ht += `</div></li>`;
      return ht;
    };

    Details.prototype.handleUpdateClick = function (ev, matched) {
      var form = matched ? matched.closest('.notes-form') : ev.currentTarget.closest('.notes-form');
      if (form != null) {
        const textArea = form.querySelector('textarea');
        let text = "";
        if(textArea != null) {
          text = textArea.value;
        }
        let _this = this;
        var deleting = false;
        if (!text || text.trim().length == 0) {
          //this.removeNote();
          deleting = true;
        }

        let noteId = form.attr('data-note-id');
        let container = form.closest('.notes-list-wrapper');
        let list = container.querySelector('.notes-list');
        let note = list != null ? list.querySelector('.post-note-item[data-note-id="' + noteId + '"]') : null;
        var piece = container.attr('data-cont-for');
        if (deleting) {          
          form.attr('disabled','disabled');
          this.makeRequest(this.delete_url + '/' + noteId, 'DELETE', {}, function (sresp) {
            if (sresp && sresp.success) {
              _this.iconHandler.decrementCounter(piece);
              form.unwrap();
              if( note!=null ) {
                note.remove();
              }
              const nFormContainer = container.querySelector('.notes-form-container');
              if(nFormContainer != null) {
                nFormContainer.append(_this.getForm('new'));
              }
            } else {
              form.removeAttribute('disabled')
            }
          }, function () {
            form.removeAttribute('disabled')
          });
          // update 
        } else {
          var sob = {};
          sob.noteId = noteId;
          sob.note = text;
          sob.piece = piece;
          sob.post = this.story.id;
          sob.draft = this.story.type == 'story' ? false : true;
          form.attr('disabled','disabled');

          this.makeRequest(this.edit_url , 'POST', sob, function (sresp) {
            if (sresp && sresp.success) {
              const pnoteContent = note.querySelector('.post-note-content');
              if(pnoteContent != null) {
                pnoteContent.innerHTML = text;  
              }
              note.show();
              form.unwrap();
              const nFormContainer = container.querySelector('.notes-form-container');
              if(nFormContainer != null) {
                nFormContainer.append(_this.getForm('new'));  
              }
            } else {
              form.removeAttribute('disabled');
            }
          }, function () { // error callback
            form.removeAttribute('disabled');
          });
        }
        if(textArea != null) {
          textArea.value = '';
        }
      }
      return false;
    };

    Details.prototype.handleEditorEditClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget;
      if (tg != null && tg.matches.call(tg, '[data-edit-btn]')) {
        var actionWrap  = tg.closest('[data-editor-actions]'),
            noteId = actionWrap.attr('data-note');
        if (actionWrap != null) {
          var currentHTML = actionWrap.innerHTML;
          currentHTML = '<div class="hide">' + currentHTML + '</div>';

          var changeToVisibilty = actionWrap.attr('data-change-visibility');
          var visibilityChangeText = changeToVisibilty == 'public' ? 'Make Public' : 'Make Private';
          var links = `<a class="note-visibility-change " data-changeTo="${changeToVisibilty}" tabindex="0">${visibilityChangeText}</a> &nbsp;<a class="note-delete-editor-link danger"  data-progress="Deleting.." tabindex="0">Delete</a> &nbsp;
          <a class="note-cancel-editor-link plain"  tabindex="0">Cancel</a> &nbsp;`;
          links += currentHTML;
          actionWrap.innerHTML = links;
        }
      }
      return false;
    };

    Details.prototype.handleEditClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget;
      if (tg.length && tg.matches.call(tg, '[data-note-id]')) {
        var alreadyOpen = document.querySelector('.notes-form.for-editing');
        if (alreadyOpen != null) {
          var ta = alreadyOpen.querySelector('textarea');
          ta.focus();
          ta.addClass('blinkOnce');
        } else {
          var noteId = tg.attr('data-note-id'),
            li = tg.closest('.post-note-item[data-note-id="' + noteId + '"]'),
            form = this.getForm('edit');

          form.addClass('for-editing');
          form.attr('data-note-id', noteId);
          let pNoteContent = li.querySelector('.post-note-content');
          const textArea = form.querySelector('textarea');
          if(pNoteContent != null && textArea != null) {
            textArea.value = pNoteContent.innerText;
          } else if(textArea != null) {
            textArea.value = '';
          }
          if(li != null) {
            li.insertBefore(form, li.firstChild);
            //form.insertBefore(li);
            li.hide();  
          }
          form.wrap(u.generateElement('<li class="has-form"></li>'));
          textArea.focus();
        }        
      }
      return false;
    };

    Details.prototype.handleSaveClick = function (ev, matched) {
      var form = matched ? matched.closest('.notes-form') : ev.currentTarget.closest('.notes-form');
      if (form != null) {
        let textArea = form.querySelector('textarea');
        var text = "";
        if(textArea != null) {
          text = textArea.value;
        }
        var _this = this;

        if (!text || text.trim().length == 0) {
          return false;
        }

        var tmplOb = {};
        
        tmplOb.noteId = u.generateId();
        tmplOb.authorName = this.story.user_name;
        tmplOb.authorUrl = this.story.user_link;
        tmplOb.avatarUrl = this.story.pic;
        tmplOb.content = text;
        tmplOb.edit = true;

        var note = u.generateElement(this.getSingleNoteTemplate(tmplOb)),
            sob = {},
            container = form.closest('.notes-list-wrapper');

        sob.noteId = tmplOb.noteId;
        sob.note = text;
        sob.piece = container.attr('data-cont-for');
        sob.post = this.story.id;
        sob.draft = this.story.type == 'story' ? false : true;
        form.attr('disabled','disabled');

        this.saveRequest(sob, function (sresp) {
          if (sresp && sresp.success)  {
            var list = container.querySelector('.notes-list');
            if(list != null) {
              list.append(note);
              list.removeClass('notes-list-empty');
              _this.iconHandler.incrementCounter(sob.piece);
              var ta = form.querySelector('textarea');
              if(ta != null) {
                ta.focus();
              }
              const rnote = _this.$el.find('[data-note-id="' + sresp.data.replace_note + '"]');
              if(rnote != null) {
                rnote.attr('data-note-id', sresp.data.note_id);
              }
              form.removeAttribute('disabled');
            }
          } else {
            form.removeAttribute('disabled');
          }
        }, function () {
          form.removeAttribute('disabled');
        });
      }
      return false;
    };

    Details.prototype.saveRequest = function (ob, successCallback, errorCallback) {

      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.save_url, true);
      xhr.onload = () => {
        if(xhr.status == "200" && xhr.readyState == 4) {
          try {
            let response = JSON.parse(xhr.responseText);
            successCallback(response);
          } catch(e) {
            console.error(e);
          }
        }
      }
      xhr.send(ob);
    };

    Details.prototype.handleCancelClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
          dontClose = false;
      if (tg != null) {
        var form = tg.closest('.for-editing');
        if (form != null) {
          var noteId = form.attr('data-note-id'),
              container = form.closest('.notes-list-wrapper');
          form.unwrap();
          if(container != null) {
            let nfc = container.querySelector('.notes-form-container');
            if(nfc != null) {
              nfc.append(this.getForm('new'));
            }
            let pnfc = container.querySelector('.post-note-item[data-note-id="' + noteId + '"]');
            if(pnfc != null) {
              pnfc.show();
            }
          }
          dontClose = true;
        }else {
          this.closePreviousBox();
        }
      }

      if (!dontClose) {
        this.iconHandler.deactivateAll();
      }
      return false;
    };

    Details.prototype.handleEditorCancelClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget;
      if (tg != null) {
        var actionWrap  = tg.closest('[data-editor-actions]');
        if(actionWrap != null) {
          //var noteId = actionWrap.attr('data-note');
          var hidenE = actionWrap.querySelector('.hide');
          if(hidenE != null) {
            actionWrap.innerHTML = hidenE.innerHTML;
          }
        }
      }
      return false;
    };

    Details.prototype.handleVisibilityChangeClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
      actionWrap = tg.closest('[data-editor-actions]');
      if(actionWrap != null) {
        var noteId = actionWrap.attr('data-note'),
        changeTo = tg.attr('data-changeTo'),
        futureIfSuccess = changeTo == 'public' ? 'private' : 'public',
        futureTextIfSuccess = changeTo == 'public' ? 'Make Private' : 'Make Public';

        const xhr = new XMLHttpRequest();
        xhr.open("POST", this.privacy_url, true);
        xhr.onload = () => {
          if(xhr.status == "200" && xhr.readyState == 4) {
            try {
              const resp = JSON.parse(xhr.responseText);
              if (resp && resp.success) {
                tg.innerText = futureTextIfSuccess;
                tg.attr('data-changeTo', futureIfSuccess);
                actionWrap.attr('data-change-visibility', futureIfSuccess);
              }
            }catch(e) {
              console.error(e);
            }
          }
        };
        xhr.send({note: noteId, visible: changeTo});
      }
      return false;
    };

    Details.prototype.handleEditorDeleteClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
          actionWrap = tg.closest('[data-editor-actions]');
      if (actionWrap != null) {
        let noteId = actionWrap.attr('data-note'),
            container = actionWrap.closest('.notes-list-wrapper'),
            piece = container.attr('data-cont-for'),
            noteItem = tg.closest('.post-note-item'),
            _this = this;

          noteItem.attr('disabled','disabled');
                  
          this.deleteRequest(noteId, function () {

            if (container.querySelectorAll('.post-note-item').length == 0) {
              let noteslist = container.querySelector('.notes-list');
              if(noteslist != null) {
                noteslist.addClass('notes-list-empty');
              }
            }
            let notesFormContainer = container.querySelector('.notes-form-container');
            if(notesFormContainer != null) {
              notesFormContainer.append(_this.getForm('new'));  
            }
            let postNotesItem = container.querySelector('.post-note-item[data-note-id="' + noteId + '"]');
            if(postNotesItem != null) {
              postNotesItem.remove();
            }
            var ta = container.querySelector('.notes-form-container textarea');
            if(ta != null) {
              ta.focus();
            }

            _this.iconHandler.decrementCounter(piece);
          }, function () {
            noteItem.removeAttribute('disabled');
          });
      }
    };

    Details.prototype.handleDeleteClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
          editMode = tg.closest('.for-editing');

        if (editMode != null) {
          var noteId = editMode.attr('data-note-id'),
              container = editMode.closest('.notes-list-wrapper'),
              piece = container.attr('data-cont-for'),
              _this = this;

          editMode.attr('disabled', 'disabled');

          this.deleteRequest(noteId, function () {
            editMode.unwrap();
            const postNote = container.querySelector('.post-note-item[data-note-id="' + noteId + '"]');
            if(postNote != null) {
              postNote.remove();
            }
            _this.iconHandler.decrementCounter(piece);

            if (container.querySelectorAll('.post-note-item').length == 0) {
              const notesList = container.querySelector('.notes-list');
              if(notesList != null) {
                notesList.addClass('notes-list-empty'); 
              }
            }
            const notesFormContainer = container.querySelector('.notes-form-container');
            if(notesFormContainer != null) {
              notesFormContainer.append(_this.getForm('new'));
            }
            var ta = container.find('.notes-form-container textarea');
            ta.focus();
          }, function () {
            editMode.removeAttribute('disabled');
          });
        }
      return false;
    };

    Details.prototype.deleteRequest = function (noteId, successCallback, errorCallback) {
      const xhr = new XMLHttpRequest();
      const url = `${this.delete_url}/${noteId}`;
      xhr.open("DELETE", url, true);
      xhr.onload = () => {
        if(xhr.readyState == 4 && xhr.status == "200") {
          try {
            const resp = JSON.parse(xhr.responseText);
            if(resp) {
              if(resp.success) {
                successCallback();
              } else {
                errorCallback();
              }
            } else {
              errorCallback();
            }
          }catch(e) {
            errorCallback();
          }
        }
      };
      xhr.onerror = () => {
        errorCallback();
      };
      xhr.send(null);
    };

    Details.prototype.handleReplyClick = function (ev, matched) {
      return false;
    };

    Details.prototype.closePreviousBox = function () {
      const copened = this.$el.querySelector('.opened');
      if(copened != null) {
        copened.removeClass('opened');
      }
      this._currentlyOpen = null;
    };

    Details.prototype._currentlyOpen = null;

    Details.prototype.showDetailsFor = function(name, $icon) {
      if (name && name != this._currentlyOpen) {
        this.closePreviousBox();
        this.openFor(name, $icon);
        this._currentlyOpen = name;
      }else if(name == this._currentlyOpen) {
        this.closePreviousBox();
      }
    };

    Details.prototype.getSignInLink = function () {
      return '<a href="javascript::;" class="note-login-btn">Login to leave a note</a><a class="note-close-btn">Close</a>';
    };

    Details.prototype.loadPreviousNotes = function(ev, matched) {
      let $tg = matched ? matched : ev.currentTarget;
      var url = $tg.attr('href');
      var container = $tg.closest('.notes-list-wrapper');
      var name = container.attr('data-cont-for');
      var $icon = document.querySelector('[note-for="' +name+ '"]');
      $tg.innerHTML = '<span class="loader ib small dark"></span> Loading..';
      this.loadNotesDetails(name, $icon, container, url);
      return false;
    };


    Details.prototype.loadNotesDetails = function(name, $icon, container, loadUrl) {
      var url = this.read_url + '/' + this.story.id + '/' + name,
      _this = this,
      mergeUserObject;

      if( typeof loadUrl != 'undefined') {
        url = loadUrl;
      }

      mergeUserObject = function (note, user) {
        note.authorName = user.name;
        note.authorUrl = user.link;
        note.avatarUrl = user.avatarUrl;
      };

      const getPreviousUrl = function (page) {
        return `${_this.read_url}/${_this.story.id}/${name}?page=${page}`;
      };

      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = () => {
        if(xhr.status == "200" && xhr.readyState == 4) {
          try {
            container.querySelectorAll('.loading-notes').forEach(el => el.remove());
            container.querySelectorAll('.read-prev-notes').forEach( el => el.remove());

            $icon.addClass('notes-loaded');

            const response = JSON.parse(xhr.responseText);
            if (response && response.success) {
              var dt = response.data;
              if (dt.notes && dt.users) {
                var notes = dt.notes;
  
                for (var i = 0; i < notes.length; i = i + 1) {
                  var user = notes[i].user;
                  if (dt.users[user]) {
                    mergeUserObject(notes[i], dt.users[user]);
                  }
                }
  
                if (notes.length) {
                  var ht = _this.getNotesList(notes);
                  container.querySelectorAll('.read-prev-notes').forEach( el => el.remove() );

                  var li = container.querySelector('.notes-list');
                  if (dt.page) {
                    var page = u.generateElement(`<a href="${getPreviousUrl(dt.page)}" class="read-prev-notes">Read previous</a>`);

                    li.parentNode.insertBefore(page, li);
                    //$(page).insertBefore(li);
                  }
  
                  li.removeClass('notes-list-empty');
                  li.prepend(u.generateElement(ht));
                }
              }
            }

          } catch(e) {
            console.error(e);
          }
        }
      }
      xhr.onerror = () => {
        container.querySelectorAll('.loading-notes').forEach(el => el.remove());
      }
      xhr.send(null);

    };

    Details.prototype.openFor = function (name, $icon) {
      var container = this.getContainer(name),
          isLoggedIn = this.isLoggedIn(),
          form = isLoggedIn ? this.getForm('new') : u.generateElement(this.getSignInLink());

      if(!$icon.hasClass('notes-loaded')) {
        const notesCounter = $icon.querySelector('.notes-counter');
        if(notesCounter != null) {
          var count = notesCounter.attr('data-note-count');
          count = parseInt(count);
          if(!isNaN(count) && count > 0) {
            this.loadNotesDetails(name, $icon, container);
          } else {
            container.querySelectorAll('.loading-notes').forEach(el => el.remove());
          }
        }
      }

      container.addClass('opened');

      if ($icon.hasClass('on-dark')) {
        container.addClass('on-dark');
      }else {
        container.removeClass('on-dark');
      }
      let lb = container.querySelector('.note-login-btn');
      if(lb != null) {
        lb.remove();
      }
      let lc = container.find('.note-close-btn');
      if(lc != null) {
        lc.remove();
      }

      const notesFormContainer = container.querySelector('.notes-form-container');
      if(notesFormContainer != null) {
        notesFormContainer.append(form);
      }
      this.positionContainer(container, name);

      if (form && form.querySelector('textarea') != null) {
        form.querySelector('textarea').focus();
      }
    };

    Details.prototype.positionContainer = function (container, name) {
      var against = document.querySelector('[name="' + name + '"]');
      if (against != null) {
        if (this.smallScreen) {

        } else {
          var rect = against.getBoundingClientRect();
          var offset = {
            top: rect.top + document.body.scrollTop,
            left: rect.left + document.body.scrollLeft
          };
          const st = container.style;
          const agwidth = parseFloat(getComputedStyle(against, null).width.replace("px", ""));
          st.left = offset.left + gwidth + 50 + 'px';
          st.top = offset.top + 'px';
          st.position = 'absolute';
        }
        
      }
    };

    Details.prototype.makeRequest = function (url, method, params, scallback, ecallback) {

      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.onload = () => {
        if(xhr.status == "200" && xhr.readyState == 4) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (typeof scallback != 'undefined') {
              scallback(response);
            }
          }catch(e) {
            console.error(e);
          }
        }
      };
    };

    Details.prototype.existingNotes = function (notes) {
      this.existing_notes = notes;
      this.$el.innerHTML = ''; // remove all existing notes..
      this.replyForm = null;
    };

    return Details;

  })(Katana.Base);

}).call(this);
(function () {
  var u = Katana.utils;
  Katana.Toolbar = (function(_super) {
    u.__extends(Toolbar, _super);

    function Toolbar() {
      this.hide = u.__bind(this.hide, this);
      return Toolbar.__super__.constructor.apply(this, arguments);
    }

    Toolbar.prototype.el = "#mfToolbarBase";

    Toolbar.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
    };

    return Toolbar;
  })(Katana.Base);
  
}).call(this);
(function () {
  var u = Katana.utils;

  Katana.Toolbar.ImageToolbar = (function (_super) {
    u.__extends(ImageToolbar, _super);

    function ImageToolbar() {
      this.handleClick = u.__bind(this.handleClick, this);
      this.initialize = u.__bind(this.initialize, this);
      this.removeFigure = u.__bind(this.removeFigure, this);
      this.commandPositionSwitch = u.__bind(this.commandPositionSwitch, this);

      this.createlink = u.__bind(this.createlink, this);
      this.handleInputEnter = u.__bind(this.handleInputEnter, this);
      this.handleKeyDown = u.__bind(this.handleKeyDown, this);
      this.shortCutKey = u.__bind(this.shortCutKey, this);

      this.show = u.__bind(this.show, this);
      this.hide = u.__bind(this.hide, this);
      return ImageToolbar.__super__.constructor.apply(this, arguments);
    }

    ImageToolbar.prototype.el = '#mfImageToolbarBase';

    ImageToolbar.prototype.events = {
      "mousedown .mf-menu-button": "handleClick",
      "click .mf-menu-linkinput .mf-menu-button": "closeInput",
      "keypress input": "handleInputEnter",
      "keydown input": "handleKeyDown"
    };

    ImageToolbar.prototype.menuGridMode = false;

    ImageToolbar.prototype.hide = function () {
      this.elNode.removeClass('mf-menu--linkmode');
      this.elNode.addClass('hide');
    };

    ImageToolbar.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.current_editor = opts.editor;
      this.mode = opts.mode;
      this.config = opts.imageToolbarConfig || this.defaultConfig();
      this.controller = null;

      this.strReg = {
        whiteSpace: /(^\s+)|(\s+$)/g,
        mailTo: /^(?!mailto:|.+\/|.+#|.+\?)(.*@.*\..+)$/,
        http: /^(?!\w+?:\/\/|mailto:|\/|\.\/|\?|#)(.*)$/
      };
    };

    ImageToolbar.prototype.setController = function (controller) {
      this.controller = controller;
    };

    ImageToolbar.prototype.defaultConfig = function () {
      if(this.mode == 'write') {
        return {
          buttons: [
          {a:'sideleft',i: 'image-left-buldge'},
          {a:'defaultsize',i: 'image-default'},
          {a:'fullwidth', i: 'image-full-width'},
          {a:'background',i:'image-background'},
          {a:'createlink',i:'link'}
          ]
        }; 
      }
      return {buttons: []};
    };

    ImageToolbar.prototype.template = function () {
      if(this.config.buttons.length > 0) {
        let html = `<div class="mf-menu-linkinput">
              <input class="mf-menu-input" placeholder="http://">
              <div class="mf-menu-button mf-link-close">&#215;</div>
            </div>
            <ul class='mf-menu-buttons'>`;

        this.config.buttons.forEach((item) => {
          html += `<li class='mf-menu-button'><i class="mf-icon mfi-${item.i}" data-action=" ${item.a}"></i></li>`;
        });
        html += `</ul>`;
        return html;  
      }
      return '';
    };

    ImageToolbar.prototype.built = false;

    ImageToolbar.prototype.render = function () {
      if(!this.built) {
        var html = this.template();
        this.elNode.innerHTML = html;
        this.built = true;  
      }      
      return this;
    };

    ImageToolbar.prototype.refresh = function() {
      this.elNode.querySelectorAll('.mf-menu-button').forEach(el => {
        el.removeClass('hide');
      })
    };

    ImageToolbar.prototype.show = function () {
      if(this.mode == 'write') {
        this.current_editor.image_toolbar._show();  
      }
    };

    ImageToolbar.prototype._show = function () {
      this.elNode.addClass("mf-menu--active");
      this.displayHighlights();
      this.elNode.removeClass('hide');
    };

    ImageToolbar.prototype.handleClick = function (ev, matched) {
      var action, element, input;
      if(matched) {
        element = matched.querySelector('.mf-icon');
      } else {
        element = ev.currentTarget.querySelector('.mf-icon');
      }
      if(element != null) {

        action = element.attr("data-action");
        if(action) {action = action.trim();}
        if (/(?:createlink)/.test(action)) {
          this.actionIsLink(ev.currentTarget);
        } else {
          this.menuApply(action);
        }
  
        this.displayHighlights();
      }
      return false;
    };

    ImageToolbar.prototype.shortCutKey = function (key, event) {
      var didSomething = false;
      switch(key) {
        case 49: // left budge
          this.commandSideLeft();
          didSomething = true;
        break;
        case 50: // default
          this.commandDefaultSize();
          didSomething = true;
        break;
        case 51: // full width
          this.commandFullWidth();
          didSomething = true;
        break;
        case 52: // background image
          this.commandBackground();
          didSomething = true;
        break;
      }
      if (didSomething) {
        var _this = this;
        setTimeout(function () {
          // _this.current_editor.image_toolbar.show();  
        }, 50);
      }
    };

    ImageToolbar.prototype.actionIsLink = function (target, event) {
      if (target.hasClass("active")) {
        this.removeLink();
      } else {
        this.elNode.addClass("mf-menu--linkmode");
        if(this.elNode.querySelector("input.mf-menu-input") != null) {
          this.elNode.querySelector("input.mf-menu-input").focus();
        }
        if (typeof event != 'undefined') {
          event.preventDefault();
        }
      }
    };

    ImageToolbar.prototype.removeLink = function () {
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel != null) {
        sel.querySelector('img').unwrap();
      }
      this.elNode.querySelector('.mf-menu-input').value = '';
    };

    ImageToolbar.prototype.closeInput = function(e) {
      this.elNode.removeClass("mf-menu--linkmode");
      return false;
    };

    ImageToolbar.prototype.handleInputEnter = function(e, matched) {
      if (e.which === 13) {
        if(matched) {
          return this.createlink(matched);
        } else {
          return this.createlink(e.target);
        }
      }
    };

    ImageToolbar.prototype.handleKeyDown = function (e) {
      var which = e.which,
        bd,
        overLay;
      if (which == 27) { 
        this.hide();
      }
    };

    ImageToolbar.prototype.createlink = function(input) {
      var action, 
          inputValue;
          this.elNode.removeClass("mf-menu--linkmode");
      if (input.value != '') {
        inputValue = input.value.replace(this.strReg.whiteSpace, "").replace(this.strReg.mailTo, "mailto:$1").replace(this.strReg.http, "http://$1");
        var a = `<a href="${inputValue}" data-href="${inputValue}" class="markup-anchor markup-figure-anchor"></a>`;
        var sel = document.querySelector('.item-figure.item-selected');
        if (sel != null) {
          sel.querySelector('img').wrap(a);
        }
        this.displayHighlights();
      }
    };

    ImageToolbar.prototype.addLink = function (e) {
      if (this.mode == 'write') {
        var sel = this.current_editor.elNode.querySelector('.item-figure.item-selected');
        if (sel != null) {
          this.actionIsLink(this.elNode.querySelector('[data-action="createlink"]').closest('li'), e);
          return false;
        }
      }
    };

    ImageToolbar.prototype.menuApply = function (action) {
      if (this.menuGridMode) {
        if (action == 'defaultsize') {
          this.commandGridDefault();
        } else if(action == 'fullwidth') {
          this.commandGridFullWidth();
        }
      } else {
        if(action == 'sideleft') {
          this.commandSideLeft();
        }else if(action == 'fullwidth') {
          this.commandFullWidth();
        }else if(action == 'defaultsize') {
          this.commandDefaultSize();
        }else if(action == 'background') {
          this.commandBackground();
        }  
      }
    };

    ImageToolbar.prototype.commandGridDefault = function () {
      var grid = document.querySelector('.grid-focused');
      if(grid != null) {
        grid.removeClass('block-grid-full');
  
        var rows = grid.querySelectorAll('.block-grid-row');
        for (var i = 0; i < rows.length; i = i + 1) {
          var row = rows[i];
          var figures = row.querySelectorAll('.item-figure');
          const evnt = new CustomEvent('Katana.Images.Restructure', {
            type: 'Katana.Images.Restructure',
            container: row,
            count: figures.length,
            figures: figures
          });

          this.current_editor.elNode.dispatchEvent(evnt);
        }
      }
    };
    
    ImageToolbar.prototype.commandGridFullWidth = function () {
      var grid = document.querySelector('.grid-focused');
      if(grid != null) {
        grid.addClass('block-grid-full');
        var rows = grid.querySelectorAll('.block-grid-row');
        for (var i = 0; i < rows.length; i = i + 1) {
          var row = rows[i];
          var figures = row.querySelectorAll('.item-figure');
          const evnt = new CustomEvent('Katana.Images.Restructure', {
            type: 'Katana.Images.Restructure',
            container: row,
            count: figures.length,
            figures: figures
          });
          this.current_editor.elNode.dispatchEvent(evnt);
        }
      }
    }    

    ImageToolbar.prototype.pullFullWidthContainer = function () {
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel != null && sel.closest('.full-width-column') != null) {
        var curr = sel.closest('.full-width-column');
        if(curr == null) {
          return;
        }

        var prevContainer = curr.prev('.block-content-inner'),
          nextContainer = curr.next('.block-content-inner'),
          aspect = sel.querySelector('.padding-cont');

          aspect.attr('style', aspect.attr('data-style'));
          aspect.removeAttribute('data-style');

        if(curr.querySelectorAll('.item-figure').length == 1) { // we have not merged two full width containers together
          if (prevContainer != null) {
            prevContainer.appendChild(sel);
          }else {
            var ct = u.generateElement(this.current_editor.getSingleLayoutTempalte());
            ct.insertBefore(curr);
            ct.appendChild(sel);
            prevContainer = ct;
          }
          if(prevContainer != null) {
            const aPChilds = prevContainer.children;
            const validPChilds = Array.prototype.filter.call(aPChilds, el => { return el.classList.contains('item'); });
            if(validPChilds.length == 0) {
              prevContainer.parentNode.removeChild(prevContainer);
            }
          }

          if(!nextContainer.hasClass('full-width-column')) {

            const aNChilds = nextContainer.children;
            const vNChilds = Array.prototype.filter.call(aNChilds, el => { return el.classList.contains('item'); });
            if(vNChilds.length > 0) {
              vNChilds.forEach(el => {
                prevContainer.appendChild(el);
              })
            }

            nextContainer.parentNode.removeChild(nextContainer);
          }
          curr.parentNode.removeChild(curr);
        }else { // we have merged two full width containers together
          var firstGraf = curr.querySelector('.item-figure:first-child'),
          lastGraf = curr.querySelector('.item-figure:last-child');

          if (firstGraf != null && firstGraf == sel) { // add in upper container or create one
            if (prevContainer != null) {
              prevContainer.append(sel);
            } else {
              var newCont = u.generateElement(this.current_editor.getSingleLayoutTempalte());
              newCont.appendChild(sel);
              newCont.insertBefore(curr);
            }
          }else if(lastGraf != null && lastGraf == sel) { // add in lower container or create one
            if (nextContainer != null) {
              sel.insertBefore(nextContainer.querySelector('.item:first-child'));
            } else {
              var newCont = u.generateElement(this.current_editor.getSingleLayoutTempalte());
              newCont.appendChild(sel);
              newCont.insertAfter(curr);
            }
          }else { // create a layout single inbetween
            var newBottomContainer = u.generateElement('<div class="block-content-inner full-width-column"></div>');
            while(sel.nextElementSibling != null){
              newBottomContainer.appendChild(sel.nextElementSibling);
            }
            var newFigureContainer = u.generateElement(this.current_editor.getSingleLayoutTempalte());
            newFigureContainer.appendChild(sel);
            newFigureContainer.insertAfter(curr);
            newBottomContainer.insertAfter(newFigureContainer);
          }          
        }
      }
    };

    ImageToolbar.prototype.pushFullWidthContainer = function () {
      var sel = document.querySelector('.item-figure.item-selected');
      if (sel == null || sel.closest('.full-width-column') != null) {
        return;
      }
      var bottomContainer = u.generateElement('<div class="block-content-inner center-column"></div>'),
      currentContainer = sel.closest('.block-content-inner'),
      figureContainer = u.generateElement('<div class="block-content-inner full-width-column"></div>');

      while(sel.nextElementSibling != null) {
        bottomContainer.appendChild(sel.nextElementSibling);
      }

      if (currentContainer.querySelectorAll('.item').length == 1) {
        const qitem = currentContainer.querySelector('.item');
        if(qitem == sel) {
          currentContainer.attr('class','');
          currentContainer.addClass('block-content-inner');
          currentContainer.addClass('full-width-column');
          bottomContainer.insertAfter(currentContainer);
        }
      }else {
        figureContainer.appendChild(sel);
        figureContainer.insertAfter(currentContainer);
        bottomContainer.insertAfter(figureContainer);  
      }
    };

    ImageToolbar.prototype.removeFigureClasses = function (figure) {
      figure.removeClass('figure-full-width');
      figure.removeClass('figure-to-left');
    };

    ImageToolbar.prototype._commandStretchImageInGrid = function(figure) {
      var nxtFigures = figure.next('.figure-in-row'),
          currentRow = figure != null ? figure.closest('.block-grid-row') : null,
          nextRow = currentRow != null ? currentRow.next('.block-grid-row') : null;

      if (nxtFigures != null) {
        if(nextRow == null) {
          var tmpl = `<div class="block-grid-row" data-name="${u.generateId()}"></div>`;
          tmpl = u.generateElement(tmpl);
          tmpl.insertAfter(currentRow);
          nextRow = tmpl;
        }
        u.prependNode(nxtFigures, nextRow);
      }

      var stretchRow = `<div class="block-grid-row" data-name="${u.generateId()}" data-paragraph-count="1"></div>`;
      stretchRow = u.generateElement(stretchRow);
      stretchRow.appendChild(figure);
      stretchRow.insertAfter(currentRow);

      const reEvnt = new CustomEvent('Katana.Images.Restructure', {
        type: 'Katana.Images.Restructure',
        container: stretchRow,
        count: 1,
        figures: [figure]
      });
      this.current_editor.elNode.dispatchEvent(reEvnt);

      // format figure in row just below stretch
      if (nextRow != null) {
        var nextRowFigures = nextRow.querySelectorAll('.item-figure');
        if(nextRowFigures.length) {
          nextRowFigures.forEach(el => {
            el.attr('data-paragraph-count', nextRowFigures.length);
          });
          const rEvnt = new CustomEvent('Katana.Images.Restructure', {
            type: 'Katana.Images.Restructure',
            container: nextRow,
            count: nextRowFigures.length,
            figures: nextRowFigures
          });
          this.current_editor.elNode.dispatchEvent(rEvnt);
        } else {
          nextRow.parentNode.removeChild(nextRow);
        }
      }

      var currentRowFigures = currentRow.querySelectorAll('.item-figure');
      if (currentRowFigures.length) {
        currentRowFigures.forEach(el => {
          el.attr('data-paragraph-count', currentRowFigures.length);
        });
        const cEvnt = new CustomEvent( 'Katana.Images.Restructure', {
          type: 'Katana.Images.Restructure',
          container: currentRow,
          count: currentRowFigures.length,
          figures: currentRowFigures
        });
        this.current_editor.elNode.dispatchEvent(cEvnt);
      } else {
        currentRow.parentNode.removeChild(currentRow);
      }
    };

    ImageToolbar.prototype._commandGoDownInGrid = function (sel) {
      var row = sel.closest('.block-grid-row'),
        nextRow = row != null ? row.next('.block-grid-row') : null;

      if(row != null) {
        var figs = row.querySelectorAll('.item-figure');
        if (figs.length == 1) {
          // we are the only item.. should breakout from the grid now
          this.current_editor.moveFigureDown(sel);
          return;
        }
      }
      if (nextRow == null) {
        var tmpl = `<div class="block-grid-row" data-name="${u.generateId()}"></div>`;
        tmpl = u.generateElement(tmpl);
        tmpl.insertAfter(row);
        nextRow = tmpl;
      }

      nextRow.prepend(sel);

      var newFigs = nextRow.querySelectorAll('.item-figure');
      nextRow.attr('data-paragraph-count', newFigs.length);

      this.current_editor.$el.trigger({
        type: 'Katana.Images.Restructure',
        container: nextRow,
        count: newFigs.length,
        figures: newFigs
      });

      if (row.querySelectorAll('.item-figure').length == 0) {
        row.remove();
      } else {
        var figs = row.querySelectorAll('.item-figure');
        row.attr('data-paragraph-count', figs.length);
        this.current_editor.$el.trigger({
          type: 'Katana.Images.Restructure',
          container: row,
          count: figs.length,
          figures: figs
        });
      }
    };

    ImageToolbar.prototype._commandGoUpInGrid = function (figure) {
      var currRow = figure.closest('.block-grid-row'),
          prevRow = currRow.prev('.block-grid-row');

      if (prevRow.length == 0 && currRow.querySelectorAll('.item-figure').length == 1) {
        this.current_editor.moveFigureUp(figure);
        return;
      }

      if (prevRow.length == 0) {
        var tmpl = `<div class="block-grid-row" data-name="${u.generateId()}"></div>`;
        tmpl = u.generateElement(tmpl);
        tmpl.insertBefore(currRow);
        prevRow = tmpl;
      }

      if (prevRow.length) {
        prevRow.append(figure);
        var prevFigures = prevRow.querySelectorAll('.item-figure');
        prevRow.attr('data-paragraph-count', prevFigures.length);

        this.current_editor.$el.trigger({
          type: 'Katana.Images.Restructure',
          container: prevRow,
          count: prevFigures.length,
          figures: prevFigures
        });

        var currFigures = currRow.querySelectorAll('.item-figure');
        if (currFigures.length) {
          currRow.attr('data-paragraph-count', currFigures.length);
          this.current_editor.$el.trigger({
            type: 'Katana.Images.Restructure',
            container: currRow,
            count: currFigures.length,
            figures: currFigures
          });
        } else {
          currRow.remove();
        }
      } else { // break out of grid 

      }
    };

    /** commands **/
    ImageToolbar.prototype.commandPositionSwitch = function (direction, figure) {
      var sel = document.querySelector('.item-figure.item-selected'), toSwitchWith;
      if (typeof figure != 'undefined') {
        sel = figure;
      }
      if(sel == null) {
        return;
      }
      if (sel.hasClass('figure-in-row')) {
        if (direction == 'left') {
          toSwitchWith = sel.prev('.figure-in-row');
          if(toSwitchWith != null) {
            sel.insertBefore(toSwitchWith);
          }
        } else if(direction == 'right') { 
          toSwitchWith = sel.next('.figure-in-row');
          if(toSwitchWith != null) {
            toSwitchWith.insertBefore(sel);
          }
        } else if(direction == 'down') {
          this._commandGoDownInGrid(sel);
        } else if(direction == 'stretch') {
          this._commandStretchImageInGrid(sel);
        } else if(direction == 'up') {
          this._commandGoUpInGrid(sel);
        }
      } else if (sel.hasClass('item-figure')) {
        if (direction == 'up') {
          this._commandMoveImageUp(sel);
        } else if(direction == 'down') {
          this._commandMoveImageDown(sel);
        }
      }

      sel.addClass('figure-focused');
      sel.focus();
      this.displayHighlights();
    };

    ImageToolbar.prototype.commandSideLeft = function () {
      this.pullBackgroundContainer();
      this.pullFullWidthContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {
        return;
      }
      this.removeFigureClasses(sel);
      sel.addClass('figure-to-left');

      // merge the sections
      this.current_editor.mergeInnerSections(sel.closest('section'));

      //activate the node
      sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) { return; }
      this.current_editor.selectFigure(sel);
    };

    ImageToolbar.prototype.commandDefaultSize = function () {
      this.pullBackgroundContainer();
      this.pullFullWidthContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.removeFigureClasses(sel); 

      // merge the sections
      this.current_editor.mergeInnerSections(sel.closest('section'));     
      sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.current_editor.selectFigure(sel);
    };

    ImageToolbar.prototype.commandFullWidth = function () {
      this.pullBackgroundContainer();
      this.pushFullWidthContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.removeFigureClasses(sel);
      sel.addClass('figure-full-width');
      var padC = sel.querySelector('.padding-cont');
      if(padC != null) {
        var style = padC.attr('style');
        padC.attr('data-style', style);
        padC.removeAttribute('style');
      }
      

      // merge the sections
      this.current_editor.mergeInnerSections(sel.closest('section'));
      sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.current_editor.selectFigure(sel);
    };

    ImageToolbar.prototype.commandBackground = function () {
      var section = this.pushBackgroundContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.removeFigureClasses(sel);
      this.current_editor.selectFigure(section);
    };

    ImageToolbar.prototype._commandMoveImageUp = function (figure) {
      this.current_editor.moveFigureUp(figure);
    };

    ImageToolbar.prototype._commandMoveImageDown = function (figure) {
      this.current_editor.moveFigureDown(figure);
    };
    /** commands ends **/

    ImageToolbar.prototype.displayHighlights = function () {
      var sel = document.querySelector('.item-figure.figure-focused'), tag = '';
      this.refresh();
      var ac = this.$el.querySelector('.active');
      if(ac != null) {
        ac.removeClass('active');
      }
      this.menuGridMode = false;
      if (sel == null) {
        sel = document.querySelector('.block-content.figure-focused');
      }
      if(sel == null) {
        return;
      }

      if (sel.hasClass('figure-in-row')) {
        this.menuGridMode = true;
        sel.removeClass('can-go-right can-show-add');

        var bgE = this.$el.querySelector('[data-action="background"]');
        if(bgE != null) {
          bgE.parent('li').addClass('hide');
        }

        var grid = sel.closest('.block-grid');
        if (grid.hasClass('block-grid-full')) {
          tag = 'fullwidth';
        } else {
          tag = 'defaultsize';
        }
        
        this.hideAction('sideleft');
        
        var nxt = sel.next('.figure-in-row');
        
        if (nxt != null) {
          sel.addClass('can-go-right');
        }

        if(nxt == null) {
          sel.addClass('can-show-add');
        }

        sel.addClass('can-go-down');

      } else {
        this.hideAction('goleft', 'goright');
      }

      if (!this.menuGridMode) {
        if(!sel.hasClass('figure-in-row')) {
          if (sel.hasClass('figure-to-left')) {
            tag = 'sideleft';
          }else if(sel.hasClass('figure-full-width')) {
            tag = 'fullwidth';
          }else if(sel.hasClass('block-content')) {
            tag = 'background';
          }else {
            tag = 'defaultsize';
          }
        }

      
        // no position change for iframe embeds
        if (sel.hasClass('item-iframe')) {
          this.hideAction('goleft', 'goright');
          
          if (!sel.hasClass('can-go-background')) {
            this.hideAction('background');
          }
        }

        if (sel.closest('.with-background') != null && !sel.hasClass('with-background')) {
          this.hideAction('fullwidth', 'background');
        }

        // no fullsize form small photos 
        if (sel.hasClass('n-fullSize')) {
          this.hideAction('fullwidth', 'background');
        }

        let simg = sel.querySelector('img');
        if(simg != null) {
          let sprnt = simg.parentElement;
          if (sprnt != null && sprnt.hasClass('markup-anchor')) {
            this.highlight('createlink');
          } 
        }
      }

      if (sel.hasClass('item-iframe')) {
        this.hideAction('createlink');
      } else {
        this.showAction('createlink');
      }

      let gfocused = document.querySelectorAll('.grid-focused');
      let gfigureFoucsed = document.querySelectorAll('.figure-focused');

      if (gfocused.length && gfigureFoucsed.length == 0) {
        this.hideAction('goleft', 'sideleft', 'goright', 'background');
      }

      if(tag != '') {
        this.highlight(tag);  
      }
    };

    ImageToolbar.prototype.hideAction = function(...names) {
      for(const name of names) {
        let go = this.$el.querySelector('[data-action="' + name + '"]');
        if(go != null) {
          let pl = go.parent('li');
          if(pl != null) {
            pl.hide();
          }
        }
      }
    }

    ImageToolbar.prototype.showAction = function(...names) {
      for(const name of names) {
        let go = this.$el.querySelector('[data-action="' + name + '"]');
        if(go != null) {
          let pl = go.parent('li');
          if(pl != null) {
            pl.show();
          }
        }
      }
    }

    ImageToolbar.prototype.highlight = function (tag) {
      const tg = this.$el.querySelector('[data-action="' + tag + '"]');
      if(tg != null) {
        let tgp = tg.parent("li");
        if(tgp != null) {
          tgp.addClass('active');
        }
      }
    };

    /** layout related modifications **/
    ImageToolbar.prototype.removeFigure = function (figure) {
      var container = figure.closest('.block-grid-row');
      if (container != null) {
        figure.remove();
        var remaining = container.querySelectorAll('.item-figure');
        if (remaining.length) {
          container.attr('data-paragraph-count', remaining.length);
          this.current_editor.$el.trigger({
            type: 'Katana.Images.Restructure',
            container: container,
            count: remaining.length,
            figures: remaining
          });
        }

        var grid = container.closest('.block-grid');
        if (remaining.length == 0) { // row is empty now, remove it
          container.remove();
        }
        // check if we grid has any image left inside
        var gridImages = grid.querySelectorAll('.item-image');
        if (gridImages.length) {
          var len = gridImages.length;
          if (len > 1) { // more than one image remaining, just update para count for the grid
            grid.attr('data-paragraph-count', len);
          } else {
            // one image remains, unwrap this baby
            this.unwrapSingleFigure(grid);
          }
        } else { // don't have any image left in grid remove it.. // should never happen, we should just unwrap at last figure remaining in grid
          grid.remove();
        }
        

      } else {
        this.current_editor.replaceWith("p", figure);
        this.current_editor.setRangeAt(document.querySelector(".item-selected"));
      }
    };

    ImageToolbar.prototype.unwrapSingleFigure = function (container) {
      var figures = container.querySelectorAll('.item-figure'),
          moveIn,
          firstGraf;

      if (figures.length == 1) {
        // try to move content in the upper section if we have one..
        moveIn = container.prev('.block-content-inner');
        if (moveIn != null) {
          const itemFigures = container.querySelectorAll('.item-figure');
          itemFigures.forEach( ll => {
            moveIn.appendChild(ll);
          });
          container.remove();
          figures.removeClass('figure-in-row can-go-right can-go-down');
          figures.removeAttribute('style');
        } else {
          moveIn = container.next('.block-content-inner');
          if (moveIn != null) {
            const allFirst = moveIn.children;
            const vAlLFirst = Array.prototype.filter.call(allFirst, el => { return el.classList.contains('item'); });
            firstGraf = vAlLFirst.length > 0 ? vAlLFirst[0] : null;

            if(firstGraf != null) {
              let itf = container.querySelector('.item-figure');
              if(itf != null) {
                itf.insertBefore(firstGraf);
              }
            }else {
              container.querySelectorAll('.item-figure').forEach(el => {
                moveIn.appendChild(el);
              })
            }
            container.remove();
            figures.removeClass('figure-in-row can-go-right can-go-down');
            figures.removeAttribute('style');
          } else {
            container.removeClass('block-grid figure-focused can-go-right can-go-down')
            .addClass('center-column')
            .removeAttribute('data-paragraph-count');
            figures.removeClass('figure-in-row');
            figures.removeAttribute('style');
            figures.unwrap();
          }
        }

        var ig = figures.querySelectorAll('.item-image');
        if (ig.length) {
          ig = ig[0];
          this._setAspectRatio(figures, ig.naturalWidth, ig.naturalHeight);
        }
      }

      this.current_editor.cleanUpInnerSections();
    };

    ImageToolbar.prototype._setAspectRatio = function (figure, w, h) {
      var fill_ratio, height, maxHeight, maxWidth, ratio, result, width;
      maxWidth = 760;
      maxHeight = 700;
      ratio = 0;
      width = w;
      height = h;

      if (figure.hasClass('figure-in-row')) {
        maxWidth = figure.closest('.block-grid-row').width();
      }
      
      if (width > maxWidth) {
        ratio = maxWidth / width;
        height = height * ratio;
        width = width * ratio;
      } else if (height > maxHeight) {
        ratio = maxHeight / height;
        width = width * ratio;
        height = height * ratio;
      }

      fill_ratio = height / width * 100;

      var figP = figure.querySelector(".padding-cont");
      if(figP != null) {
        figP.style.maxWidth = width;
        figP.style.maxHeight = height;
      }
      
      var figPB = figure.querySelector(".padding-box");
      if(figPB != null) {
        figPB.style.paddingBottom = fill_ratio + "%";
      }

    }

    // background image related
    ImageToolbar.prototype.pushBackgroundContainer = function () {
      var figure = document.querySelector('.item-figure.item-selected'),
          isIFrame = figure != null ? figure.hasClass('item-iframe') : false;

      if (figure == null) {
        return;
      }

      var img = figure.querySelector('img'),
          tmpl = isIFrame ? u.generateElement(this.current_editor.templateBackgroundSectionForVideo()) : u.generateElement(this.current_editor.templateBackgroundSectionForImage()),
          bgImg = tmpl.querySelector('.block-background-image').attr('style', 'background-image:url(' + img.attr('src') + ')'),
          aspectLock = tmpl.querySelector('.block-background'),
          bottomSection,
          currentSection,
          isFirst = false;

      aspectLock.attr('data-height', img.attr('data-height'));
      aspectLock.attr('data-width', img.attr('data-width'));
      aspectLock.attr('data-image-id', img.attr('data-image-id'));
      aspectLock.attr('data-aspect', figure.querySelector('.padding-box').attr('style'));

      if (figure.hasClass('figure-full-width')) {
        aspectLock.attr('data-style', figure.querySelector('.padding-cont').attr('data-style'));  
      }else {
        aspectLock.attr('data-style', figure.querySelector('.padding-cont').attr('style'));  
      }

      if (!figure.hasClass('item-text-default')) {
        var caption = tmpl.querySelector('.item-sectionCaption');
        caption.innerHTML = figure.querySelector('.figure-caption').innerHTML;
        caption.removeClass('item-text-default');
      }

      if (figure.hasClass('item-iframe')) {
        bgImg.attr('data-frame-url', img.attr('data-frame-url'));
        bgImg.attr('data-frame-aspect', img.attr('data-frame-aspect'));
      }

      this.current_editor.splitContainer(figure, tmpl, false);

      figure.parentNode.removeChild(figure);

      // if we are the only section left after mergin we create one at the bottom of the image container
      if (tmpl.hasClass('block-first block-last')) {
        var sectionTmpl = u.generateElement(this.current_editor.getSingleSectionTemplate());
            sectionTmpl.querySelector('.main-body').appendChild(u.generateElement(this.current_editor.getSingleLayoutTempalte()));
            sectionTmpl.querySelector('.main-body .center-column').appendChild(u.generateElement(this.current_editor.baseParagraphTmpl()));
        sectionTmpl.insertAfter(tmpl);
        this.current_editor.fixSectionClasses();
      }
      tmpl.addClass('figure-focused');

      if (!isIFrame) {
        tmpl.addClass('talk-to-canvas');
      }

      this.current_editor.parallaxCandidateChanged()
      return tmpl;
    };

    ImageToolbar.prototype.pullBackgroundContainer = function () {
      var section = document.querySelector('.figure-focused'),
          isIFrame = section != null ? section.hasClass('section--video') : false,
          figure,
          currentContent,
          backgrounded,
          backgroundedImage,

          path,
          appendInSection,
          onlyOneSection = false,
          caption,
          ig;

      if (section == null || !section.hasClass('block-content')) {
        return;
      }

      figure = isIFrame ? u.generateElement(this.current_editor.getFrameTemplate()) : u.generateElement(this.current_editor.getFigureTemplate());
      backgrounded = section.querySelector('.block-background');
      backgroundedImage = section.querySelector('.block-background-image');
      path = backgroundedImage != null ? u.getStyle(backgroundedImage , 'backgroundImage') : null;
      captionCurrent = section.querySelector('.item-sectionCaption');
      currentContent = section.querySelector('.main-body').querySelector('.block-content-inner');

      var figureName = figure.attr('name');
      
      path = path.replace('url(','').replace(')','');
      path = path.replace('"','').replace('"','');

      ig = figure.querySelector('img');

      ig.attr('src', path);
      ig.attr('data-width', backgrounded.attr('data-width'));
      ig.attr('data-height', backgrounded.attr('data-height'));
      ig.attr('data-image-id', backgrounded.attr('data-image-id'));

      if (isIFrame) {
        ig.attr('data-frame-url', backgroundedImage.attr('data-frame-url'));
        ig.attr('data-frame-aspect', backgroundedImage.attr('data-frame-aspect'));  
        figure.addClass('can-go-background');
      }
    
      figure.querySelector('.padding-box').attr('style', backgrounded.attr('data-aspect'));
      figure.querySelector('.padding-cont').attr('style', backgrounded.attr('data-style'));

      //remove the continue writing 
      const pt = section.querySelector('.placeholder-text');
      if(pt != null) {
        const pti = pt.closest('.item');
        if(pti != null) {
          pti.remove();
        }
      }

      caption = figure.querySelector('.figure-caption');

      if (captionCurrent != null && !captionCurrent.hasClass('item-text-default')) {
        caption.innerHTML = captionCurrent.innerHTML;
        figure.removeClass('item-text-default');
      }

      figure.wrap(this.current_editor.getSingleLayoutTempalte());

      figure = figure.closest('.center-column');

      if (section.nextElementSibling != null) {
        var sect = section.nextElementSibling,
            inner = sect.querySelector('.main-body');
        if(inner != null) {
          inner.insertBefore(currentContent, inner.firstChild);
          //u.prependNode(currentContent, inner);
          inner.insertBefore(figure, inner.firstChild);
//          u.prependNode(figure, inner);
          this.current_editor.mergeInnerSections(sect);
        }
        section.parentNode.removeChild(section);
      } else if (section.previousElementSibling != null) {
        var sect = section.previousElementSibling,
            inner = sect.querySelector('.main-body');
        if(inner != null) {
          inner.appendChild(figure);
          inner.appendChild(currentContent);
          this.current_editor.mergeInnerSections(sect);
        }
        section.parentNode.removeChild(section);
      }else {
        onlyOneSection = true;
        var newSection = u.generateElement(this.current_editor.getSingleSectionTemplate()),
            innerSection =  newSection.querySelector('.main-body');

        innerSection.appendChild(figure);
        innerSection.appendChild(currentContent);
        innerSection.insertAfter(section);
        section.parentNode.removeChild(section);
      }

      this.current_editor.removeUnnecessarySections();
      this.current_editor.fixSectionClasses();

      figure = figure.querySelector('[name="'+figureName+'"]');

      if(figure != null) {
        this.current_editor.markAsSelected(figure);
        figure.addClass('figure-focused').removeClass('uploading');
        let fpct = figure.querySelector('.padding-cont');
        if(fpct != null) {
          fpct.addClass('selected');
        }
      }
      
      this.current_editor.setupFirstAndLast();

      this.current_editor.parallaxCandidateChanged()
    };
    // backgronnd image related ends 

    return ImageToolbar;

  })(Katana.Toolbar);
}).call(this);
(function () {
  var u = Katana.utils;


  Katana.Toolbar.TextToolbar = (function(_super) {
    u.__extends(TextToolbar, _super);


    var NUMBER_HONE = 49, //header 1
      NUMBER_HTWO = 50, //header 2
      NUMBER_HTHREE = 51, // header 3
      NUMBER_QUOTE = 52; // quote
      NUMBER_CODE_BLOCK = 53, // code block

      CHAR_CENTER = 69, // E with Ctrl, align center
      CHAR_LINK = 75; // k for link link 

    function TextToolbar() {
      this.handleClick = u.__bind(this.handleClick, this);
      this.createlink = u.__bind(this.createlink, this);
      this.handleKeyDown = u.__bind(this.handleKeyDown, this);
      this.handleInputEnter = u.__bind(this.handleInputEnter, this);
      this.shortCutKey = u.__bind(this.shortCutKey, this);
      this.hide = u.__bind(this.hide, this);

      this.initialize = u.__bind(this.initialize, this);
      return TextToolbar.__super__.constructor.apply(this, arguments);
    }

    TextToolbar.prototype.hide = function () {
      this.elNode.removeClass("mf-menu--linkmode");
      this.elNode.addClass('hide');
    };

    TextToolbar.prototype.events = {
      "mousedown li": "handleClick",
      "click .mf-menu-linkinput .mf-menu-button": "closeInput",
      "keypress input": "handleInputEnter",
      "keydown input": "handleKeyDown"
    };

    TextToolbar.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.current_editor = opts.editor;
      this.mode = opts.mode;
      this.config = opts.textToolbarConfig || this.defaultConfig();

      this.commandsReg = {
        block: /^(?:p|h[1-6]|blockquote|pre)$/,
        inline: /^(?:bold|italic|underline|insertorderedlist|insertunorderedlist|indent|outdent)$/,
        source: /^(?:insertimage|createlink|unlink)$/,
        insert: /^(?:inserthorizontalrule|insert)$/,
        wrap: /^(?:code)$/
      };
      this.lineBreakReg = /^(?:blockquote|pre|div|p)$/i;
      this.effectNodeReg = /(?:[pubia]|h[1-6]|blockquote|[uo]l|li|strong|em)/i;
      return this.strReg = {
        whiteSpace: /(^\s+)|(\s+$)/g,
        mailTo: /^(?!mailto:|.+\/|.+#|.+\?)(.*@.*\..+)$/,
        http: /^(?!\w+?:\/\/|mailto:|\/|\.\/|\?|#)(.*)$/
      };
    };

    TextToolbar.prototype.defaultConfig = function () {
      if(this.mode == 'write') {
        var o = {
          buttons: [
          {a:'bold',i:'bold'},
          {a:'italic',i:'italic'}, 
          {a:'h2',i:'H2',k: NUMBER_HONE }, 
          {a:'h3',i:'H3',k: NUMBER_HTWO }, 
          {a:'h4',i:'H4',k: NUMBER_HTHREE }, 
          {a:'center',i:'text-center',k:CHAR_CENTER },
          {a:'blockquote',i:'quote',k:NUMBER_QUOTE }, 
          {a:'cite',i:'cite'},
          {a:'createlink',i:'link', k: CHAR_LINK},
          ]
        }; 

        if (this.current_editor.publicationMode) {
          o.buttons.push({a:'buttonprimary',i:'button'});
          o.buttons.push({a:'buttontrans', i:'button-trans'});
        }
        return o;
      }else if(this.mode == 'edit') {
        return {
          buttons: [
          {a:'highlight',i:'highlight' },
          {a:'color',i:'color'}
          ]
        }; 
      }else {
        return {
          buttons: [
          /*{a:'comment',i: 'comment'}, */
          {a:'share',i:'twitter'}
          ]
        }; 
      }
    };

    TextToolbar.prototype.template = function () {
      let html = `<div class="mf-menu-linkinput">
          <input class="mf-menu-input" placeholder="https://">
          <div class="mf-menu-button mf-link-close">&#215;</div></div>
          <ul class='mf-menu-buttons'>`;

      this.config.buttons.forEach( item => {
        return html += `<li class='mf-menu-button'><i class="mf-icon mfi-${item.i}"  data-action="${item.a}"></i></li>`;
      });
      
      html += `</ul>`;
      return html;
    };

    TextToolbar.prototype.built = false;

    TextToolbar.prototype.render = function () {
      if(!this.built) {
        var html = this.template();
        this.elNode.innerHTML = html;
        this.built = true;  
      }      
      return this.show();
    };

    TextToolbar.prototype.refresh = function() {
      this.elNode.querySelectorAll('.mf-menu-button').forEach(el => {
        el.removeClass('hide');
      });
    };

    TextToolbar.prototype.show = function () {
      this.current_editor.toolbar._show();
    };

    TextToolbar.prototype._show = function () {
      this.elNode.addClass("mf-menu--active");
      this.elNode.removeClass('hide');
      return this.displayHighlights();
    };

    // click events
    TextToolbar.prototype.handleClick = function(ev, matched) {
      var action, element;
      if(matched) {
        element = matched.querySelector('.mf-icon');
      } else {
        element = ev.currentTarget.querySelector('.mf-icon');
      }
      
      if(element != null) {
        action = element.attr("data-action");
        var s = u.saveSelection();
        if(s != null) {
          this.savedSel = s;
        }
        
        if (/(?:createlink)/.test(action)) {
          this.actionIsLink(ev.currentTarget);
        } else {
          this.menuApply(action);
        }
      }
      return false;
    };

    TextToolbar.prototype.actionIsLink = function (target, event) {
      
      if (target != null && target.addClass("active")) {
        this.elNode.querySelector("input.mf-menu-input").value = '';
        this.removeLink();
      } else {
        this.elNode.addClass("mf-menu--linkmode");
        var sel = u.saveSelection();
        this.savedSel = sel;
        this.elNode.querySelector("input.mf-menu-input").focus();
        if (typeof event != 'undefined') {
          event.preventDefault();
        }
      }
    };

    TextToolbar.prototype.shortCutKey = function (key, event) {
      var _this = this;
      var shouldOpenLink = function () {
        var text = _this.current_editor.getSelectedText();
        return text.length ? true : false;
      };

      if (this.mode == 'write') {
        var config = this.defaultConfig();
        var action = '';
        var node = this.current_editor.elNode.querySelector('.item-selected');
        if (node && !node.hasClass('item-figure')) {
          this.savedSel = u.saveSelection();
          switch(key) {
            case NUMBER_HONE:
              action = 'h2';
              break;
            case NUMBER_HTWO:
              action = 'h3';
              break;
            case NUMBER_HTHREE:
              action = 'h4';
              break;
            case NUMBER_QUOTE: 
              action = 'blockquote';
              break;
            case NUMBER_CODE_BLOCK:
              action = 'code';
              break;
            case CHAR_CENTER:
              action = 'center';
              event.preventDefault();
              break;
            case CHAR_LINK:
              action = '';
              if (shouldOpenLink()) {
                this.actionIsLink(this.elNode.querySelector('[data-action="createlink"]').closest('li'), event);
              }
              break;
          };  

          if (action != '') {
            this.menuApply(action);
            return false;
          }
          if (key == CHAR_LINK) {
            return false;
          }
        }
      }

    };

    TextToolbar.prototype.closeInput = function(e) {
      this.elNode.removeClass("mf-menu--linkmode");
      return false;
    };

    TextToolbar.prototype.handleKeyDown = function (e) {
      var which = e.which,
        bd,
        overLay;
      if (which == 27) { 
        this.hide();
        u.restoreSelection(this.savedSel);
      }
    };

    TextToolbar.prototype.handleInputEnter = function(e, matched) {
      if (e.which === 13) {
        u.restoreSelection(this.savedSel);
        if(matched) {
          return this.createlink(matched);
        } else {
          return this.createlink(e.target);
        }
      }
    };

    TextToolbar.prototype.removeLink = function() {
      var elem;
      this.menuApply("unlink");
      elem = this.current_editor.getNode();
      return this.current_editor.cleanContents($(elem));
    };

    TextToolbar.prototype.createlink = function(input) {
      var action, inputValue;
      this.elNode.removeClass("mf-menu--linkmode");
      if (input.value) {
        inputValue = input.value.replace(this.strReg.whiteSpace, "").replace(this.strReg.mailTo, "mailto:$1").replace(this.strReg.http, "http://$1");
        return this.menuApply("createlink", inputValue);
      }
      action = "unlink";
      return this.menuApply(action);
    };

    TextToolbar.prototype.menuApply = function(action, value) {
       if (this.commandsReg.block.test(action)) {
        this.commandBlock(action);
      } else if (this.commandsReg.inline.test(action) || this.commandsReg.source.test(action)) {
        this.commandOverall(action, value);
      } else if (this.commandsReg.insert.test(action)) {
        this.commandInsert(action);
      } else if (this.commandsReg.wrap.test(action)) {
        this.commandWrap(action);
      } else if(action == 'center') {
        this.commandCenter(action);
      } else if(action == 'buttontrans' || action == 'buttonprimary') {
        this.commandButton(action);
      } else if(action == 'comment' || action == 'share') {
        this.readModeItemClick(action);
      } else if (action == 'cite') {
        this.commandCite(); 
      }
      return false;
    };

    TextToolbar.prototype.commandCite = function () {
      var nd = u.getNode();
      if (nd.tagName == 'CITE') {
        var quote = nd.closest('blockquote');
        quote.removeClass('with-cite');
        nd.children.unwrap();
      } else {
        if (nd.hasClass('with-cite')) {
          nd.removeClass('with-cite');
        } else {
          var sel = u.selection();
          if (sel.rangeCount) {
            var range = sel.getRangeAt(0).cloneRange();
            var ele = document.createElement('cite');
            range.surroundContents(ele);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          nd.addClass('with-cite');
        }  
      }
    };


    TextToolbar.prototype.commandButton = function(action) {
      var nd = u.getNode();
      if (nd.length && nd.tagName.toLowerCase() == 'a') {
        if (action == 'buttonprimary') {
          if (nd.hasClass('trans')) {
            nd.removeClass('trans')
          } else if (nd.hasClass('btn')) {
            nd.removeClass('btn');
          } else{
            nd.addClass('btn');
          }
        } else if (action == 'buttontrans') {
          if (nd.hasClass('trans')) {
            nd.removeClass('btn trans');
          } else {
            nd.addClass('btn trans');  
          }
        }
        this.displayHighlights();
      }
    };

    TextToolbar.prototype.readModeItemClick = function(action) {
      var sel = document.querySelector('.item-selected');
      if (action == 'comment') {
        let evnt = new CustomEvent('Katana.Event.Nodes', {
          type: 'Katana.Event.Notes',
          selectedText: this.current_editor.getSelectedText(),
          node: sel
        });
        this.current_editor.elNode.dispatchEvent(evnt);
      } else if (action == 'share') {
        let evnt = new CustomEvent('Katana.Event.Share', {
          type: 'Katana.Event.Share',
          selectedText: this.current_editor.getSelectedText(),
          node: sel
        });
        this.current_editor.elNode.dispatchEvent(evnt);
      }
    };

    TextToolbar.prototype.refreshMenuState = function () {
      this.built = false;
      this.render();
    };

    TextToolbar.prototype.commandCenter = function (cmd, val) {
      var node;
      node = this.current_editor.current_node;
      if (!node) {
        return;
      }
      node.classList.toggle('text-center');

      this.displayHighlights();
      this.current_editor.handleTextSelection(node);
    };

    TextToolbar.prototype.commandOverall = function(cmd, val) {
      var n, origNode;
      
      origNode = this.current_editor.current_node,
      extrakls = false;

      if ( origNode.hasClass('text-center') ) {
        extrakls = 'text-center';
      }

      if (val == 'blockquote' && origNode.tagName == 'BLOCKQUOTE') {
        extrakls = 'pullquote';
      }
      
      if (!val) {
        val = null;
      }

      if (document.execCommand(cmd, false, val)) {
        n = this.current_editor.getNode();
        this.current_editor.setupLinks(n.querySelectorAll("a"));

        this.displayHighlights();

        if (n.parentNode && n.parentNode.hasClass("block-content-inner")) {

          if (extrakls) {
            n = this.current_editor.addClassesToElement(n, extrakls);
          } else {
            n = this.current_editor.addClassesToElement(n);  
          }
          this.current_editor.setElementName(n);
        }

        this.current_editor.handleTextSelection(n);
      }
    };

    TextToolbar.prototype.commandInsert = function(name) {
      var node;
      node = this.current_editor.current_node;
      if (!node) {
        return;
      }
      this.current_editor.current_range.selectNode(node);
      this.current_editor.current_range.collapse(false);
      return this.commandOverall(node, name);
    };

    TextToolbar.prototype.commandBlock = function(name) {
      var list, node, $node;
      node = this.current_editor.current_node;
      list = this.effectNode(this.current_editor.getNode(node), true);

      if(node.tagName == 'BLOCKQUOTE' && !node.hasClass('pullquote')) {
        // leave it.. as it is 
      }else if(node.tagName == 'BLOCKQUOTE' && node.hasClass('pullquote')) {
        name = "p";
      }else if (list.indexOf(name) !== -1) {
        name = "p";
      }

      return this.commandOverall("formatblock", name);
    };

    TextToolbar.prototype.commandWrap = function(tag) {
      var node, val;
      node = this.current_editor.current_node;
      val = "<" + tag + ">" + u.selection() + "</" + tag + ">";
      return this.commandOverall("insertHTML", val);
    };

    TextToolbar.prototype.effectNode = function(el, returnAsNodeName) {
      var nodes;
      nodes = [];
      el = el || this.current_editor.elNode;
      while (!el.hasClass('block-content-inner')) {
        if (el.nodeName.match(this.effectNodeReg)) {
          nodes.push((returnAsNodeName ? el.nodeName.toLowerCase() : el));
        }
        el = el.parentNode;
      }
      return nodes;
    };

     TextToolbar.prototype.displayHighlights = function() {
      var nodes, active = this.elNode.querySelector('.active');
      if(active != null) {
        active.removeClass("active");
      }
      this.refresh();
      nodes = this.effectNode(u.getNode());

      this.elNode.querySelectorAll(".mfi-button, .mfi-button-trans, .mfi-cite").forEach(el => {
        let li = el.closest('li');
        if(li  != null) {
          li.addClass('hide');
        }
      });
      let _this = this;
      nodes.forEach( (node) => {
          var tag;
          tag = node.nodeName.toLowerCase(),
          _thisEl = this.el;
          switch (tag) {
            case "a":
              _thisEl.querySelector('input').value = node.attr("href");
              tag = "link";
              break;
            case "i":
            case "em":
              tag = "italic";
              break;
            case "u":
              tag = "underline";
              break;
            case "b":
            case "strong":
              tag = "bold";
              break;
            case "code":
              tag = "code";
              break;
            case "ul":
              tag = "insertunorderedlist";
              break;
            case "ol":
              tag = "insertorderedlist";
              break;
            case "li":
              tag = "indent";
              break;
          }

          if (tag.match(/(?:h[1-6])/i)) {
            _thisEl.querySelectorAll(".mfi-bold, .mfi-italic, .mfi-quote").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });
          } else if (tag === "indent") {
            _thisEl.querySelectorAll(".mfi-H2, .mfi-H3, .mfi-H4, .mfi-quote").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });
          } else if(tag == 'figcaption' || tag == 'label') {
            _thisEl.querySelectorAll(".mfi-H2, .mfi-H3, .mfi-H4, .mfi-quote, .mfi-text-center").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });
          } else if(tag == 'blockquote') {
            _thisEl.querySelectorAll(".mfi-H2, .mfi-H3, .mfi-H4").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });
          }

          if (tag == 'link') {
          
            _thisEl.querySelectorAll(".mfi-button, .mfi-button-trans").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.removeClass('hide');
              }
            });
            if (node.hasClass('btn') & !node.hasClass('trans')) {
              _this.highlight('button');
              _thisEl.querySelectorAll('.mfi-button-trans').forEach( el => {
                const li = el.closest('li');
                if(li != null) {
                  li.removeClass('active');
                }
              });
            } else if(node.hasClass('trans')) {
              _thisEl.querySelectorAll('.mfi-button').forEach( el => {
                const li = el.closest('li');
                if(li != null) {
                  li.removeClass('active');
                }
              });
              _this.highlight('button-trans');
            }
          } 

          var prev = node.previousElementSibling,
            hasH2 = prev != null ? prev.hasClass('item-h2') : false,
            hasH3 = prev != null ? prev.hasClass('item-h3') : false,
            hasH4 = prev != null ? prev.hasClass('item-h4') : false;

          if(hasH2) {
            _thisEl.querySelectorAll(".mfi-H2, .mfi-quote").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });;
          }else if(hasH3) {
            _thisEl.querySelectorAll(".mfi-H3, .mfi-H2, .mfi-quote").forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });;
          }else if (hasH4) {
            _thisEl.querySelectorAll('.mfi-H2, .mfi-H3, .mfi-H4, .mfi-quote').forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });;
          }

          if(node.hasClass('text-center')) {
            _this.highlight('text-center');
          }
          if (node.hasClass('pullquote')) {
            _this.highlight('quote', true);
          }

          if (node.hasClass('pullquote')) {
            _this.highlight('quote', true);
            _thisEl.querySelectorAll('.mfi-italic, .mfi-text-center').forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });

            if (u.editableCaretAtEnd(node)) {
              _thisEl.querySelectorAll('.mfi-cite').forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.removeClass('hide');
              }
            });
            } 
          } 

          if (tag == 'cite') {
            _thisEl.querySelectorAll('.mfi-italic, .mfi-text-center, .mfi-bold').forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.addClass('hide');
              }
            });
            _thisEl.querySelectorAll('.mfi-cite').forEach( el => {
              const li = el.closest('li');
              if(li != null) {
                li.removeClass('hide');
              }
            });
            tag = 'cite';
          }

          if (tag == 'blockquote') {
            tag = 'quote';
          }
          
          return _this.highlight(tag);
      });
    };

    TextToolbar.prototype.highlight = function(tag, double) {
      if (['h4','h3','h2','h1'].indexOf(tag) != -1) {
        tag = tag.toUpperCase();
      }
      var ic = document.querySelector(".mfi-" + tag);
      // let icl = ic.closest("li");
      if(!double) {
        if(ic != null) {
          ic.addClass('doble');
        }
      }
      if(ic != null) {
        return ic.addClass("active");
      }
    };

    return TextToolbar;

  })(Katana.Toolbar);
}).call(this);