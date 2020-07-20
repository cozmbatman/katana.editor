import Poly from './polyfills';

function Boot() {
  
  const addEventForChild = (parent, eventName, childSelector, cb) => {      
    parent.addEventListener(eventName, (event) => {
      const clickedElement = event.target,
      matchingChild = clickedElement.closest(childSelector)
      if (matchingChild) cb(event, matchingChild)
    })
  };

  const attachEvents = (obj, node, events) => {
    for (const [key, f] of Object.entries(events)) {
      let element, func, key_arr;
      key_arr = key.split(" ");
      
      if(f && {}.toString.call(f) === '[object Function]') {
        func = f;
      } else if (Object.prototype.toString.call(f) === "[object String]") {
        func = obj[f];
      } else {
        throw "error event needs a function or string";
      }

      element = key_arr.length > 1 ? key_arr.splice(1, 3).join(" ") : null;
      if (element != null) {
        addEventForChild(node, key_arr[0], element, func);
      } else {
        node.addEventListener(key_arr[0], func);
      }
    }
  }

  this.it = (comp, opts) => {
    if(typeof opts['node'] !== 'undefined') {
      comp['elNode'] = opts['node'];
    }
    if(typeof comp['initialize'] !== 'undefined') {
      comp.initialize.apply(comp, opts);
    } else {
      console.warn(`Initialize method not found on ${opts.name}`);
    }
    
    if(typeof comp['elNode'] !== 'undefined' && typeof comp['events'] !== 'undefined') {
      attachEvents(comp, comp['elNode'], comp['events']);
    }
  }
}

const boot = new Boot();
export default boot;