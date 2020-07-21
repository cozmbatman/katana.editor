import boot from '../boot';
import Utils from '../utils';

const NUMBER_HONE = 49, //header 1
  NUMBER_HTWO = 50, //header 2
  NUMBER_HTHREE = 51, // header 3
  NUMBER_QUOTE = 52, // quote
  NUMBER_CODE_BLOCK = 53, // code block

  CHAR_CENTER = 69, // E with Ctrl, align center
  CHAR_LINK = 75; // k for link link 

function TextToolbar(opts) {
  this.opts = opts;
  this.handleClick = this.handleClick.bind(this);
  this.createlink = this.createlink.bind(this);
  this.handleKeyDown = this.handleKeyDown.bind(this);
  this.handleInputEnter = this.handleInputEnter.bind(this);
  this.shortCutKey = this.shortCutKey.bind(this);
  this.closeInput = this.closeInput.bind(this);
  this.hide = this.hide.bind(this);

  this.initialize = this.initialize.bind(this);
  boot.it(this, opts);
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

TextToolbar.prototype.initialize = function () {
  const opts = this.opts;

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
  if(this.cachedTemplate == null) {
    let html = `<div class="mf-menu-linkinput">
        <input class="mf-menu-input" placeholder="https://">
        <div class="mf-menu-button mf-link-close">&#215;</div></div>
        <ul class='mf-menu-buttons'>`;
  
    this.config.buttons.forEach( item => {
      return html += `<li class='mf-menu-button'><i class="mf-icon mfi-${item.i}"  data-action="${item.a}"></i></li>`;
    });
    
    html += `</ul>`;
    this.cachedTemplate = html;
  }
  return this.cachedTemplate;
};

TextToolbar.prototype.built = false;

TextToolbar.prototype.render = function () {
  if(!this.built) {
    this.cachedTemplate = null;
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
    var s = Utils.saveSelection();
    if(s != null) {
      this.savedSel = s;
    }
    
    if (/(?:createlink)/.test(action)) {
      this.actionIsLink(element);
    } else {
      this.menuApply(action);
    }
  }
  return false;
};

TextToolbar.prototype.actionIsLink = function (target, event) {
  
  if (target != null && target.hasClass("active")) {
    this.elNode.querySelector("input.mf-menu-input").value = '';
    this.removeLink();
  } else {
    this.elNode.addClass("mf-menu--linkmode");
    var sel = Utils.saveSelection();
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
      this.savedSel = Utils.saveSelection();
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
    Utils.restoreSelection(this.savedSel);
  }
};

TextToolbar.prototype.handleInputEnter = function(e, matched) {
  if (e.which === 13) {
    Utils.restoreSelection(this.savedSel);
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
  return this.current_editor.cleanContents(elem);
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
  var nd = Utils.getNode();
  if (nd.tagName == 'CITE') {
    var quote = nd.closest('blockquote');
    quote.removeClass('with-cite');
    nd.children.unwrap();
  } else {
    if (nd.hasClass('with-cite')) {
      nd.removeClass('with-cite');
    } else {
      var sel = Utils.selection();
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
  var nd = Utils.getNode();
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
  var n, origNode, extrakls;
  
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
  var list, node;
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
  val = "<" + tag + ">" + Utils.selection() + "</" + tag + ">";
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
  nodes = this.effectNode(Utils.getNode());

  this.elNode.querySelectorAll(".mfi-button, .mfi-button-trans, .mfi-cite").forEach(el => {
    let li = el.closest('li');
    if(li  != null) {
      li.addClass('hide');
    }
  });
  let _this = this;
  nodes.forEach( (node) => {
      var tag = node.nodeName.toLowerCase(),
      _thisEl = this.elNode;
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

        if (Utils.editableCaretAtEnd(node)) {
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
  var ic = this.elNode.querySelector(".mfi-" + tag);
  if(ic == null) {
    return;
  }
  let icl = ic.closest("li");
  if(double) {
    if(icl != null) {
      icl.addClass('doble');
    }
  }
  if(icl != null) {
    return icl.addClass("active");
  }
};

export default TextToolbar;