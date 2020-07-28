const isCaretAtStartOfNode = (node, range) => {
  const preRange = document.createRange();
  preRange.selectNodeContents(node);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().trim().length === 0;
};

const isCaretAtEndOfNode = (node, range) => {
  const postRange = document.createRange();
  postRange.selectNodeContents(node);
  postRange.setStart(range.endContainer, range.endOffset);
  return postRange.toString().trim().length === 0;
};

const editableRange = () => {
  const sel = window.getSelection();
  if (!(sel.rangeCount > 0)) {
    return null;
  }
  return sel.getRangeAt(0);
};

const Utils = {
  scrollHandlers: {},
  scrollAttached: false,
  LINE_HEIGHT: 20,
  onIOS: () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipod|ipad/.test(userAgent);
    return ios;
  },

  log: (message, force) => {
    if (window.debugMode || force) {
      console.log(message); // eslint-disable-line no-console
    }
  },

  incrementCounter: (index) => {
    let ind;
    if (typeof index === 'number') {
      ind = index + 1;
      return ind;
    } if (typeof index === 'string') {
      return String.fromCharCode(index.charCodeAt(0) + 1);
    }
    return null;
  },

  stopEvent: (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  },

  simpleStop: (event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
  },

  getBase64Image: (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  },

  generateId: () => Math.random().toString(36).slice(8),

  saveSelection: () => {
    let i; let len; let ranges; let
      sel;
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
    } else if (document.selection && document.selection.createRange) {
      return document.selection.createRange();
    }
    return null;
  },

  restoreSelection: (savedSel) => {
    let i; let len; let
      sel;
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
      } else if (document.selection && savedSel.select) {
        savedSel.select();
      }
    }
  },

  getNode: () => {
    let container; let range; let
      sel;
    range = undefined;
    sel = undefined;
    container = undefined;
    if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      return range.parentElement();
    } if (window.getSelection) {
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
        }
        return container;
      }
    }
    return null;
  },

  getSelectionDimensions: () => {
    let height = 0; let width = 0; let range;
    let sel = document.selection;
    let rect;

    if (sel) {
      if (sel.type !== 'Control') {
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
      width,
      height,
      top: rect.top,
      left: rect.left,
    };
  },

  getImageSelectionDimension: () => {
    let figure;

    const blockGrid = document.querySelector('.grid-focused');

    if (blockGrid != null) {
      figure = blockGrid;
    } else {
      figure = document.querySelector('.figure-focused:not(.block-content-inner)');
    }

    if (figure == null) {
      return null;
    }
    return figure.getBoundingClientRect();
  },

  getCaretPosition: (editableDiv) => {
    let caretPos = 0;
    let range;
    let sel;
    let tempEl;
    let tempRange;

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
        tempEl = document.createElement('span');
        editableDiv.insertBefore(tempEl, editableDiv.firstChild);
        tempRange = range.duplicate();
        tempRange.moveToElementText(tempEl);
        tempRange.setEndPoint('EndToEnd', range);
        caretPos = tempRange.text.length;
      }
    }
    return caretPos;
  },

  selection: () => {
    if (window.getSelection) {
      return window.getSelection();
    } if (document.selection && document.selection.type !== 'Control') {
      return document.selection;
    }
    return null;
  },

  elementsHaveSameClasses: (first, second) => {
    const arr1 = [...first.classList];
    const arr2 = [...second.classList];
    if (arr1.length !== arr2.length) {
      return false;
    }
    arr1.sort();
    arr2.sort();
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  },

  urlIsFromDomain: (url, domain) => {
    const a = document.createElement('a');
    a.href = url;
    if (typeof a.hostname !== 'undefined' && a.hostname.indexOf(domain) !== -1) {
      return true;
    }
    return false;
  },

  urlIsForImage: (url) => {
    const a = document.createElement('a');
    const path = a.pathname;

    a.href = url;
    if (path.indexOf('.jpeg') !== -1) {
      return true;
    }
    if (path.indexOf('.jpg') !== -1) {
      return true;
    }
    if (path.indexOf('.png') !== -1) {
      return true;
    }
    if (path.indexOf('.gif') !== -1) {
      return true;
    }
    return false;
  },

  getWindowWidth: () => window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth,

  getWindowHeight: () => window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight,

  generateElement: (txt) => {
    const d = document.createElement('div');
    d.innerHTML = txt;
    if (d.children.length === 0) {
      return null;
    }
    if (d.children.length === 1) {
      return d.firstChild;
    }
    return d.children;
  },

  arrayToNodelist: (arr) => {
    const fragment = document.createDocumentFragment();
    arr.forEach((item) => {
      fragment.appendChild(item.cloneNode());
    });
    return fragment.childNodes;
  },

  insertAfter: (el, referenceNode) => referenceNode.insertAdjacentElement('afterend', el),

  prependNode: (el, refNode) => {
    let els = el;
    if (typeof el.length === 'undefined') {
      els = [el];
    }
    els.forEach((e) => {
      if (refNode != null && refNode.parentNode != null) {
        refNode.parentNode.insertBefore(e, refNode.parentNode.firstElementChild);
      }
    });
    return null;
  },

  scrollToTop: (position) => {
    const pos = typeof position === 'undefined' ? 0 : position;
    const scrollDuration = 1000;
    const scrollStep = -window.scrollY / (scrollDuration / 15);
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(pos, scrollStep);
      } else clearInterval(scrollInterval);
    }, 15);
  },

  isEqual: (obj1, obj2) => {
    const obOneKeys = Object.keys(obj1);
    for (let i = 0; i < obOneKeys.length; i++) {
      const p = obOneKeys[i];
      if (p in obj1 !== p in obj2) return false;
      switch (typeof (obj1[p])) {
        case 'object':
          if (!Object.compare(obj1[p], obj2[p])) return false;
          break;
        case 'function':
          if (typeof (obj2[p]) === 'undefined' || (p !== 'compare' && obj1[p].toString() !== obj2[p].toString())) return false;
          break;
        default:
          if (obj1[p] !== obj2[p]) return false;
      }
    }

    const obTwoKeys = Object.keys(obj2);
    for (let i = 0; i < obTwoKeys.length; i++) {
      const p = obTwoKeys[i];
      if (typeof (obj1[p]) === 'undefined') return false;
    }
    return true;
  },

  getStyle: (el, prop) => {
    if (el && el.style && el.style[prop] !== '') {
      return el.style[prop];
    }
    return getComputedStyle(el).getPropertyValue(prop.toDashedProperty());
  },

  setCaretAtPosition: (element, position) => {
    if (element == null) {
      return;
    }
    const pos = typeof position === 'undefined' ? 0 : position;
    const range = document.createRange();
    const sel = window.getSelection();

    if (element.childNodes && element.childNodes.length > 0) {
      range.setStart(element.childNodes[0], pos);
    } else {
      range.setStart(element, pos);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  },

  editableFocus: (el, atStart) => {
    let atTheStart = atStart;
    if (!atStart) {
      atTheStart = true;
    }
    if (!el.hasAttribute('contenteditable')) {
      return;
    }
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      sel.removeAllRanges();
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(atTheStart);
    sel.addRange(range);
  },

  editableCaretOnLastLine: (el) => {
    let cbtm;
    const range = editableRange();
    if (!range) {
      return false;
    }
    if (isCaretAtEndOfNode(el, range)) {
      return true;
    } if (isCaretAtStartOfNode(el, range)) {
      cbtm = el.getBoundingClientRect().top + Utils.LINE_HEIGHT;
    } else {
      cbtm = range.getClientRects()[0].bottom;
    }
    const ebtm = el.getBoundingClientRect().bottom;
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

  registerForScroll: (key, cb) => {
    Utils.scrollHandlers[key] = cb;
  },

  unregisterFromScroll: (key) => {
    if (Utils.scrollHandlers[key]) {
      delete Utils.scrollHandlers[key];
    }
  },

  animationFrame: (() => window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.oRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function (callback) {
        window.setTimeout(callback, 1000 / 60);
      })(),

  handleScroll: () => {
    if (Utils.scrollAttached) {
      return;
    }
    Utils.scrollAttached = true;
    const d = document;
    const wHeight = Utils.getWindowHeight();
    let didScroll = false;
    const body = d.querySelector('body');
    const self = Utils;

    function hasScrolled() {
      const st = d.body.scrollTop;
      const cbs = self.scrollHandlers;
      const cbKeys = Object.keys(cbs);
      for (let i = 0; i < cbKeys.length; i++) {
        const fn = cbKeys[i];
        fn(st, body, d.documentElement.scrollHeight, wHeight);
      }
      didScroll = false;
    }

    function checkScroll() {
      if (!didScroll) {
        didScroll = true;
        Utils.animationFrame(hasScrolled);
      }
    }
    // TODO pipe debounce
    window.addEventListener('scroll', checkScroll);
  },

  editableCaretAtStart: (el) => {
    const range = editableRange();
    if (!range) {
      return false;
    }
    return isCaretAtStartOfNode(el, range);
  },

  editableCaretAtEnd: (el) => {
    const range = editableRange();
    if (!range) {
      return false;
    }
    return isCaretAtEndOfNode(el, range);
  },

  editableCaretOnFirstLine: (el) => {
    let ctop;
    const range = editableRange();
    if (!range) {
      return false;
    }
    if (isCaretAtStartOfNode(el, range)) {
      return true;
    } if (isCaretAtEndOfNode(el, range)) {
      ctop = el.getBoundingClientRect().bottom - Utils.LINE_HEIGHT;
    } else {
      ctop = range.getClientRects()[0].top;
    }
    const etop = el.getBoundingClientRect().top;
    return ctop < etop + Utils.LINE_HEIGHT;
  },
};

export default Utils;
