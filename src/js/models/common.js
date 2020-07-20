function Common() {
  var opts = arguments.length ? arguments[0] : {};    
  this.factory = opts.factory;

  this.contentTags = ['h1','h2','h3','h4','h5','h6','p','pre','blockquote','li', 'figcaption'];
  this.markupTags = ['a','b','strong','u','i','em','cite'];  
}

Common.prototype.readMarkups = function (element) {
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

Common.prototype.findPositionInElement = function (positionOf, inElement) {
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

export default new Common();