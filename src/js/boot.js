import Poly from './polyfills'; // eslint-disable-line no-unused-vars
import Utils from './utils';

function Boot() {
  const addEventForChild = (parent, eventName, childSelector, cb) => {
    parent.addEventListener(eventName, (event) => {
      const clickedElement = event.target;
      const matchingChild = clickedElement.closest(childSelector);
      if (matchingChild) cb(event, matchingChild);
    });
  };

  const attachEvents = (obj, node, events) => {
    const keys = Object.keys(events);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const f = events[key];
      const keyArr = key.split(' ');
      let func;

      if (f && {}.toString.call(f) === '[object Function]') {
        func = f;
      } else if (Object.prototype.toString.call(f) === '[object String]') {
        func = obj[f];
      } else {
        throw new Error('error event needs a function or string');
      }

      const element = keyArr.length > 1 ? keyArr.splice(1, 3).join(' ') : null;
      if (element != null) {
        addEventForChild(node, keyArr[0], element, func);
      } else {
        node.addEventListener(keyArr[0], func);
      }
    }
  };

  this.it = (comp, opts) => {
    if (typeof opts.node !== 'undefined') {
      comp.elNode = opts.node; // eslint-disable-line no-param-reassign
    }
    if (typeof comp.initialize !== 'undefined') {
      comp.initialize.apply(comp, opts); // eslint-disable-line prefer-spread
      // comp.initialize(...opts);
    } else {
      Utils.log(`Initialize method not found on ${opts.name}`);
    }

    if (typeof comp.elNode !== 'undefined' && typeof comp.events !== 'undefined') {
      attachEvents(comp, comp.elNode, comp.events);
    }
  };
}

const boot = new Boot();
export default boot;
