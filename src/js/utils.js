'use strict';
const is_caret_at_start_of_node = (node, range) => {
  const pre_range = document.createRange();
  pre_range.selectNodeContents(node);
  pre_range.setEnd(range.startContainer, range.startOffset);
  return pre_range.toString().trim().length === 0;
};

const is_caret_at_end_of_node = (node, range) => {
  const post_range = document.createRange();
  post_range.selectNodeContents(node);
  post_range.setStart(range.endContainer, range.endOffset);
  return post_range.toString().trim().length === 0;
};

const editableIsCaret = () => {
  return window.getSelection().type === 'Caret';
};

const editableRange = () => {
  const sel = window.getSelection();
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

const editableSetRange = (range) => {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    sel.removeAllRanges();
  }
  return sel.addRange(range);
};

const Utils = {
  scrollHandlers: {},
  scrollAttached: false,
  LINE_HEIGHT: 20,
  onIOS: () => {
    const userAgent = window.navigator.userAgent.toLowerCase(),
      ios = /iphone|ipod|ipad/.test( userAgent );
      return ios;
  },

  log: (message, force) => {
    if (window.debugMode || force) {
      return console.log(message);
    }
  },

  incrementCounter: (index) => {
    if (typeof index == "number") {
      index = index + 1;
      return index;
    }else if(typeof index == "string") {
      return String.fromCharCode(index.charCodeAt(0) + 1);  
    }
    return null;
  },

  stopEvent : (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  },

  simpleStop : (event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
  },

  getBase64Image : (img) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  },

  generateId : () => {
    return Math.random().toString(36).slice(8);
  },

  saveSelection : () => {
    let i, len, ranges, sel;
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
  },

  restoreSelection : (savedSel) => {
    let i, len, sel;
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
  },

  getNode : () => {
    let container, range, sel;
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
  },

  getSelectionDimensions : () => {
    let height = 0, width = 0, range = void 0,
      sel = document.selection, rect;
    
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
  },

  getImageSelectionDimension : () => {
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
  },

  getCaretPosition : (editableDiv) => {
    let caretPos = 0 ,
    range = void 0, sel = void 0, tempEl, tempRange;
    
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
  },

  selection : () => {
    if (window.getSelection) {
      return selection = window.getSelection();
    } else if (document.selection && document.selection.type !== "Control") {
      return selection = document.selection;
    }
  },

  elementsHaveSameClasses : (first, second) => {
    let arr1 = [...first.classList],
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
  },
  
  urlIsFromDomain : (url, domain) => {
    let a = document.createElement('a');
    a.href = url;
    if (typeof a.hostname != 'undefined' && a.hostname.indexOf(domain) != -1) {
      return true;
    }
    return false;
  },

  urlIsForImage : (url) => {
    let a = document.createElement('a');
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
  },

  getWindowWidth : () => {
    return window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  },

  getWindowHeight : () => {
    return window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  },

  generateElement : (txt) => {
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
  },

  arrayToNodelist : (arr) => {
    const fragment = document.createDocumentFragment();
    arr.forEach(function(item){
      fragment.appendChild(item.cloneNode());
    });
    return fragment.childNodes;
  },

  insertAfter : (el, referenceNode) => {
    return referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  },

  prependNode : (el, refNode) => {
    if(typeof el.length == 'undefined') {
      el = [el];
    }
    el.forEach(e => {
      if(refNode != null && refNode.parentNode != null) {
        return refNode.parentNode.insertBefore(e, refNode.parentNode.firstElementChild);
      }
    })
    return null;
  },

  scrollToTop : (position) => {
    const pos = typeof position == 'undefined' ? 0 : position;
    const scrollDuration = 1000;
    const scrollStep = -window.scrollY / (scrollDuration / 15),
    scrollInterval = setInterval(() => {
      if ( window.scrollY != 0 ) {
        window.scrollBy( pos, scrollStep );
      }
      else clearInterval(scrollInterval); 
    }, 15);
  },

  isEqual : (obj1, obj2) => {
    for (let p in obj1) {
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
   
    for (let p in obj2) {
      if (typeof (obj1[p]) == 'undefined') return false;
    }
    return true;
  },

  getStyle : (el, prop) => {
    if(el && el.style && el.style[prop] != '') {
      return el.style[prop];
    }
    return getComputedStyle(el).getPropertyValue(prop.toDashedProperty());
  },

  setCaretAtPosition : (element, position) => {
    if (element == null) {
      return;
    }
    let pos = typeof position == 'undefined' ? 0 : position,
        range = document.createRange(),
        sel = window.getSelection();

    if (element.childNodes && element.childNodes.length > 0) {
      range.setStart(element.childNodes[0], pos);
    }else {
      range.setStart(element, pos);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  },

  editableFocus: (el, at_start) => {
    let range, sel;
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
  },

  editableCaretOnLastLine: (el) => {
    let cbtm, ebtm, range = editableRange();
    if (!range) {
      return false;
    }
    if (is_caret_at_end_of_node(el, range)) {
      return true;
    } else if (is_caret_at_start_of_node(el, range)) {
      cbtm = el.getBoundingClientRect().top + Utils.LINE_HEIGHT;
    } else {
      cbtm = range.getClientRects()[0].bottom;
    }
    ebtm = el.getBoundingClientRect().bottom;
    return cbtm > ebtm - Utils.LINE_HEIGHT;
  },

  outerWidth: (el) => {
    let width = el.offsetWidth;
    const style = getComputedStyle(el);
  
    width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    return width;
  },

  outerHeight: (el) => {
    let height = el.offsetHeight;
    const style = getComputedStyle(el);
  
    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    return height;
  },

  registerForScroll : (key, cb) => {
    Utils.scrollHandlers[key] = cb;  
  },

  unregisterFromScroll : (key) => {
    if (Utils.scrollHandlers[key]) {
      delete Utils.scrollHandlers[key];
    }
  },

  animationFrame : (() => {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
      }
    })(),

  handleScroll : (items) => {
    if (Utils.scrollAttached) {
      return;
    }
    Utils.scrollAttached = true;
    let d = document,
        w = window,
        wHeight = Utils.getWindowHeight(),
        didScroll = false,
        body = d.querySelector('body'),
        _this = Utils;

    function hasScrolled() {
      const st = d.body.scrollTop;
      const cbs = _this.scrollHandlers;
      for (let key in cbs) {
        if (cbs.hasOwnProperty(key)) {
          const fn = cbs[key];
          fn(st, body, d.documentElement.scrollHeight, wHeight);
        }
      }
      didScroll = false;
    }

    function checkScroll() {
      if (!didScroll) {
        didScroll = true;
        animationFrame(hasScrolled);
      }
    }
    //TODO pipe debounce
    window.addEventListener('scroll', checkScroll);
  },

  editableCaretAtStart: (el) =>  {
    const range = editableRange();
    if (!range) {
      return false;
    }
    return is_caret_at_start_of_node(el, range);
  },
  
  editableCaretAtEnd: (el) =>  {
    const range = editableRange();
    if (!range) {
      return false;
    }
    return is_caret_at_end_of_node(el, range);
  },
  
  editableCaretOnFirstLine : (el) => {
    let ctop, etop, range = editableRange();
    if (!range) {
      return false;
    }
    if (is_caret_at_start_of_node(el, range)) {
      return true;
    } else if (is_caret_at_end_of_node(el, range)) {
      ctop = el.getBoundingClientRect().bottom - Utils.LINE_HEIGHT;
    } else {
      ctop = range.getClientRects()[0].top;
    }
    etop = el.getBoundingClientRect().top;
    return ctop < etop + Utils.LINE_HEIGHT;
  }
};

export default Utils;