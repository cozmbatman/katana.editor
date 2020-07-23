import Utils from './utils';
import Sanitize from './lib/sanitize.js';

function clean() {
  this.it = (element) => {
    const s = new Sanitize({
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
            const src = input.node.attr('src');
            if (Utils.urlIsFromDomain(src, 'youtube.com') || Utils.urlIsFromDomain(src, 'vimeo.com')) {
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
  
    if (element.length) {
      for (let i = 0; i < element.length; i = i + 1) {
        const el = element[i];
        let cleanNode = s.clean_node( el );
        el.innerHTML = '';
        el.appendChild(cleanNode);
      }
    }
  }
}

export default new clean();