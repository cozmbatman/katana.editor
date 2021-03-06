import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

const NUMBER_HONE = 49; // header 1
const NUMBER_HTWO = 50; // header 2
const NUMBER_HTHREE = 51; // header 3
const NUMBER_QUOTE = 52; // quote
const NUMBER_CODE_BLOCK = 53; // code block

const CHAR_CENTER = 69; // E with Ctrl, align center
const CHAR_LINK = 75; // k for link link

function TextToolbar(opts) {
  this.opts = opts;

  this.streamer = Stream;
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

TextToolbar.prototype.hide = function hide() {
  this.elNode.removeClass('mf-menu--linkmode');
  this.elNode.addClass('hide');
};

TextToolbar.prototype.events = {
  'mousedown li': 'handleClick',
  'click .mf-menu-linkinput .mf-menu-button': 'closeInput',
  'keypress input': 'handleInputEnter',
  'keydown input': 'handleKeyDown',
};

TextToolbar.prototype.initialize = function initialize() {
  const { opts } = this;

  this.current_editor = opts.editor;
  this.mode = opts.mode;
  this.config = opts.textToolbarConfig || this.defaultConfig();

  this.commandsReg = {
    block: /^(?:p|h[1-6]|blockquote|pre)$/,
    inline: /^(?:bold|italic|underline|insertorderedlist|insertunorderedlist|indent|outdent)$/,
    source: /^(?:insertimage|createlink|unlink)$/,
    insert: /^(?:inserthorizontalrule|insert)$/,
    wrap: /^(?:code)$/,
  };
  this.lineBreakReg = /^(?:blockquote|pre|div|p)$/i;
  this.effectNodeReg = /(?:[pubia]|h[1-6]|blockquote|[uo]l|li|strong|em)/i;
  this.strReg = {
    whiteSpace: /(^\s+)|(\s+$)/g,
    mailTo: /^(?!mailto:|.+\/|.+#|.+\?)(.*@.*\..+)$/,
    http: /^(?!\w+?:\/\/|mailto:|\/|\.\/|\?|#)(.*)$/,
  };
};

TextToolbar.prototype.defaultConfig = function defaultConfig() {
  if (this.mode === 'write') {
    const o = {
      buttons: [
        { a: 'bold', i: 'bold' },
        { a: 'italic', i: 'italic' },
        { a: 'h2', i: 'H2', k: NUMBER_HONE },
        { a: 'h3', i: 'H3', k: NUMBER_HTWO },
        { a: 'h4', i: 'H4', k: NUMBER_HTHREE },
        { a: 'center', i: 'text-center', k: CHAR_CENTER },
        { a: 'blockquote', i: 'quote', k: NUMBER_QUOTE },
        { a: 'cite', i: 'cite' },
        { a: 'createlink', i: 'link', k: CHAR_LINK },
      ],
    };

    if (this.current_editor.publicationMode) {
      o.buttons.push({ a: 'buttonprimary', i: 'button' });
      o.buttons.push({ a: 'buttontrans', i: 'button-trans' });
    }
    return o;
  } if (this.mode === 'edit') {
    return {
      buttons: [
        { a: 'highlight', i: 'highlight' },
        { a: 'color', i: 'color' },
      ],
    };
  }
  return {
    buttons: [
      /* {a:'comment',i: 'comment'}, */
      { a: 'share', i: 'twitter' },
    ],
  };
};

TextToolbar.prototype.template = function template() {
  if (!this.cachedTemplate) {
    this.cachedTemplate = this.current_editor.templates.toolbarTemplate(this.config.buttons);
  }
  return this.cachedTemplate;
};

TextToolbar.prototype.built = false;

TextToolbar.prototype.render = function render() {
  if (!this.built) {
    this.cachedTemplate = null;
    this.elNode.innerHTML = this.template();
    this.built = true;
  }
  return this.show();
};

TextToolbar.prototype.refresh = function refresh() {
  this.elNode.querySelectorAll('.mf-menu-button').forEach((el) => {
    el.removeClass('hide');
  });
};

TextToolbar.prototype.show = function show() {
  this.current_editor.toolbar.show$();
};

TextToolbar.prototype.show$ = function show$() {
  this.elNode.addClass('mf-menu--active');
  this.elNode.removeClass('hide');
  return this.displayHighlights();
};

// click events
TextToolbar.prototype.handleClick = function handleClick(ev, matched) {
  const element = matched ? matched.querySelector('.mf-icon') : ev.currentTarget.querySelector('.mf-icon');

  if (element != null) {
    let action = element.attr('data-action');
    if (action) { action = action.trim(); }
    const s = Utils.saveSelection();
    if (s != null) {
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

TextToolbar.prototype.actionIsLink = function actionIsLink(target, event) {
  if (target != null && target.hasClass('active')) {
    this.elNode.querySelector('input.mf-menu-input').value = '';
    this.removeLink();
  } else {
    event?.preventDefault();
    this.elNode.addClass('mf-menu--linkmode');
    this.savedSel = Utils.saveSelection();
    setTimeout(() => {
      this.elNode.querySelector('input.mf-menu-input').focus();
    }, 30);
  }
};

TextToolbar.prototype.shortCutKey = function shortCutKey(key, event) {
  const shouldOpenLink = () => {
    const text = this.current_editor.getSelectedText();
    return !!text.length;
  };

  if (this.mode === 'write') {
    let action = '';
    const node = this.current_editor.elNode.querySelector('.item-selected');
    if (node && !node.hasClass('item-figure')) {
      this.savedSel = Utils.saveSelection();
      switch (key) {
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
      }

      if (action) {
        this.menuApply(action);
        return false;
      }
      if (key === CHAR_LINK) {
        return false;
      }
    }
  }
  return true;
};

TextToolbar.prototype.closeInput = function closeInput() {
  this.elNode.removeClass('mf-menu--linkmode');
  return false;
};

TextToolbar.prototype.handleKeyDown = function handleKeyDown(e) {
  if (e.which === 27) {
    this.hide();
    Utils.restoreSelection(this.savedSel);
  }
};

TextToolbar.prototype.handleInputEnter = function handleInputEnter(e, matched) {
  if (e.which === 13) {
    Utils.restoreSelection(this.savedSel);
    if (matched) {
      this.createlink(matched);
      return;
    }
    this.createlink(e.target);
  }
};

TextToolbar.prototype.removeLink = function removeLink() {
  this.menuApply('unlink');
  return this.current_editor.cleanContents(this.current_editor.getNode());
};

TextToolbar.prototype.createlink = function createlink(input) {
  this.elNode.removeClass('mf-menu--linkmode');
  if (input.value) {
    const inputValue = input.value.replace(this.strReg.whiteSpace, '').replace(this.strReg.mailTo, 'mailto:$1').replace(this.strReg.http, 'http://$1');
    return this.menuApply('createlink', inputValue);
  }
  return this.menuApply('unlink');
};

TextToolbar.prototype.menuApply = function menuApply(action, value) {
  if (this.commandsReg.block.test(action)) {
    this.commandBlock(action);
  } else if (this.commandsReg.inline.test(action) || this.commandsReg.source.test(action)) {
    this.commandOverall(action, value);
  } else if (this.commandsReg.insert.test(action)) {
    this.commandInsert(action);
  } else if (this.commandsReg.wrap.test(action)) {
    this.commandWrap(action);
  } else if (action === 'center') {
    this.commandCenter(action);
  } else if (action === 'buttontrans' || action === 'buttonprimary') {
    this.commandButton(action);
  } else if (action === 'comment' || action === 'share') {
    this.readModeItemClick(action);
  } else if (action === 'cite') {
    this.commandCite();
  }
  return false;
};

TextToolbar.prototype.commandCite = function commandCite() {
  const nd = Utils.getNode();
  if (nd.tagName === 'CITE') {
    nd.closest('blockquote')?.removeClass('with-cite');
    nd.children?.unwrap();
  } else if (nd.hasClass('with-cite')) {
    nd.removeClass('with-cite');
  } else {
    const sel = Utils.selection();
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0).cloneRange();
      const ele = document.createElement('cite');
      range.surroundContents(ele);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    nd.addClass('with-cite');
  }
};

TextToolbar.prototype.commandButton = function commandButton(action) {
  const nd = Utils.getNode();
  if (nd != null && nd.tagName.toLowerCase() === 'a') {
    if (action === 'buttonprimary') {
      if (nd.hasClass('trans')) {
        nd.removeClass('trans');
      } else if (nd.hasClass('btn')) {
        nd.removeClass('btn');
      } else {
        nd.addClass('btn');
      }
    } else if (action === 'buttontrans') {
      if (nd.hasClass('trans')) {
        nd.removeClass('btn trans');
      } else {
        nd.addClass('btn trans');
      }
    }
    this.displayHighlights();
  }
};

TextToolbar.prototype.readModeItemClick = function readModeItemClick(action) {
  const sel = document.querySelector('.item-selected');
  if (action === 'comment') {
    this.streamer.notifySubscribers('Katana.Event.Nodes', {
      selectedText: this.current_editor.getSelectedText(),
      node: sel,
    });
  } else if (action === 'share') {
    this.streamer.notifySubscribers('Katana.Event.Share', {
      selectedText: this.current_editor.getSelectedText(),
      node: sel,
    });
  }
};

TextToolbar.prototype.refreshMenuState = function refreshMenuState() {
  this.built = false;
  this.render();
};

TextToolbar.prototype.commandCenter = function commandCenter() {
  const node = this.current_editor.current_node;
  if (!node) {
    return;
  }
  node.classList.toggle('text-center');

  this.displayHighlights();
  this.current_editor.handleTextSelection(node);
};

TextToolbar.prototype.commandOverall = function commandOverall(cmd, val) {
  const origNode = this.current_editor.current_node;
  let n;
  let extrakls = false;

  if (origNode.hasClass('text-center')) {
    extrakls = 'text-center';
  }

  if (val === 'blockquote' && origNode.tagName === 'BLOCKQUOTE') {
    extrakls = 'pullquote';
  }
  let value = val;
  if (!val) {
    value = null;
  }

  if (document.execCommand(cmd, false, value)) {
    n = this.current_editor.getNode();

    this.current_editor.setupLinks(n.querySelectorAll('a'));

    if (cmd === 'createlink' || cmd === 'bold' || cmd === 'italic') {
      const nn = this.current_editor.getTextNodeParent();
      if (nn != null) {
        this.current_editor.addClassesToElement(nn);
        this.current_editor.setElementName(nn);
      }
    }

    this.displayHighlights();

    if (n.parentNode && n.parentNode.hasClass('block-content-inner')) {
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

TextToolbar.prototype.commandInsert = function commandInsert(name) {
  const node = this.current_editor.current_node;
  if (!node) {
    return;
  }
  this.current_editor.current_range.selectNode(node);
  this.current_editor.current_range.collapse(false);
  this.commandOverall(node, name);
};

TextToolbar.prototype.commandBlock = function commandBlock(name) {
  const node = this.current_editor.current_node;
  if (!node) {
    return;
  }
  const list = this.effectNode(this.current_editor.getNode(node), true);

  let nameVal = name;

  if (node.tagName === 'BLOCKQUOTE' && !node.hasClass('pullquote')) {
    // leave it.. as it is
  } else if (node.tagName === 'BLOCKQUOTE' && node.hasClass('pullquote')) {
    nameVal = 'p';
  } else if (list.indexOf(name) !== -1) {
    nameVal = 'p';
  }

  this.commandOverall('formatblock', nameVal);
};

TextToolbar.prototype.commandWrap = function commandWrap(tag) {
  const val = `<${tag}>${Utils.selection()}</${tag}>`;
  return this.commandOverall('insertHTML', val);
};

TextToolbar.prototype.effectNode = function effectNode(el, returnAsNodeName) {
  const nodes = [];
  let element = el || this.current_editor.elNode;
  while (!element.hasClass('block-content-inner')) {
    if (element.nodeName.match(this.effectNodeReg)) {
      nodes.push((returnAsNodeName ? element.nodeName.toLowerCase() : element));
    }
    element = element.parentNode;
  }
  return nodes;
};

TextToolbar.prototype.displayHighlights = function displayHighlights() {
  const active = this.elNode.querySelector('.active');
  active?.removeClass('active');
  this.refresh();

  const nodes = this.effectNode(Utils.getNode());

  this.elNode.querySelectorAll('.mfi-button, .mfi-button-trans, .mfi-cite').forEach((el) => {
    const li = el.closest('li');
    if (li != null) {
      li.addClass('hide');
    }
  });

  nodes.forEach((node) => {
    let tag = node.nodeName.toLowerCase();
    const thisEl = this.elNode;
    switch (tag) {
      case 'a':
        thisEl.querySelector('input').value = node.attr('href');
        tag = 'link';
        break;
      case 'i':
      case 'em':
        tag = 'italic';
        break;
      case 'u':
        tag = 'underline';
        break;
      case 'b':
      case 'strong':
        tag = 'bold';
        break;
      case 'code':
        tag = 'code';
        break;
      case 'ul':
        tag = 'insertunorderedlist';
        break;
      case 'ol':
        tag = 'insertorderedlist';
        break;
      case 'li':
        tag = 'indent';
        break;
    }

    if (tag.match(/(?:h[1-6])/i)) {
      thisEl.querySelectorAll('.mfi-bold, .mfi-italic, .mfi-quote').forEach((el) => el.closest('li')?.addClass('hide'));
    } else if (tag === 'indent') {
      thisEl.querySelectorAll('.mfi-H2, .mfi-H3, .mfi-H4, .mfi-quote').forEach((el) => el.closest('li')?.addClass('hide'));
    } else if (tag === 'figcaption' || tag === 'label') {
      thisEl.querySelectorAll('.mfi-H2, .mfi-H3, .mfi-H4, .mfi-quote, .mfi-text-center').forEach((el) => el.closest('li')?.addClass('hide'));
    } else if (tag === 'blockquote') {
      thisEl.querySelectorAll('.mfi-H2, .mfi-H3, .mfi-H4').forEach((el) => el.closest('li')?.addClass('hide'));
    }

    if (tag === 'link') {
      thisEl.querySelectorAll('.mfi-button, .mfi-button-trans').forEach((el) => el.closest('li')?.removeClass('hide'));
      if (node.hasClass('btn') && !node.hasClass('trans')) {
        this.highlight('button');
        thisEl.querySelectorAll('.mfi-button-trans').forEach((el) => el.closest('li')?.removeClass('active'));
      } else if (node.hasClass('trans')) {
        thisEl.querySelectorAll('.mfi-button').forEach((el) => el.closest('li')?.removeClass('active'));
        this.highlight('button-trans');
      }
    }

    const prev = node.previousElementSibling;
    const hasH2 = prev?.hasClass('item-h2');
    const hasH3 = prev?.hasClass('item-h3');
    const hasH4 = prev?.hasClass('item-h4');

    if (hasH2) {
      thisEl.querySelectorAll('.mfi-H2, .mfi-quote').forEach((el) => el.closest('li')?.addClass('hide'));
    } else if (hasH3) {
      thisEl.querySelectorAll('.mfi-H3, .mfi-H2, .mfi-quote').forEach((el) => el.closest('li')?.addClass('hide'));
    } else if (hasH4) {
      thisEl.querySelectorAll('.mfi-H2, .mfi-H3, .mfi-H4, .mfi-quote').forEach((el) => el.closest('li')?.addClass('hide'));
    }

    if (node.hasClass('text-center')) {
      this.highlight('text-center');
    }
    if (node.hasClass('pullquote')) {
      this.highlight('quote', true);
    }

    if (node.hasClass('pullquote')) {
      this.highlight('quote', true);
      thisEl.querySelectorAll('.mfi-italic, .mfi-text-center').forEach((el) => el.closest('li')?.addClass('hide'));

      if (Utils.editableCaretAtEnd(node)) {
        thisEl.querySelectorAll('.mfi-cite').forEach((el) => el.closest('li')?.removeClass('hide'));
      }
    }

    if (tag === 'cite') {
      thisEl.querySelectorAll('.mfi-italic, .mfi-text-center, .mfi-bold').forEach((el) => el.closest('li')?.addClass('hide'));
      thisEl.querySelectorAll('.mfi-cite').forEach((el) => el.closest('li')?.removeClass('hide'));
      tag = 'cite';
    }

    if (tag === 'blockquote') {
      tag = 'quote';
    }

    this.highlight(tag);
  });
};

TextToolbar.prototype.highlight = function highlight(tag, double) {
  let tg = tag;
  if (['h4', 'h3', 'h2', 'h1'].indexOf(tag) !== -1) {
    tg = tag.toUpperCase();
  }
  const icl = this.elNode.querySelector(`.mfi-${tg}`)?.closest('li');
  if (double) {
    icl?.addClass('doble');
  }
  icl?.addClass('active');
};

export default TextToolbar;
