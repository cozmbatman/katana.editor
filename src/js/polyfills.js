/* eslint-disable */
String.prototype.killWhiteSpace = function () {
  return this.replace(/\s/g, '');
};

String.prototype.reduceWhiteSpace = function () {
  return this.replace(/\s+/g, ' ');
};

String.prototype.toDashedProperty = function () {
  return this.replace(/([a-z](?=[A-Z]))/g, '$1 ').replace(/\s/g, '-').toLowerCase();
};

String.prototype.isEmpty = function () {
  return this.trim().length === 0;
};

// polyfill IE9+ jquery.closest alternative
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    let el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

if (!Element.prototype.parent) {
  Element.prototype.parent = function () { // jquery .parent
    const el = this;
    if (el.parentNode == null) {
      return null;
    }
    if (el.parentNode.parentNode == null) {
      return null;
    }
    return el.parentNode.parentNode;
  };
}

if (!Element.prototype.parentsUntil) {
  Element.prototype.parentsUntil = function (s) {
    let el = this; let
      last = el;
    do {
      if (el.matches(s)) {
        return last;
      }
      last = el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

if (!Element.prototype.prev) {
  Element.prototype.prev = function (s) {
    let el = this;
    const all = [];
    while (el !== null) {
      el = el.previousElementSibling || el.previousSibling;
      if (el != null && el.nodeType === 1 && el.matches(s)) {
        all.push(el);
      }
    }
    // TODO maybe revere order of array
    return all.length == 0 ? null : (all.length == 1 ? all[0] : all);
  };
}

if (!Element.prototype.next) {
  Element.prototype.next = function (s) {
    let el = this;
    const all = [];
    while (el !== null) {
      el = el.nextElementSibling || el.nextSibling;
      if (el != null && el.nodeType === 1 && el.matches(s)) {
        all.push(el);
      }
    }
    return all.length == 0 ? null : (all.length == 1 ? all[0] : all);
  };
}

if (!Element.prototype.insertAfter) {
  Element.prototype.insertAfter = function (after) {
    const el = this;
    if (after == null) {
      return null;
    }
    if (after.parentNode == null) {
      return null;
    }
    after.parentNode.insertBefore(el, after.nextESibling);
  };
}

if (!Element.prototype.hasClass) {
  Element.prototype.hasClass = function (toTest) {
    const el = this;
    return el.classList.contains(toTest);
  };
}
if (!Element.prototype.toggleClass) {
  Element.prototype.toggleClass = function (toToggle) {
    const el = this;
    if (el.hasClass(toToggle)) {
      el.removeClass(toToggle);
    } else {
      el.addClass(toToggle);
    }
    return el;
  };
}

if (!Element.prototype.addClass) {
  Element.prototype.addClass = function (toAdd) {
    const el = this;
    toAdd = toAdd.trim();
    const all = toAdd.split(/\s/);
    if (all.length) {
      all.forEach((a) => {
        el.classList.add(a);
      });
    }
    return this;
  };
}

if (!Element.prototype.removeClass) {
  Element.prototype.removeClass = function (toRemove) {
    const el = this;
    toRemove = toRemove.trim();
    const all = toRemove.split(/\s/);
    if (all.length) {
      all.forEach((a) => {
        el.classList.remove(a);
      });
    }
    return this;
  };
}

if (!Element.prototype.attr) {
  Element.prototype.attr = function (key, value) {
    const el = this;
    if (typeof value === 'undefined') {
      return el.getAttribute(key);
    }
    el.setAttribute(key, value);
    return this;
  };
}

if (!Element.prototype.isElementInViewport) {
  Element.prototype.isElementInViewport = function () {
    const el = this;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
  };
}

if (!Element.prototype.isElementVerticallyInViewPort) {
  Element.prototype.isElementVerticallyInViewPort = function () {
    const el = this;
    const rect = el.getBoundingClientRect();
    const ch = (window.innerHeight || document.documentElement.clientHeight);
    return (rect.top <= ch) && ((rect.top + rect.height) >= 0);
  };
}

if (!Element.prototype.hide) {
  Element.prototype.hide = function () {
    this.classList.add('hide');
  };
}

if (!Element.prototype.show) {
  Element.prototype.show = function () {
    this.classList.remove('hide');
  };
}

if (!Array.prototype.contains) {
  Array.prototype.contains = function (el) {
    return this.indexOf(el) !== -1;
  };
}

if (!Node.prototype.remove) {
  Node.prototype.remove = function () {
    if (this.parentNode === null) {
      return;
    }
    this.parentNode.removeChild(this);
  };
}

if (!Node.prototype.append) {
  Node.prototype.append = function (toAdd) {
    if (toAdd === null) {
      return;
    }
    const el = this;
    if (toAdd instanceof NodeList) {
      Array.prototype.forEach.call(toAdd, (nd) => {
        el.appendChild(nd);
      });
    } else {
      el.appendChild(toAdd);
    }
  };
}

if (!Node.prototype.prepend) {
  Node.prototype.prepend = function (el) {
    const refNode = this;
    if (refNode != null && refNode.parentNode != null) {
      return refNode.parentNode.insertBefore(el, refNode.parentNode.firstElementChild);
    }
    return null;
  };
}

if (!Node.prototype.unwrap) {
  Node.prototype.unwrap = (el) => {
    // get the element's parent node
    const parent = el.parentNode;
    // move all children out of the element
    while (el.firstChild) parent.insertBefore(el.firstChild, el);

    // remove the empty element
    return parent.removeChild(el);
  };
}

if (!NodeList.prototype.wrap) {
  NodeList.prototype.wrap = function (wrapper) {
    if (this.length == 0) {
      return;
    }
    const temp = document.createElement('div');
    const parent = this.parentNode;
    const insertWhere = this.previousSibling;
    let target;

    if (wrapper instanceof HTMLElement) {
      target = wrapper;
      while (target.firstChild) {
        target = target.firstChild;
      }
      this.insertAdjacentElement('beforebegin', wrapper);
      Array.prototype.forEach.call(this, (a) => {
        target.appendChild(a);
      });
    } else {
      temp.innerHTML = wrapper;
      target = temp.firstChild;
      while (target.firstChild) {
        target = target.firstChild;
      }

      Array.prototype.forEach.call(this, (a) => {
        target.appendChild(a);
      });
      return parent.insertBefore(temp.firstChild, (insertWhere ? insertWhere.nextSibling : parent.firstChild));
    }
  };
}

if (!Node.prototype.wrap) {
  Node.prototype.wrap = function (wrapper) {
    const temp = document.createElement('div');
    const parent = this.parentNode;
    const insertWhere = this.previousSibling;
    let target;

    if (wrapper instanceof HTMLElement) {
      target = wrapper;
      while (target.firstChild) {
        target = target.firstChild;
      }
      this.insertAdjacentElement('beforebegin', wrapper);
      target.appendChild(this);
    } else {
      temp.innerHTML = wrapper;
      target = temp.firstChild;
      while (target.firstChild) {
        target = target.firstChild;
      }
      target.appendChild(this);

      return parent.insertBefore(temp.firstChild, (insertWhere ? insertWhere.nextSibling : parent.firstChild));
    }
  };
}
const Poly = {};
export default Poly;
