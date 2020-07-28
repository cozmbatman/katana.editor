function Common() {
  const opts = arguments.length ? arguments[0] : {};
  this.factory = opts.factory;

  this.contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote', 'li', 'figcaption'];
  this.markupTags = ['a', 'b', 'strong', 'u', 'i', 'em', 'cite'];
}

Common.prototype.readMarkups = function (element) {
  const original = element;
  const markups = [];

  const workOnChildren = (el) => {
    const children = el.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      const node = children[i];

      if (node.nodeType == Node.ELEMENT_NODE) {
        let tagName = node.nodeName.toLowerCase();

        if (this.markupTags.indexOf(tagName) != -1) {
          tagName = tagName == 'b' ? 'strong' : tagName;
          tagName = tagName == 'i' ? 'em' : tagName;

          const o = { tag: tagName };
          if (o.tag == 'a') {
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

Common.prototype.findPositionInElement = function (positionOf, inElement) {
  let baseElement = positionOf;

  while (baseElement.parentNode != inElement) {
    baseElement = baseElement.parentNode;
  }

  const { childNodes } = inElement;
  let start;
  let end;
  let textSoFar = 0;
  for (let i = 0; i < childNodes.length; i += 1) {
    const node = childNodes[i];
    if (baseElement != node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        textSoFar += node.textContent.length;
      } else if (node.nodeType == Node.TEXT_NODE) {
        textSoFar += node.nodeValue.length;
      }
    } else {
      break;
    }
  }
  start = textSoFar;
  end = start + positionOf.textContent.length;
  return { start, end };
};

export default new Common();
