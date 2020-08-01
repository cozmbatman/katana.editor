import Utils from './utils';
import Stream from './stream';
import Poly from './polyfills'; // eslint-disable-line no-unused-vars
import boot from './boot';
import Tooltip from './tooltip';
import Player from './player';
import Templates from './templates';

import { TextToolbar, ImageToolbar } from './toolbars/index';
import {
  ContentBar, ImageContentBarItem, VideoContentBarItem, SectionContentBarItem, EmbedContentBarItem,
} from './content/index';
import ModelFactory from './models/factory';
import Notes from './notes/core';
import clean from './cleaner';

const BACKSPACE = 8;
const ESCAPE = 27;
const TAB = 9;
const ENTER = 13;
const SPACEBAR = 32;
const LEFTARROW = 37;
const UPARROW = 38;
const RIGHTARROW = 39;
const DOWNARROW = 40;
const DELETE = 46;
const END_KEY = 35; // eslint-disable-line no-unused-vars

const SINGLE_QUOTE_WHICH = 39;
const DOUBLE_QUOTE_WHICH = 34;
const DASH_WHICH = 45;

const QUOTE_LEFT_UNICODE = '\u2018';
const QUOTE_RIGHT_UNICODE = '\u2019';

const DOUBLEQUOTE_LEFT_UNICODE = '\u201c';
const DOUBLEQUOTE_RIGHT_UNICODE = '\u201d';

const DASH_UNICODE = '\u2014';

const UNICODE_SPECIAL_CHARS = [QUOTE_LEFT_UNICODE, QUOTE_RIGHT_UNICODE, DOUBLEQUOTE_LEFT_UNICODE, DOUBLEQUOTE_RIGHT_UNICODE, DASH_UNICODE];

// number 1, number 2, number 3, Char C(center), char q(quote),
const NUMBER_HONE = 49;
const NUMBER_HTWO = 50;
const NUMBER_HTHREE = 51;
const NUMBER_QUOTE = 52;
const NUMBER_CODE_BLOCK = 53;

const CHAR_CENTER = 69; // E with Ctrl
const CHAR_LINK = 75; // k for link

const SHORT_CUT_KEYS = [NUMBER_HONE, NUMBER_HTWO, NUMBER_HTHREE, NUMBER_QUOTE, NUMBER_CODE_BLOCK, CHAR_CENTER, CHAR_LINK];

function Editor(opts) {
  opts.node.wrap('<div class="editor-wrapper"></div>');

  this.opts = opts;
  // entry points
  this.init = this.init.bind(this); // activate
  this.destroy = this.destroy.bind(this); // deactivate

  // templates
  this.templates = Templates;

  // streamer
  this.streamer = Stream;
  this.subscribe = this.subscribe.bind(this); // for subscription to events

  // ui related
  this.render = this.render.bind(this);

  // base methods
  this.initialize = this.initialize.bind(this);
  this.initContentOptions = this.initContentOptions.bind(this);
  this.initTextToolbar = this.initTextToolbar.bind(this);
  this.insertFancyChar = this.insertFancyChar.bind(this);
  this.markAsSelected = this.markAsSelected.bind(this);
  this.selectFigure = this.selectFigure.bind(this);

  // canvas related
  this.parallaxCandidateChanged = this.parallaxCandidateChanged.bind(this);

  // event listeners
  this.handlePaste = this.handlePaste.bind(this);
  this.handleDrag = this.handleDrag.bind(this);
  this.handleDrop = this.handleDrop.bind(this);
  this.handleDragEnter = this.handleDragEnter.bind(this);
  this.handleDragExit = this.handleDragExit.bind(this);

  this.handleSelectionChange = this.handleSelectionChange.bind(this);
  this.handleMouseUp = this.handleMouseUp.bind(this);
  this.handleMouseDown = this.handleMouseDown.bind(this);
  this.handleKeyUp = this.handleKeyUp.bind(this);
  this.handleKeyDown = this.handleKeyDown.bind(this);
  this.handleKeyPress = this.handleKeyPress.bind(this);
  this.handleDblclick = this.handleDblclick.bind(this);
  this.handlePress = this.handlePress.bind(this);
  this.handleTap = this.handleTap.bind(this);

  // this.handleCopyEvent = this.handleCopyEvent.bind(this);

  // image event listeners
  this.handleGrafFigureSelectImg = this.handleGrafFigureSelectImg.bind(this);
  this.handleGrafFigureTypeCaption = this.handleGrafFigureTypeCaption.bind(this);
  this.handleImageActionClick = this.handleImageActionClick.bind(this);

  // section toolbar event listeners
  this.handleSectionToolbarItemClicked = this.handleSectionToolbarItemClicked.bind(this);
  this.handleSectionToolbarItemMouseUp = this.handleSectionToolbarItemMouseUp.bind(this);
  this.handleSectionToolbarItemMouseDown = this.handleSectionToolbarItemMouseDown.bind(this);
  this.handleSectionToolbarItemKeyUp = this.handleSectionToolbarItemKeyUp.bind(this);
  this.handleSectionToolbarItemKeyDown = this.handleSectionToolbarItemKeyDown.bind(this);
  this.handleSectionToolbarItemKeyPress = this.handleSectionToolbarItemKeyPress.bind(this);
  this.handleSectionToolbarItemDblclick = this.handleSectionToolbarItemDblclick.bind(this);

  this.handleSelectionStoryTypeChange = this.handleSelectionStoryTypeChange.bind(this);
  this.handleSelectionStoryCountChange = this.handleSelectionStoryCountChange.bind(this);

  this.displayPopOver = this.displayPopOver.bind(this);
  this.hidePopOver = this.hidePopOver.bind(this);

  // notes
  this.showNoteIcon = this.showNoteIcon.bind(this);
  this.smallScreen = Utils.getWindowWidth() <= 480;

  this.segregateEvents();

  this.isTouch = 'ontouchstart' in window || 'msmaxtouchpoints' in window.navigator;
  this.isIOS = Utils.onIOS();

  boot.it(this, opts);
}

Editor.prototype.segregateEvents = function segregateEvents() {
  const mode = this.opts.mode || 'read';
  const publication = this.opts.editorType === 'publication';

  if (mode === 'read' || mode === 'edit') {
    this.events = {
      mouseup: 'handleMouseUp',
      mousedown: 'handleMouseDown',
      dblclick: 'handleDblclick',
      'mouseover .markup-anchor': 'displayPopOver',
      'mouseout  .markup-anchor': 'hidePopOver',
      'click .item-controls i': 'embedIFrameForPlayback',
      'keydown .item-controls i': 'playButtonPressedViaKeyboard',
    };

    if (this.smallScreen) {
      this.events['click .item'] = 'showNoteIcon';
    } else if (!publication) {
      this.events['mouseover .item'] = 'showNoteIcon';
    }
  } else if (mode === 'write') {
    this.events = {
      paste: 'handlePaste',
      mouseup: 'handleMouseUp',
      mousedown: 'handleMouseDown',
      keydown: 'handleKeyDown',
      keyup: 'handleKeyUp',
      keypress: 'handleKeyPress',
      dblclick: 'handleDblclick',

      // 'copy':'handleCopyEvent',

      'click .item-controls-cont .action': 'handleImageActionClick',
      'click .markup-figure-anchor': 'handleFigureAnchorClick',

      'click .item-figure .padding-cont': 'handleGrafFigureSelectImg',
      'click .with-background .table-view': 'handleGrafFigureSelectImg',
      'keyup .item-figure .caption': 'handleGrafFigureTypeCaption',

      dragover: 'handleDrag',
      drop: 'handleDrop',
      dragenter: 'handleDragEnter',
      dragexit: 'handleDragExit',

      'mouseover .markup-anchor': 'displayPopOver',
      'mouseout  .markup-anchor': 'hidePopOver',

      'press .item': 'handlePress',
      'tap .item': 'handleTap',
    };

    if (publication) {
      const o = {
        'click .main-controls [data-action]': 'handleSectionToolbarItemClicked',
        'dblclick .main-controls': 'handleSectionToolbarItemDblclick',
        'mouseup .main-controls': 'handleSectionToolbarItemMouseUp',
        'mousedown .main-controls': 'handleSectionToolbarItemMouseDown',
        'keyup .main-controls': 'handleSectionToolbarItemKeyUp',
        'keydown .main-controls': 'handleSectionToolbarItemKeyDown',
        'keypress .main-controls': 'handleSectionToolbarItemKeyPress',
        'change [data-for="storytype"]': 'handleSelectionStoryTypeChange',
        'change [data-for="storycount"]': 'handleSelectionStoryCountChange',
      };
      const oKeys = Object.keys(o);
      for (let i = 0; i < oKeys.length; i += 1) {
        this.events[oKeys[i]] = o[oKeys[i]];
      }
    }
  } else {
    this.events = {};
  }
};

Editor.prototype.subscribe = function subscribe(name, cb) {
  this.streamer.subscribe(name, cb);
};

Editor.prototype.selectionChangeFired = false;

Editor.prototype.handleSelectionChange = function handleSelectionChange(ev) {
  const sel = document.getSelection();
  if (sel.type === 'Range') {
    ev.preventDefault();
    if (!this.selectionChangeFired) {
      setTimeout(() => {
        this.handleMouseUp(ev);
        this.selectionChangeFired = false;
      }, 200);
      this.selectionChangeFired = true;
    }
  }
};

Editor.prototype.initialize = function initialize() {
  const { opts } = this;
  // debug mode
  window.debugMode = opts.debug || false;
  if (window.debugMode) {
    this.elNode.addClass('debug');
  }

  this.mode = opts.mode || 'read'; // can be write/ edit/ read
  this.editorType = opts.editorType || 'blog';
  this.publicationMode = opts.editorType === 'publication';

  this.base_content_options = opts.base_content_options || ['image', 'video', 'section'];
  this.content_options = [];

  this.currentNode = null;
  this.prevCurrentNode = null;
  this.current_range = null;

  this.image_options = opts.image ? opts.image : { upload: true };
  this.embed_options = opts.embed ? opts.embed : { enabled: false };
  this.json_quack = opts.json_quack;

  this.storySectionFilterCallback = this.storySectionFilterCallback.bind(this);
  this.templates.init({ ...opts.placeholders, storySectionFilter: this.storySectionFilterCallback });

  this.sectionsForParallax = [];
  this.parallax = null;
  this.parallaxContext = null;

  this.currentRequestCount = 0;
  this.commentable = opts.commentable || false;

  this.notes_options = opts.notes || {};

  // this.paste_element = document.createElement('div');
  // this.elNode.closest('.editor-wrapper').appendChild(this.paste_element);

  return this;
};

Editor.prototype.destroy = function destroy() {};

Editor.prototype.init = function init(cb) {
  this.render(cb);
  if (this.mode === 'write') {
    this.elNode.attr('contenteditable', true);
    this.elNode.addClass('editable');
  } else {
    this.elNode.removeAttribute('contenteditable');
    const ces = this.elNode.querySelectorAll('[contenteditable]');
    ces.forEach((cel) => {
      cel.removeAttribute('contenteditable');
    });
    const mfps = this.elNode.querySelectorAll('.mfi-play');
    mfps.forEach((mf) => {
      mf.attr('tabindex', '0');
    });
  }

  this.appendToolbars();
  this.appendParallax();

  if (this.mode === 'write') {
    const enabled = this.opts && typeof this.opts.enableDraft !== 'undefined' ? this.opts.enableDraft : true;
    if (enabled) {
      this.committer = new ModelFactory({ editor: this, mode: 'write' });
      this.committer.manage(true);
    }
  }

  if (this.notes_options.commentable) {
    const winWidth = Utils.getWindowWidth();
    const layout = winWidth <= 480 ? 'popup' : 'side';
    this.notesManager = new Notes({
      editor: this, notes: [], info: this.notes_options, layout, node: document.querySelector('#notes_container'),
    });
    this.notesManager.init();
  }

  if (this.mode === 'write') {
    this.removeUnwantedSpans();
    setTimeout(() => {
      this.addFigureControls();
    }, 100);
  }

  if (this.mode === 'read') {
    Player.manage({ videos: this.opts.video, editor: this });
  }

  if (this.mode === 'write') {
    // setTimeout( () => {
    // this.mutationHandler = new MutationOb
    // }, 300);
  }

  setTimeout(() => {
    this.addBlanktoTargets();
  }, 100);

  this.addEmptyClass();

  if (this.isIOS) {
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }
};

Editor.prototype.addBlanktoTargets = function addBlanktoTargets() {
  this.elNode.querySelectorAll('a').forEach((item) => {
    if (!item.hasAttribute('target')) {
      item.attr('target', '_blank');
    }
  });
};

Editor.prototype.addEmptyClass = function addEmptyClass() {};

Editor.prototype.setInitialFocus = function setInitialFocus() {
  const items = this.elNode.querySelectorAll('.item');
  if (items.length >= 2) {
    const [first, sec] = items;

    let toFocus = false;
    let toolTip = false;
    if (first.querySelectorAll('.placeholder-text').length && sec.querySelectorAll('.placeholder-text').length) {
      toFocus = items[1];
      toolTip = true;
    } else {
      toFocus = items[0];
    }

    if (toFocus) {
      this.markAsSelected(toFocus);
      this.setRangeAt(toFocus);
      if (toolTip) {
        this.displayTooltipAt(toFocus);
      }
    }
  }
};

Editor.prototype.appendParallax = function appendParallax() {
  const art = this.elNode.closest('body');
  if (art) {
    if (document.querySelector('.parallax')) {
      return;
    }
    const cv = Utils.generateElement(this.templates.canvasTemplate());
    let handled = false;

    cv.attr('width', Utils.getWindowWidth());
    cv.attr('height', Utils.getWindowHeight());

    art.insertBefore(cv, art.firstElementChild);
    const self = this;
    const resizeHandler = function resizeHandler() {
      if (!handled) {
        setTimeout(() => {
          self.resized();
          handled = false;
        }, 60);
        handled = true;
      }
    };

    window.addEventListener('resize', resizeHandler);
    this.parallax = cv;
    this.parallaxContext = cv.getContext('2d');

    this.parallaxCandidateChanged();
  }
};

Editor.prototype.resized = function resized() {
  if (this.parallax) {
    const wnW = Utils.getWindowWidth(); const
      wnH = Utils.getWindowHeight();
    this.parallax.attr('width', wnW);
    this.parallax.attr('height', wnH);
    this.checkViewPortForCanvas();
  }
};

Editor.prototype.appendToolbars = function appendToolbars() {
  this.initTextToolbar();
  if (this.base_content_options.length > 0 && this.mode === 'write') {
    this.initContentOptions();
  }

  this.tooltip = new Tooltip({ editor: this, node: document.querySelector('body') });
  this.tooltip.render().hide();
};

Editor.prototype.initTextToolbar = function initTextToolbar() {
  const editorWrapper = this.elNode.closest('.editor-wrapper');
  let toolbarNode = editorWrapper.querySelector('.mf-toolbar-base');

  if (!toolbarNode) {
    const tbEl = Utils.generateElement(this.templates.textToolbarBase());
    toolbarNode = this.elNode.insertAdjacentElement('afterend', tbEl);
  }

  if (!this.text_toolbar) {
    this.text_toolbar = new TextToolbar({
      node: toolbarNode,
      editor: this,
      mode: this.mode,
    });
  }

  this.toolbar = this.text_toolbar;
  return this.text_toolbar;
};

Editor.prototype.initContentOptions = function initContentOptions() {
  const baseOptions = this.base_content_options;
  const editorWrapper = this.elNode.closest('.editor-wrapper');

  if (baseOptions.indexOf('image') >= 0) {
    let toolbarNode = editorWrapper.querySelector('.mf-toolbar-base-image');
    if (!toolbarNode) {
      const igEl = Utils.generateElement(this.templates.imageToolbarBase());
      toolbarNode = this.elNode.insertAdjacentElement('afterend', igEl);
    }

    this.image_toolbar = new ImageToolbar({
      node: toolbarNode,
      editor: this,
      mode: this.mode,
    });

    this.image_toolbar.render().hide();

    const opt = new ImageContentBarItem({ editor: this, toolbar: this.image_toolbar });
    this.image_toolbar.setController(opt);
    this.content_options.push(opt);
    this.image_uploader = opt;
  }

  if (baseOptions.indexOf('video') >= 0) {
    const opt = new VideoContentBarItem({ editor: this });
    this.content_options.push(opt);
    this.video_uploader = opt;
  }

  if (baseOptions.indexOf('section') >= 0) {
    const opt = new SectionContentBarItem({ editor: this, mode: this.mode, editorType: this.editorType });
    this.content_options.push(opt);
    this.section_options = opt;
  }

  if (baseOptions.indexOf('embed') >= 0) {
    const opt = new EmbedContentBarItem({ editor: this, mode: this.mode });
    this.embed_options = opt;
    this.content_options.push(opt);
  }

  let contentBaseNode = editorWrapper.querySelector('.inlineContentOptions');
  if (!contentBaseNode) {
    const coEl = Utils.generateElement(this.templates.contentToolbarBase());
    contentBaseNode = this.elNode.insertAdjacentElement('afterend', coEl);
  }

  this.content_bar = new ContentBar({ node: contentBaseNode, editor: this, widgets: this.content_options });
  this.content_bar.render();
};

Editor.prototype.render = function render(cb) {
  if (this.elNode.innerHTML.trim() === '') {
    this.elNode.appendChild(Utils.generateElement(this.templates.mainTemplate(this.publicationMode)));
    if (this.publicationMode) {
      const bd = this.elNode.querySelector('.block-stories .main-body');
      // TODO add autocomplete dependency
      // $(this.elNode.querySelector('.autocomplete')).autocomplete();

      this.fillStoryPreview(bd, 6);
      const lsect = this.elNode.querySelector('section:last-child .main-body');
      if (lsect) {
        lsect.appendChild(Utils.generateElement(this.templates.singleColumnPara()));
      }
    }
    return setTimeout(() => {
      this.setInitialFocus();
      if (cb) {
        cb();
      }
    }, 100);
  }
  return this.parseInitialContent(cb);
};

Editor.prototype.parseInitialContent = function parseInitialContent(cb) {
  if (this.mode === 'read') {
    cb();
    return this;
  }
  const self = this;

  this.setupElementsClasses(this.elNode.querySelectorAll('.block-content-inner'), () => {
    if (self.mode === 'write') {
      const figures = self.elNode.querySelectorAll('.item-figure');

      figures.forEach((item) => {
        if (item.hasClass('figure-in-row')) {
          const cont = item.closest('.block-grid');
          let caption = cont.querySelector('.block-grid-caption');
          if (!caption) {
            const t = Utils.generateElement(self.templates.figureCaptionTemplate(true));
            t.removeClass('figure-caption');
            t.addClass('block-grid-caption');
            cont.appendChild(t);
            caption = cont.querySelector('.block-grid-caption');
          }
          caption.attr('contenteditable', true);
        } else {
          let caption = item.querySelector('figcaption');
          if (!caption) {
            item.appendChild(Utils.generateElement(self.templates.figureCaptionTemplate()));
            caption = item.querySelector('figcaption');
            item.addClass('item-text-default');
          }
          caption.attr('contenteditable', true);

          if (caption.textContent.killWhiteSpace().length === 0) {
            const txt = 'Type caption for image(Optional)';
            const sp = document.createElement('span');
            sp.addClass('placeholder-text');
            sp.attr('data-placeholder-value', txt);
            sp.innerHTML = txt;
            caption.appendChild(sp);
            item.addClass('item-text-default');
          }
        }
      });

      const bgSections = self.elNode.querySelectorAll('.with-background');
      bgSections.forEach((item) => {
        const cellVs = item.querySelectorAll('.table-cell-view');
        cellVs.forEach((cev) => {
          cev.attr('contenteditable', 'false');
        });
        const mainB = item.querySelectorAll('.main-body');
        mainB.forEach((mb) => {
          mb.attr('contenteditable', 'true');
        });
      });
    }

    self.addPlaceholdersForBackgrounds();
    self.setupFirstAndLast();
    self.setUpStoriesToolbar();
    self.setInitialFocus();
    cb();
  });
};

Editor.prototype.setUpStoriesToolbar = function setUpStoriesToolbar() {
  if (!this.publicationMode) {
    return;
  }
  const sects = this.elNode.querySelectorAll('section');
  if (sects.length) {
    for (let i = 0; i < sects.length; i += 1) {
      const section = sects[i];
      const body = section.querySelector('.main-body');
      if (!section.hasClass('block-add-width') && !section.hasClass('block-full-width')) {
        section.addClass('block-center-width');
      }
      let toolbar;
      if (section.hasClass('block-stories')) {
        toolbar = Utils.generateElement(this.templates.getStoriesSectionMenu(true));
        const name = section.attr('name');
        const obName = window[`ST_${name}`];

        let count = 6; let
          stType = 'featured';
        // , tagValue = '';

        if (obName) {
          count = obName.storyCount;
          stType = obName.storyType;
          // if (typeof obName.storyTag != 'undefined') {
          //   tagValue = obName.storyTag;
          // }
        }

        this.fillStoryPreview(body, count);

        const tStCount = toolbar.querySelector('[data-for="storycount"]');
        if (tStCount) {
          tStCount.value = count;
        }
        const tStType = toolbar.querySelector('[data-for="storytype"]');
        if (tStType) {
          tStType.value = stType;
        }

        // FIXME autocomplete issue
        // const auto = toolbar.querySelector('.autocomplete');
        // auto.autocomplete({threshold:2, behave: 'buttons', type: 'tag'});

        const tagInpt = toolbar.querySelector('[data-for="tagname"]');
        if (stType === 'tagged') {
          tagInpt.closest('.autocomplete-buttons').removeClass('hide');
          // auto.autocomplete({action:'set', data: JSON.parse(tagValue)});
        } else {
          tagInpt.closest('.autocomplete-buttons').addClass('hide');
        }
        toolbar.insertBefore(body);
      } else {
        toolbar = Utils.generateElement(this.templates.getStoriesSectionMenu(false));
        toolbar.insertBefore(body);
      }
    }
  }
};

Editor.prototype.addFigureControls = function addFigureControls() {
  this.elNode.querySelectorAll('.item-figure:not(.item-iframe)').forEach((item) => {
    const temp = Utils.generateElement(this.templates.getImageFigureControlTemplate());
    item.querySelector('img')?.insertAdjacentElement('afterend', temp);
  });
};

Editor.prototype.addPlaceholdersForBackgrounds = function addPlaceholdersForBackgrounds() {
  // const backgrounds = this.elNode.querySelectorAll('.with-background');
  // if (backgrounds.length) {

  // }
};

Editor.prototype.storySectionFilterCallback = function storySectionFilterCallback() {
  const existingSects = this.elNode.querySelectorAll('.block-stories');
  const excludes = [];

  if (existingSects.length) {
    for (let i = 0; i < existingSects.length; i += 1) {
      const sec = existingSects[i];
      const select = sec.querySelector('[data-for="storytype"]');
      if (select) {
        const val = select.value;
        if (val !== 'tagged') {
          excludes.push(val);
        }
      }
    }
  }

  return excludes;
};

Editor.prototype.fillStoryPreview = function fillStoryPreview(container, count) {
  count = typeof count === 'undefined' || isNaN(count) ? 6 : count;
  let ht = '<div class="center-column" contenteditable="false">';
  for (let i = 0; i < count; i += 1) {
    ht += this.templates.getStoryPreviewTemplate();
  }
  ht += '</div>';
  container.innerHTML = ht;
};

Editor.prototype.hideImageToolbar = function hideImageToolbar() {
  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }
};

Editor.prototype.hideContentBar = function hideContentBar() {
  if (this.content_bar) {
    this.content_bar.hide();
  }
};

// DOM related methods //
Editor.prototype.getSelectedText = function getSelectedText() {
  let text = '';
  if (typeof window.getSelection !== 'undefined') {
    text = window.getSelection().toString();
  } else if (typeof document.selection !== 'undefined' && document.selection.type === 'Text') {
    text = document.selection.createRange().text;
  }
  return text;
};

Editor.prototype.selection = function selection() {
  if (window.getSelection) {
    return window.getSelection();
  } if (document.selection && document.selection.type !== 'Control') {
    return document.selection;
  }
};

Editor.prototype.getRange = function getRange() {
  const editor = this.elNode;
  let range = this.selection && this.selection.rangeCount && this.selection.getRangeAt(0);
  if (!range) {
    range = document.createRange();
  }
  if (!editor.contains(range.commonAncestorContainer)) {
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  return range;
};

Editor.prototype.setRange = function setRange(range) {
  range = range || this.current_range;
  if (!range) {
    range = this.getRange();
    range.collapse(false);
  }
  this.selection().removeAllRanges();
  this.selection().addRange(range);
  return this;
};

Editor.prototype.getCharacterPrecedingCaret = function getCharacterPrecedingCaret() {
  let precedingChar = '';
  let sel = void 0;
  let range = void 0;
  let precedingRange = void 0;

  const node = this.getNode();
  if (node) {
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount > 0) {
        range = sel.getRangeAt(0).cloneRange();
        range.collapse(true);
        range.setStart(node, 0);
        precedingChar = range.toString().slice(0);
      }
    } else if ((sel = document.selection) && sel.type !== 'Control') {
      range = sel.createRange();
      precedingRange = range.duplicate();
      // FIXME what was containerEl
      // precedingRange.moveToElementText(containerEl);
      precedingRange.setEndPoint('EndToStart', range);
      precedingChar = precedingRange.text.slice(0);
    }
  }
  return precedingChar;
};

Editor.prototype.isLastChar = function isLastChar() {
  return this.getNode().textContent.trim().length === this.getCharacterPrecedingCaret().trim().length;
};

Editor.prototype.isFirstChar = function isFirstChar() {
  return this.getCharacterPrecedingCaret().trim().length === 0;
};

Editor.prototype.isSelectingAll = function isSelectingAll(element) {
  const a = this.getSelectedText().killWhiteSpace().length;
  const b = element.textContent.killWhiteSpace().length;
  return a === b;
};

Editor.prototype.setRangeAt = function setRangeAt(element, int) {
  if (!int) {
    int = 0;
  }
  const range = document.createRange();
  const sel = window.getSelection();
  range.setStart(element, int);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return element.focus();
};

Editor.prototype.setRangeAtText = function setRangeAtText(element, int) {
  if (!int) {
    int = 0;
  }
  const range = document.createRange();
  const sel = window.getSelection();
  const node = element.firstChild;
  range.setStart(node, 0);
  range.setEnd(node, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return element.focus();
};

Editor.prototype.focus = function focus(focusStart) {
  if (!focusStart) {
    this.setRange();
  }
  this.elNode.focus();
  return this;
};

Editor.prototype.focusNode = function focusNode(node, range) {
  range.setStartAfter(node);
  range.setEndBefore(node);
  range.collapse(false);
  return this.setRange(range);
};

Editor.prototype.getTextNodeParent = function getTextNodeParent() {
  let node; let root; let
    selection;
  node = void 0;
  root = this.elNode,
  selection = this.selection();

  if (selection.rangeCount < 1) {
    return;
  }

  const range = selection.getRangeAt(0);

  node = range.commonAncestorContainer;

  if (!node || node === root) {
    return null;
  }
  while (node.nodeType !== 1) {
    node = node.parentNode;
  }
  if (root && root.contains(node) && root !== node) {
    return node;
  }
  return null;
};

Editor.prototype.getNode = function getNode() {
  let node; let root; let
    selection;
  node = void 0;
  root = this.elNode,
  selection = this.selection();

  if (selection.rangeCount < 1) {
    return;
  }

  const range = selection.getRangeAt(0);

  node = range.commonAncestorContainer;

  if (!node || node === root) {
    return null;
  }

  while (node.nodeType !== 1) {
    node = node.parentNode;
  }

  const pt = node.closest('.block-content-inner') ? node.closest('.block-content-inner') : root;

  while (node && (node.nodeType !== 1 || !node.hasClass('item')) && (node.parentNode !== pt)) {
    node = node.parentNode;
  }

  if (node && !node.hasClass('item-li') && !node.hasClass('figure-in-row')) {
    const elementRoot = node.closest('.block-content-inner');
    while (node && (node.parentNode !== elementRoot) && node !== root) {
      node = node.parentNode;
    }
  }

  if (root && root.contains(node) && root !== node) {
    return node;
  }
  return null;
};

Editor.prototype.markAsSelected = function markAsSelected(element) {
  if (!element || (element && element.nodeType !== 1)) {
    return;
  }

  this.elNode.querySelectorAll('.item-selected').forEach((el) => {
    el.removeClass('figure-focused');
    el.removeClass('item-selected');
  });

  this.elNode.querySelectorAll('.figure-focused').forEach((el) => el.removeClass('figure-focused'));

  document.querySelectorAll('.grid-focused').forEach((el) => el.removeClass('grid-focused'));

  if (element.hasClass('block-grid-caption')) {
    element.closest('.block-grid')?.addClass('grid-focused');
  }

  element.addClass('item-selected');

  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }

  this.setElementName(element);
  this.displayTooltipAt(element);
  this.activateBlock(element);

  if (element.hasClass('item-first') && element.closest('.block-first')) {
    this.reachedTop = true;
    if (element.querySelectorAll('br').length === 0) {
      return element.append(document.createElement('br'));
    }
  } else {
    this.reachedTop = false;
  }
};

Editor.prototype.activateBlock = function activateBlock(elem) {
  this.elNode.querySelectorAll('.block-selected').forEach((el) => el.removeClass('block-selected'));
  elem.closest('.block-content')?.addClass('block-selected');
};

Editor.prototype.setupFirstAndLast = function setupFirstAndLast() {
  const il = this.elNode.querySelector('.item-last');
  const imf = this.elNode.querySelector('.item-first');

  il?.removeClass('item-last');
  imf?.removeClass('item-first');

  const blocks = this.elNode.querySelectorAll('.block-content-inner');
  if (blocks.length > 0) {
    const chh = blocks[0].children;
    if (chh && chh.length > 0) {
      chh[0].addClass('item-first');
    }
    const llh = blocks[blocks.length - 1];
    const cllh = llh.children;
    if (cllh && cllh.length > 0) {
      cllh[cllh.length - 1].addClass('item-last');
    }
  }
};

// DOM Related methods ends //
// EDIT content methods //
Editor.prototype.scrollTo = function scrollTo(node) {
  if (node.isElementInViewport()) {
    return;
  }
  // top = node.offsetTop;
  Utils.scrollToTop();
};

Editor.prototype.setupLinks = function setupLinks(elems) {
  if (elems.length !== 0) {
    elems.forEach((ii) => {
      this.setupLink(ii);
    });
  }
};

Editor.prototype.setupLink = function setupLink(n) {
  const parentName = n.parentNode.tagName.toLowerCase();
  n.addClass(`markup-${parentName}`);
  const href = n.attr('href');
  return n.attr('data-href', href);
};

// EDIT content methods ends //
// Toolbar related methods //
Editor.prototype.displayTooltipAt = function displayTooltipAt(element) {
  if (!this.content_bar) {
    return;
  }

  if (!element || element.tagName === 'LI') {
    return;
  }

  this.hideContentBar();
  this.content_bar.hide();

  this.content_bar.elNode.removeClass('on-darkbackground');

  if (!element.textContent.isEmpty() && element.querySelectorAll('.placeholder-text').length !== 1) {
    return;
  }

  if (element.closest('.with-background')) {
    this.content_bar.elNode.addClass('on-darkbackground');
  }
  const rect = element.getBoundingClientRect();
  this.positions = { top: element.offsetTop, left: rect.left };

  if (element.hasClass('item-h2')) {
    this.positions.top += 10;
  } else if (element.hasClass('item-h3')) {
    this.positions.top += 5;
  } else if (element.hasClass('item-h4')) {
    this.positions.top += 5;
  }

  document.querySelector('.hide-placeholder')?.removeClass('hide-placeholder');

  if (element.querySelectorAll('.placeholder-text').length) {
    element.addClass('hide-placeholder');
  } else {
    element.removeClass('hide-placeholder');
  }

  this.content_bar.show(element);
  return this.content_bar.move(this.positions);
};

Editor.prototype.displayTextToolbar = function displayTextToolbar() {
  return setTimeout(() => {
    const pos = Utils.getSelectionDimensions();
    this.text_toolbar.render();
    this.relocateTextToolbar(pos);
    this.toolbar = this.text_toolbar;
    return this.text_toolbar.show();
  }, 10);
};

Editor.prototype.handleTextSelection = function handleTextSelection(anchorNode) {
  if (!anchorNode) {
    return;
  }
  const text = this.getSelectedText();

  if (this.mode === 'read' && text && (text.length < 10 || text.length > 160)) {
    this.text_toolbar.hide();
    return;
  }

  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }

  if (anchorNode.matches('.item-mixtapeEmbed, .item-figure') && !text.isEmpty()) {
    this.text_toolbar.hide();
    const sel = this.selection(); let range; let caption; let
      eleme;
    if (sel) {
      range = sel.getRangeAt(0),
      caption,
      eleme = range.commonAncestorContainer;
      caption = eleme?.closest('.caption');
      if (caption) {
        this.currentNode = anchorNode;
        return this.displayTextToolbar();
      }
    }
  }

  if (!anchorNode.matches('.item-mixtapeEmbed, .item-figure') && !text.isEmpty() && anchorNode.querySelectorAll('.placeholder-text').length === 0) {
    this.currentNode = anchorNode;
    return this.displayTextToolbar();
  }
  this.text_toolbar.hide();
};

Editor.prototype.relocateTextToolbar = function relocateTextToolbar(position) {
  let left;
  let top;
  const elRect = this.toolbar.elNode.getBoundingClientRect();
  const { height } = elRect;
  const padd = elRect.width / 2;

  left = position.left + (position.width / 2) - padd;

  if (left < 0) {
    left = position.left;
  }

  if (this.isIOS) {
    top = position.top + window.scrollY + height;
    this.text_toolbar.elNode.addClass('showing-at-bottom');
  } else {
    this.text_toolbar.elNode.removeClass('showing-at-bottom');
    top = position.top + window.scrollY - height;
  }

  const elCss = this.text_toolbar.elNode.style;
  elCss.left = `${left}px`;
  elCss.top = `${top}px`;
  elCss.position = 'absolute';
};
// Toolbar related methods ends //

Editor.prototype.hidePlaceholder = function hidePlaceholder(node, ev) {
  // let evType = ev.key || ev.keyIdentifier;

  if ([UPARROW, DOWNARROW, LEFTARROW, RIGHTARROW].indexOf(ev.which) !== -1) {
    this.skip_keyup = true;
    return;
  }

  if (node && node.hasClass('item-figure')) {
    node.querySelectorAll('.placeholder-text').forEach((el) => el.parentNode.removeChild(el));
    return;
  }

  if (node && node.querySelectorAll('.placeholder-text').length) {
    node.innerHTML = '<br />';
    this.setRangeAt(node);
  }
};

// EVENT LISTENERS //

Editor.prototype.cleanupEmptyModifierTags = function cleanupEmptyModifierTags(elements) {
  elements.forEach((element) => {
    element.querySelectorAll('i, b, strong, em').forEach((item) => {
      if (item.textContent.killWhiteSpace().length === 0) {
        const pnt = item.parentNode;
        item.parentNode.replaceChild(document.createTextNode(''), item);
        if (pnt) {
          pnt.normalize();
        }
      }
    });
  });
};

Editor.prototype.convertPsInnerIntoList = function convertPsInnerIntoList(item, splittedContent, match) {
  const split = splittedContent;
  let ht = '';
  let k = 0;
  const counter = match.matched[0].charAt(0);

  // FIXME .. counter checking for many chars which are not implements, not sure other languages have
  // 26 characters or more..
  // just avoid the splitting part if we have more than 26 characters and its not numerical
  if (['a', 'A', 'i', 'I', 'α', 'Ա', 'ა'].indexOf(counter) !== -1 && split.length > 26) {
    return;
  }

  let count = isNaN(parseInt(counter)) ? counter : parseInt(counter);

  while (k < split.length) {
    const sf = `\\s*${count}(.|\\))\\s`;
    const exp = new RegExp(sf);
    const sp = split[k].replace(exp, '');
    ht += `<li>${sp}</li>`;
    k++;
    count = Utils.incrementCounter(count);
  }

  // we have a sequence..
  const olN = Utils.generateElement(`<ol class="postList">${ht}</ol>`);
  item.parentNode.replaceChild(olN, item);

  this.addClassesToElement(olN);

  if (olN.children) {
    Array.from(olN.children).forEach((elm) => {
      this.setElementName(elm);
    });
  }
};

Editor.prototype.doesTwoItemsMakeAList = function doesTwoItemsMakeAList(first, second) {
  const f = first;
  const s = second;
  let firstMatch = f.match(/\s*[1aA](\.|\))\s*/);
  let secondMatch = s.match(/\s*[2bB](\.|\))\s*/);

  if (firstMatch && secondMatch) {
    return { matched: firstMatch, type: 'ol' };
  }

  firstMatch = f.match(/^\s*(\-|\*)\s*$/); // eslint-disable-line no-useless-escape
  secondMatch = s.match(/^\s*(\-|\*)\s*$/); // eslint-disable-line no-useless-escape

  if (firstMatch && secondMatch) {
    return { matched: firstMatch, type: 'ul' };
  }

  return { matched: false };
};

Editor.prototype.handleUnwrappedLists = function handleUnwrappedLists(elements) {
  elements.forEach((item) => {
    if (item.hasClass('item-figure')) {
      return;
    }
    const html = item.innerHTML;
    if (html.trim().length !== 0) {
      // first case
      const split = html.split('<br>');

      if (split.length >= 2 && split[1] !== '') {
        const match = this.doesTwoItemsMakeAList(split[0], split[1]);
        match.matched = false;

        if (match.matched) {
          this.convertPsInnerIntoList(item, split, match);
        }
      }
    }
  });
};

Editor.prototype.handleUnwrapParagraphs = function handleUnwrapParagraphs(elements) {
  elements.forEach((item) => {
    const p = item.querySelectorAll('p');
    if (p.length) {
      const currNodeName = item.tagName.toLowerCase();
      if (currNodeName === 'blockquote') {
        const d = document.createElement('div');

        for (let i = 0; i < p.length; i += 1) {
          const len = p.children.length;
          for (let j = 0; j < len; j++) {
            d.appendChild(p.children[j]);
          }
          p.parentNode.removeChild(p);
        }

        const len = d.children.length;
        for (let i = 0; i < len; i++) {
          item.appendChild(d.children[i]);
        }
      }
    }
  });
};

Editor.prototype.handleUnwrappedImages = function handleUnwrappedImages(elements) {
  elements.forEach((item) => {
    if (item.hasClass('ignore-block') && item.hasClass('item-uploading')) {
      return;
    }
    const img = item.querySelectorAll('img');
    if (img.length) {
      item.attr('data-pending', true);

      if (item && item.children) {
        const { children } = item;
        const div = document.createElement('p');
        for (let i = 0; i < children.length; i++) {
          const it = children[i];
          if (it === img[0]) {
            continue;
          } else {
            div.appendChild(it);
          }
        }
        item.insertAdjacentElement('afterend', div);

        // div.insertAfter(item);
        this.addClassesToElement(div);
        this.setElementName(div);
      }

      this.image_uploader.uploadExistentImage(img);
    }
  });
};

Editor.prototype.handleUnwrappedFrames = function handleUnwrappedFrames(elements) {
  elements.forEach((element) => {
    element.querySelectorAll('iframe').forEach((im) => {
      this.video_uploader.uploadExistentIframe(im);
    });
  });
};

Editor.prototype.handleSpanReplacements = function handleSpanReplacements(element) {
  const replaceWith = element.querySelectorAll('.replace-with');

  replaceWith.forEach((node) => {
    const hasBold = node.hasClass('bold');
    const hasItalic = node.hasClass('italic');

    if (hasBold && hasItalic) {
      node.parentNode.replaceChild(Utils.generateElement(`<i class="markup-i"><b class="markup-b">${node.innerHTML}</b></i>`), node);
    } else if (hasItalic) {
      node.parentNode.replaceChild(Utils.generateElement(`<i class="markup-i">${node.innerHTML}</i>`), node);
    } else if (hasBold) {
      node.parentNode.replaceChild(Utils.generateElement(`<b class="markup-i">${node.innerHTML}</b>`), node);
    }
  });
};

Editor.prototype.removeUnwantedSpans = function removeUnwantedSpans() {
  this.elNode.addEventListener('DOMNodeInserted', (ev) => {
    const node = ev.target;
    if (node.nodeType === 1 && node.nodeName === 'SPAN') {
      if (!node.hasClass('placeholder-text')) {
        const pn = node.parentNode;
        let lastInserted = null;
        Array.from(node.childNodes).forEach((el) => {
          if (!lastInserted) {
            pn.insertBefore(el, node.nextSibling);
            lastInserted = el;
          } else {
            pn.insertBefore(el, lastInserted.nextSibling);
            lastInserted = el;
          }
        });
        pn.removeChild(node);
        // node.parentNode.replaceChild(node, node.children);
      }
    }
  });
};

Editor.prototype.cleanPastedText = function cleanPastedText(text) {
  const regs = [
    // Remove anything but the contents within the BODY element
    [new RegExp(/^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/g), ''],

    // cleanup comments added by Chrome when pasting html
    [new RegExp(/<!--StartFragment-->|<!--EndFragment-->/g), ''],

    // Trailing BR elements
    [new RegExp(/<br>$/i), ''],

    // replace two bogus tags that begin pastes from google docs
    [new RegExp(/<[^>]*docs-internal-guid[^>]*>/gi), ''],
    [new RegExp(/<\/b>(<br[^>]*>)?$/gi), ''],

    // un-html spaces and newlines inserted by OS X
    [new RegExp(/<span class="Apple-converted-space">\s+<\/span>/g), ' '],
    [new RegExp(/<br class="Apple-interchange-newline">/g), '<br>'],

    // replace google docs italics+bold with a span to be replaced once the html is inserted
    [new RegExp(/<span[^>]*(font-style:italic;font-weight:(bold|700)|font-weight:(bold|700);font-style:italic)[^>]*>/gi), '<span class="replace-with italic bold">'],

    // replace google docs italics with a span to be replaced once the html is inserted
    [new RegExp(/<span[^>]*font-style:italic[^>]*>/gi), '<span class="replace-with italic">'],

    // [replace google docs bolds with a span to be replaced once the html is inserted
    [new RegExp(/<span[^>]*font-weight:(bold|700)[^>]*>/gi), '<span class="replace-with bold">'],

    // replace manually entered b/i/a tags with real ones
    [new RegExp(/&lt;(\/?)(i|b|a)&gt;/gi), '<$1$2>'],

    // replace manually a tags with real ones, converting smart-quotes from google docs
    [new RegExp(/&lt;a(?:(?!href).)+href=(?:&quot;|&rdquo;|&ldquo;|"|“|”)(((?!&quot;|&rdquo;|&ldquo;|"|“|”).)*)(?:&quot;|&rdquo;|&ldquo;|"|“|”)(?:(?!&gt;).)*&gt;/gi), '<a href="$1">'],

    // Newlines between paragraphs in html have no syntactic value,
    // but then have a tendency to accidentally become additional paragraphs down the line
    [new RegExp(/<\/p>\n+/gi), '</p>'],
    [new RegExp(/\n+<p/gi), '<p'],

    // Microsoft Word makes these odd tags, like <o:p></o:p>
    [new RegExp(/<\/?o:[a-z]*>/gi), ''],

    // Microsoft Word adds some special elements around list items
    [new RegExp(/<!\[if !supportLists\]>(((?!<!).)*)<!\[endif]\>/gi), '$1'], // eslint-disable-line no-useless-escape

  ];

  for (let i = 0; i < regs.length; i += 1) {
    text = text.replace(regs[i][0], regs[i][1]);
  }

  return text;
};

Editor.prototype.insertTextAtCaretPosition = function insertTextAtCaretPosition(textToInsert, haveMoreNodes) {
  if (document.getSelection && document.getSelection().getRangeAt) {
    const sel = document.getSelection();
    const range = sel.getRangeAt(0);
    let ca = range.commonAncestorContainer;

    const getBlockContainer = (node) => {
      while (node) {
        if (node.nodeType === 1 && node.nodeName === 'FIGCAPTION') {
          return node;
        }
        node = node.parentNode;
      }
    };

    const generateRightParts = () => {
      if (sel.rangeCount > 0) {
        const blockEl = getBlockContainer(range.endContainer);
        if (blockEl) {
          const ran = range.cloneRange();
          ran.selectNodeContents(blockEl);
          ran.setStart(range.endContainer, range.endOffset);
          return ran.extractContents();
        }
      }
    };

    const generateLeftParts = () => {
      if (sel.rangeCount > 0) {
        const blockEl = getBlockContainer(range.startContainer);
        if (blockEl) {
          const ran = range.cloneRange();
          ran.selectNodeContents(blockEl);
          ran.setEnd(range.startContainer, range.startOffset);
          return ran.extractContents();
        }
      }
    };

    if (sel.type === 'Caret') {
      // let off = range.endOffset;
      const rest = generateRightParts();

      if (ca.nodeType === 3) {
        ca = ca.parentNode;
      }
      ca.appendChild(textToInsert);
      if (!haveMoreNodes) {
        ca.appendChild(rest);
      }
      return rest;
    }
    if (sel.type === 'Range') {
      const left = generateLeftParts();
      let right = '';
      if (haveMoreNodes) {
        right = generateRightParts();
      }
      if (ca.nodeType === 3) {
        ca = ca.parentNode;
      }
      ca.innerHTML = left;
      ca.appendChild(textToInsert);
      if (!haveMoreNodes) {
        ca.appendChild(right);
      }
      return right;
    }
  }
};

Editor.prototype.doPaste = function doPaste(pastedText) {
  if (pastedText.match(/<\/*[a-z][^>]+?>/gi)) {
    pastedText = this.cleanPastedText(pastedText);
    let pei = this.paste_element;
    if (pei) {
      this.paste_element.parentNode.removeChild(pei);
    }

    pei = document.createElement('div');
    pei.style.display = 'none';
    this.paste_element = pei;
    this.elNode.closest('.editor-wrapper').appendChild(pei);

    if (pei) {
      pei.innerHTML = `<span>${pastedText}</span>`;
    }

    // fix span with related tags
    this.handleSpanReplacements(pei);

    this.pastingContent = true;

    this.setupElementsClasses(pei, () => {
      let lastNode; let newNode; let nodes; let
        top;
      nodes = Utils.generateElement(this.paste_element.innerHTML);
      if (nodes && typeof nodes.length !== 'undefined') {
        nodes = [...nodes]; //
      } else if (nodes) { // single element
        nodes = [nodes];
        // this.aa.insertAdjacentElement('afterend', nodes);
      }
      if (nodes === null || nodes.length === 0) {
        return;
      }

      let after = this.aa;
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i];
        after.insertAdjacentElement('afterend', nd);
        after = nd;
      }

      const { aa } = this;
      let caption;

      if (aa.hasClass('item-figure')) {
        if (aa.hasClass('figure-in-row')) {
          const grid = aa.closest('.block-grid');
          if (grid) {
            caption = grid.querySelector('.block-grid-caption');
          }
        } else {
          caption = aa.querySelector('figcaption');
        }
      } else if (aa.hasClass('block-grid-caption')) {
        caption = aa;
      }

      if (caption) {
        const first = nodes;
        const firstText = first.textContent;
        let leftOver = '';
        if (aa.hasClass('item-text-default')) {
          caption.innerHTML = firstText;
        } else {
          leftOver = this.insertTextAtCaretPosition(firstText, nodes.length - 1); // don't count the current node
        }
        aa.removeClass('item-text-default');
        nodes.splice(0, 1);
        first.parentNode.removeChild(first);
        if (leftOver !== '') {
          const o = document.createElement('p');
          o.appendChild(Utils.generateElement(leftOver));
          o.insertAfter(nodes.lastElementChild);
        }
      }

      if (!nodes.length) {
        return;
      }
      if (aa.textContent === '') {
        aa.parentNode.removeChild(aa);
      }

      if (this.paste_element) {
        const pt = this.paste_element.querySelector('figure');
        if (pt) {
          this.paste_element.parentNode.removeChild(pei);
        }
      }

      lastNode = nodes[nodes.length - 1];
      if (lastNode && lastNode.length) {
        lastNode = lastNode[0];
      }
      const num = lastNode.childNodes.length;
      this.setRangeAt(lastNode, num);
      if (newNode) {
        newNode = this.getNode();
        top = newNode.offsetTop;
        this.markAsSelected(newNode);
      }

      this.displayTooltipAt(this.elNode.querySelector('.item-selected'));

      this.cleanupEmptyModifierTags(nodes);

      // handle unwrapped images
      this.handleUnwrappedImages(nodes);
      // unwrapped iframes, if we can handle, we should
      this.handleUnwrappedFrames(nodes);
      // unwrapped lists items, inside p's or consective p's
      this.handleUnwrappedLists(nodes);

      // unwrap p's which might be inside other elements
      this.handleUnwrapParagraphs(nodes);

      this.elNode.querySelectorAll('figure').forEach((ite) => {
        const it = ite;
        if (it.querySelectorAll('img').length === 0) {
          it.parentNode.removeChild(it);
        }
      });

      this.elNode.querySelectorAll('figcaption').forEach((ite) => {
        const it = ite.closest('.item');
        if (it && it.querySelectorAll('img').length === 0) {
          it.parentNode.removeChild(it);
        }
      });

      return Utils.scrollToTop(top);
    });
    return false;
  }
  // its plain text
  const node = this.aa;
  if (node.hasClass('item-figure')) {
    let caption;
    if (node.hasClass('figure-in-row')) {
      const grid = node.closest('.block-grid');
      caption = grid?.querySelector('.block-grid-caption');
    } else {
      caption = node.querySelector('figcaption');
    }
    if (caption) {
      caption.innerHTML = pastedText;
      return false;
    }
  }
};

Editor.prototype.handlePaste = function handlePaste(ev) {
  ev.preventDefault();
  let cbd; let
    pastedText;
  this.aa = this.getNode();
  pastedText = void 0;

  if (window.clipboardData && window.clipboardData.getData) {
    pastedText = window.clipboardData.getData('Text');
  } else if (ev.clipboardData && ev.clipboardData.getData) {
    cbd = ev.clipboardData;
    pastedText = cbd.getData('text/html').isEmpty() ? cbd.getData('text/plain') : cbd.getData('text/html');
  }
  this.doPaste(pastedText);
  return false;
};

Editor.prototype.handleDblclick = function handleDblclick(e) {
  const tg = e.target.closest('.main-controls');
  if (tg) {
    return false;
  }
  const node = this.getNode();
  if (!node) {
    this.setRangeAt(this.prevCurrentNode);
  }
  return false;
};

Editor.prototype.handleMouseDown = function handleMouseDown(e) {
  let node; const
    el = e.toElement;

  if (el.hasClass('placeholder-text') || el.querySelectorAll('.placeholder-text').length) {
    node = el.closest('.figure-caption');
    if (node) {
      e.preventDefault();
      Utils.setCaretAtPosition(node, 0);
    } else {
      node = el.closest('.item');
      if (node) {
        e.preventDefault();
        Utils.setCaretAtPosition(node, 0);
      }
    }
  } else if (el.hasClass('block-background') || el.hasClass('table-view') || el.hasClass('table-cell-view')) {
    const section = el.closest('section');
    if (section) {
      this.selectFigure(section);
    }
  } else if (el.hasClass('block-grid-caption')) {
    el.closest('.block-grid')?.addClass('grid-focused');
  }
};

// NOTE don't use the event, as its just dummy, function gets called from selection change also
Editor.prototype.handleMouseUp = function handleMouseUp() {
  const selection = this.selection();

  if (!selection && selection.anchorNode.hasClass('main-divider')) {
    const newAnchor = selection.anchorNode;
    const focusTo = newAnchor.nextElementSibling.querySelector('.block-content-inner:first-child .item:first-child');
    if (focusTo) {
      this.setRangeAt(focusTo);
      Utils.setCaretAtPosition(focusTo);
    }
  }

  const anchorNode = this.getNode();

  if (!anchorNode) {
    return;
  }

  this.prevCurrentNode = anchorNode;
  this.handleTextSelection(anchorNode);
  this.markAsSelected(anchorNode);

  if (!anchorNode.hasClass('item-figure')) {
    return this.displayTooltipAt(anchorNode);
  }
  this.hideContentBar();
  return this;
};

Editor.prototype.handleArrow = function handleArrow() {
  const currentNode = this.getNode();
  if (currentNode) {
    this.markAsSelected(currentNode);
    return this.displayTooltipAt(currentNode);
  }
};

Editor.prototype.handleTab = function handleTab(anchorNode, event) {
  const nextTabable = function nextTabable(node) {
    let next = node.next('.item');
    if (next) {
      return next;
    }
    const cont = node.closest('.block-content-inner');
    next = cont?.nextElementSibling;
    if (next) {
      return next;
    }
    const sec = node.closest('.block-content');
    next = sec?.next();
    if (next) {
      const block = next?.querySelector('.block-content-inner:last-child');
      if (block) {
        const item = block?.querySelector('.item:last-child');
        if (item) {
          return item;
        }
        return block;
      }
      return next;
    }
    return false;
  };

  const prevTabable = function prevTabable(node) {
    let prev = node.prev('.item');
    if (prev) {
      return prev;
    }
    let cont = node.closest('.block-content-inner');
    cont = cont?.previousElementSibling;

    if (cont && (cont.hasClass('block-grid') || cont.hasClass('full-width-column'))) {
      return cont;
    } if (cont.length && cont.hasClass('center-column')) {
      const i = cont.querySelector('.item:last-child');
      if (i) {
        return i;
      }
    }

    const sec = node.closest('.block-content');
    prev = sec.previousElementSibling;
    if (prev) {
      const last = prev.querySelector('.block-content-inner:last-child');
      if (last && last.hasClass('block-grid')) {
        return last;
      } if (last && last.hasClass('center-column')) {
        const i = last.querySelector('.item:last-child');
        if (i) {
          return i;
        }
      }
    }
    return false;
  };

  let next;
  if (!anchorNode) {
    anchorNode = document.querySelector('.item-selected');
    if (!anchorNode) {
      anchorNode = document.querySelector('.grid-focused');
    }
  }
  if (!anchorNode) {
    return;
  }
  if (event.shiftKey) {
    next = prevTabable(anchorNode);
  } else {
    next = nextTabable(anchorNode);
  }
  if (next) {
    if (next.hasClass('block-grid')) {
      const cap = next.querySelector('.block-grid-caption');
      if (cap) {
        this.setRangeAt(cap);
      }
      next.addClass('grid-focused');
    } else if (next.hasClass('full-width-column')) {
      const fig = next.querySelector('.item-figure');
      if (fif) {
        const cap = fig.querySelector('figcaption');
        if (cap) {
          this.setRangeAt(cap);
        }
        this.selectFigure(fig);
      }
    } else if (next.hasClass('item-figure')) {
      const cap = next.querySelector('figcaption');
      if (cap) {
        this.setRangeAt(cap);
      }
      this.selectFigure(next);
    } else if (next.hasClass('with-background')) {
      const items = next.querySelector('.item:first-child');
      if (items) {
        this.setRangeAt(items[0]);
      }
      this.selectFigure(next);
    } else {
      this.setRangeAt(next);
      this.markAsSelected(next);
      this.displayTooltipAt(next);
    }
    return this.scrollTo(next);
  }
};

Editor.prototype.handleArrowForKeyDown = function handleArrowForKeyDown(ev) {
  if (ev.shiftKey) { // probably trying
    return;
  }
  let currentNode; let n; let nextNode; let num; let prevNode; let crossingSection = false; let
    cn;
  const caretNode = this.getNode();
  currentNode = caretNode;

  const evType = ev.key || ev.keyIdentifier;

  switch (evType) {
    case 'Left':
    case 'Right':
      if (!currentNode || !currentNode.length) {
        if (document.querySelector('.item-selected')) {
          currentNode = document.querySelector('.item-selected');
        }
      }
      if (currentNode.querySelectorAll('.placeholder-text').length === 1) {
        Utils.stopEvent(ev);
        return false;
      }
      break;
    case 'Down':
      if (!currentNode || !currentNode.length) {
        if (document.querySelector('.item-selected')) {
          currentNode = document.querySelector('.item-selected');
        }
      }

      nextNode = currentNode.nextElementSibling;

      if (!nextNode) {
        n = this.findNextFocusableElement(currentNode);
        nextNode = n.node;
        crossingSection = n.section_crossed;
      }

      if (currentNode.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
        // we move to caption unles its a partialwidth
        if (currentNode.hasClass('figure-in-row') && nextNode && !nextNode.hasClass('figure-in-row')) {
          const cont = currentNode.closest('.block-content-inner');
          if (cont) {
            const last = cont.querySelector('.item-figure:last-child');
            if (last && last.attr('name') === currentNode.attr('name')) {
              nextNode = cont.closest('.block-grid').querySelector('.block-grid-caption');
            }
          }
        } else if (!nextNode || !currentNode.hasClass('figure-in-row')) {
          nextNode = currentNode.querySelector('.figure-caption');
        }
      } else if (currentNode.hasClass('item-figure') && ev.target.hasClass('figure-caption')) {
        if (currentNode.hasClass('figure-in-row')) {
          currentNode.closest('.block-content-inner').removeClass('figure-focused');
        }
        if (!nextNode) { // we don't have a next node
          const cont = currentNode.closest('.block-content-inner').nextElementSibling;
          if (cont) {
            nextNode = cont.querySelector('.item:first-child');
          }
        }
      }
      cn = currentNode;

      if (!cn.hasClass('item') && cn.nodeName !== 'FIGCAPTION') {
        return;
      }

      if (cn.hasClass('item-last') && Utils.editableCaretOnLastLine(currentNode)) {
        return;
      }

      if (!nextNode) {
        return;
      }

      if (nextNode.hasClass('figure-caption') || nextNode.hasClass('block-grid-caption')) {
        const figure = nextNode.closest('.item-figure');
        if (figure || currentNode.hasClass('figure-in-row')) {
          this.hideImageToolbar();
          this.markAsSelected(figure);
          this.setRangeAt(nextNode);
          if (figure.hasClass('figure-in-row')) {
            figure.closest('.block-content-inner').addClass('figure-focused');
          }
          if (currentNode.hasClass('figure-in-row')) {
            currentNode.closest('.block-grid').addClass('grid-focused');
          }
          Utils.setCaretAtPosition(nextNode);
          ev.preventDefault();
          return false;
        }
      }

      if (currentNode.hasClass('item-figure') && nextNode.hasClass('item-figure')) {
        this.scrollTo(nextNode);
        this.skip_keyup = true;
        this.selectFigure(nextNode);
        return false;
      }

      if (nextNode.hasClass('item-figure') && caretNode) {
        this.skip_keyup = true;
        this.selectFigure(nextNode);
        ev.preventDefault();
        return false;
      } if (nextNode.hasClass('item-mixtapeEmbed')) {
        n = currentNode.next('.item-mixtapeEmbed');
        num = n.childNodes.length;
        this.setRangeAt(n, num);
        this.scrollTo(n);

        return false;
      }

      if (currentNode.hasClass('item-figure') && nextNode.hasClass('item')) {
        this.scrollTo(nextNode);

        if (nextNode.querySelectorAll('.placeholder-text').length) {
          this.markAsSelected(nextNode);
          this.setRangeAt(nextNode);
          Utils.setCaretAtPosition(nextNode, 0);
          ev.preventDefault();
          return false;
        }
        this.markAsSelected(nextNode);
        this.setRangeAt(nextNode);
        ev.preventDefault();
        return false;
      }

      if (nextNode.hasClass('item-last') && nextNode.querySelector('.placeholder-text')) {
        Utils.stopEvent(ev);
        Utils.setCaretAtPosition(nextNode, 0);
        return false;
      }

      if (nextNode.querySelectorAll('.placeholder-text').length) {
        Utils.setCaretAtPosition(nextNode, 0);
        return false;
      }

      if (crossingSection) {
        ev.preventDefault();
        this.setRangeAt(nextNode);
        Utils.setCaretAtPosition(nextNode, 0);
        this.markAsSelected(nextNode);
        return false;
      }

      this.markAsSelected(nextNode);

      break;
    case 'Up':
      if (!currentNode || !currentNode.length) {
        if (document.querySelector('.item-selected')) {
          currentNode = document.querySelector('.item-selected');
        }
      }

      prevNode = currentNode.previousElementSibling;

      if (!prevNode) {
        n = this.findPreviousFocusableElement(currentNode);
        prevNode = n.node;
        crossingSection = n.section_crossed;
      }

      if (typeof prevNode === 'undefined') {
        prevNode = currentNode.previousElementSibling;
      }

      if (currentNode.hasClass('block-grid-caption')) {
        const lastRow = currentNode.closest('.block-grid').querySelector('.block-grid-row');
        if (lastRow) {
          prevNode = lastRow.querySelector('.item-figure:last-child');
        }
      } else if (currentNode.hasClass('block-grid-row') && ev.target.hasClass('figure-caption')) {
        prevNode = currentNode.querySelector('.figure-in-row:last-child');
      } else if (currentNode.hasClass('block-grid-row')) { // eslint-disable-line no-empty

      } else if (prevNode.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
        if (prevNode.hasClass('figure-in-row')) {
          const cont = prevNode.closest('.block-content-inner');
          const lastGraf = cont ? cont.querySelector('.item-figure:last-child') : null;
          if (cont && lastGraf && lastGraf.attr('name') === prevNode.attr('name')) {
            prevNode = prevNode.querySelector('.figure-caption');
          }
        } else {
          prevNode = prevNode.querySelector('.figure-caption');
        }
      } else if (currentNode.hasClass('item-figure') && ev.target.hasClass('figure-caption')) {
        if (currentNode.hasClass('figure-in-row')) {
          prevNode = currentNode;
        } else {
          prevNode = currentNode;
        }
      }
      cn = currentNode;

      if (!cn.hasClass('item') && !cn.hasClass('block-grid-caption')) {
        return;
      }
      if (!(cn.hasClass('item-figure') || !cn.hasClass('item-first'))) {
        return;
      }

      if (prevNode.hasClass('block-grid-caption')) {
        prevNode.closest('.block-grid')?.addClass('grid-focused');
      }

      if (prevNode.hasClass('figure-caption')) {
        const figure = prevNode.closest('.item-figure');
        this.hideImageToolbar();
        this.markAsSelected(figure);
        this.setRangeAt(prevNode);
        this.scrollTo(prevNode);
        if (figure.hasClass('figure-in-row')) {
          figure.closest('.block-content-inner').addClass('figure-focused');
        }
        Utils.setCaretAtPosition(prevNode);
        ev.preventDefault();
        return false;
      }

      if (prevNode.hasClass('item-figure')) {
        document.activeElement.blur();
        this.elNode.focus();
        this.selectFigure(prevNode);
        return false;
      } if (prevNode.hasClass('item-mixtapeEmbed')) {
        n = currentNode.prev('.item-mixtapeEmbed');
        if (n) {
          num = n.childNodes.length;
          this.setRangeAt(n, num);
          this.scrollTo(n);
        }
        return false;
      }

      if (currentNode.hasClass('item-figure') && prevNode.hasClass('item')) {
        if (document.activeElement) {
          document.activeElement.blur();
          this.elNode.focus();
        }

        this.hideImageToolbar();

        this.markAsSelected(prevNode);
        this.scrollTo(prevNode);

        this.setRangeAt(prevNode);
        Utils.setCaretAtPosition(prevNode);
        this.skip_keyup = true;
        ev.preventDefault();

        return false;
      } if (prevNode.hasClass('item') && !crossingSection) {
        n = currentNode.prev('.item');
        if (n) {
          this.scrollTo(n);
        } else {
          this.scrollTo(prevNode);
        }

        this.markAsSelected(prevNode);

        if (prevNode.hasClass('item-first') && prevNode.querySelector('.placeholder-text')) {
          Utils.stopEvent(ev);
          Utils.setCaretAtPosition(prevNode, 0);
        }

        return false;
      }

      if (crossingSection) {
        ev.preventDefault();
        this.setRangeAt(prevNode);
        Utils.setCaretAtPosition(prevNode, 0);
        this.markAsSelected(prevNode);
        return false;
      }
  }
};

Editor.prototype.insertFancyChar = function insertFancyChar(event, text) {
  Utils.stopEvent(event);
  const node = this.getNode();
  let textVal;
  const range = this.selection().getRangeAt(0);

  range.deleteContents();
  if (text === 'single' || text === 'double') {
    textVal = node.textContent;
    let leftQuote = false;// , rightQuote = false;

    if ((!text || (text !== null && text.trim().length === 0)) || this.isFirstChar() || /\s/.test(textVal.charAt(textVal.length - 1))) {
      leftQuote = true;
    }

    if (text === 'single') {
      if (leftQuote) {
        text = QUOTE_LEFT_UNICODE;
      } else {
        text = QUOTE_RIGHT_UNICODE;
      }
    } else if (text === 'double') {
      if (leftQuote) {
        text = DOUBLEQUOTE_LEFT_UNICODE;
      } else {
        text = DOUBLEQUOTE_RIGHT_UNICODE;
      }
    }
  } else if (text === 'dash') {
    text = DASH_UNICODE;
  }

  let appended = false;
  if (node.hasClass('pullquote') && !node.hasClass('with-cite') && (text === DOUBLEQUOTE_RIGHT_UNICODE || text === DASH_UNICODE)) {
    if (Utils.editableCaretAtEnd(node)) {
      const cite = (`<cite class="item-cite">${DASH_UNICODE} </cite>`);
      node.appendChild(Utils.generateElement(cite));
      Utils.setCaretAtPosition(cite, 2);
      node.addClass('with-cite');
      appended = true;
    }
  }

  if (!appended) {
    const textNode = document.createTextNode(text);
    const range = document.createRange();
    range.insertNode(textNode);

    const sel = this.selection();

    range.setStart(textNode, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

// TODO for special chars insertion, keydown code is not differentiable
Editor.prototype.handleKeyPress = function handleKeyPress(e) {
  switch (e.which) {
    case SINGLE_QUOTE_WHICH:
      this.insertFancyChar(e, 'single');
      break;
    case DOUBLE_QUOTE_WHICH:
      this.insertFancyChar(e, 'double');
      break;
    case DASH_WHICH:
      this.insertFancyChar(e, 'dash');
      break;
  }
};

Editor.prototype.handleShortCutKeys = function handleShortCutKeys(e) {
  const { which } = e;
  this.currentNode = this.getNode();
  const node = this.currentNode;

  if (e.ctrlKey && which === CHAR_LINK) {
    if (this.image_toolbar && (node.hasClass('item-figure') || node.hasClass('item-iframe'))) {
      this.image_toolbar.addLink(e);
      return;
    }
  }

  if (e.ctrlKey && e.altKey) {
    if (SHORT_CUT_KEYS.indexOf(which) !== -1 && this.text_toolbar) {
      return this.text_toolbar.shortCutKey(which);
    }
  } else if (e.ctrlKey && (which === CHAR_CENTER || which === CHAR_LINK)) {
    return this.text_toolbar.shortCutKey(which, e);
  }
};

Editor.prototype.handleKeyDown = function handleKeyDown(e) {
  const tg = e.target;
  if (tg.hasClass('.autocomplete')) {
    this.skip_keyup = true;
    return;
  }

  if (e.ctrlKey && !e.shiftKey && [LEFTARROW, DOWNARROW, UPARROW, DOWNARROW].indexOf(e.which) !== -1 && tg.hasClass('item-figure')) {
    return this.handleKeyDownOnFigure(e, tg);
  }

  if (e.ctrlKey && !e.shiftKey && e.which >= 49 && e.which <= 52 && (tg.hasClass('item-figure') || document.querySelectorAll('.with-background.figure-focused').length)) {
    if (this.image_toolbar) {
      this.image_toolbar.shortCutKey(e.which, e);
    }
    return false;
  }

  let anchorNode;
  let eventHandled; let li;
  let utilsAnchorNode;

  anchorNode = this.getNode();
  const parent = anchorNode;

  if (anchorNode) {
    this.markAsSelected(anchorNode);
  }

  this.hidePlaceholder(anchorNode, e); // hide placeholder if we are in placeholder item

  this.handleShortCutKeys(e);

  if (e.which === ESCAPE) {
    if (this.text_toolbar) {
      this.skip_keyup = true;
      this.text_toolbar.hide();
    }
    if (this.image_toolbar) {
      this.skip_keyup = true;
      this.image_toolbar.hide();
    }
    return false;
  }
  if (e.which === TAB) {
    this.handleTab(anchorNode, e);
    return false;
  }

  if (e.ctrlKey && !e.shiftKey && e.which === 67 && (!anchorNode || anchorNode.length === 0) && document.querySelector('.figure-focused')) {
    if (document.createRange) {
      const range = document.createRange();
      const figure = document.querySelector('.figure-focused .item-image');
      this.skip_keyup = true;
      if (figure) {
        const sel = this.selection();
        sel.removeAllRanges();
        range.selectNode(figure);
        sel.addRange(range);
      }
    }
  }

  if (e.which === DELETE) {
    if (this.reachedTop && this.isFirstChar() && !anchorNode.next('.item')) {
      const sec = anchorNode.closest('.block-content');

      if (sec && sec.next('.block-content')) {
        this.content_options.forEach((w) => {
          if (w && w.contentId && w.contentId === 'SECTION') {
            w.handleDeleteKey(e, anchorNode);
          }
        });
      }

      const df = anchorNode.querySelector('.placeholder-text');
      const intt = anchorNode.next('.item');
      if (df && intt && intt.querySelectorAll('.placeholder-text').length) {
        intt.parentNode.removeChild(intt);
        anchorNode.addClass('item-last');
        anchorNode.innerHTML = '<br />';
      } else {
        anchorNode.addClass('item-empty');
        anchorNode.innerHTML = '<br />';
      }
      Utils.setCaretAtPosition(anchorNode);
      return false;
    }
    if (anchorNode.querySelectorAll('.placeholder-text').length) {
      anchorNode.addClass('item-empty');
      anchorNode.innerHTML = '<br />';
      Utils.setCaretAtPosition(anchorNode);
      return false;
    }

    this.content_options.forEach((w) => {
      if (w.handleDeleteKey) {
        return w.handleDeleteKey(e, parent);
      }
    });
  }

  if (e.which === ENTER) {
    const sel = this.elNode.querySelector('.item-selected');
    const placeholderText = sel?.querySelector('.placeholder-text');

    if (sel && !sel.hasClass('item-figure') && placeholderText) {
      sel.innerHTML = '<br />';
      sel.addClass('item-empty');
      placeholderText.parentNode.removeChild(placeholderText);
    }

    if (sel) {
      sel.removeClass('item-selected');
    }

    if (parent.hasClass('item-p')) {
      li = this.handleSmartList(parent, e);
      if (li) {
        anchorNode = li;
      }
    } else if (parent.hasClass('item-li')) {
      this.handleListLineBreak(parent, e);
    }

    this.content_options.forEach((w) => {
      if (w.handleEnterKey) {
        return w.handleEnterKey(e, parent);
      }
    });

    if (e.handled) {
      return false;
    }

    if (sel.hasClass('block-grid-caption')) {
      this.handleLineBreakWith('p', parent);
      this.setRangeAtText(document.querySelector('.item-selected'));
      document.querySelector('.item-selected').dispatchEvent(new Event('mouseup'));

      return false;
    }

    if (parent.hasClass('item-mixtapeEmbed') || parent.hasClass('item-iframe') || parent.hasClass('item-figure')) {
      if (e.target.hasClass('figure-caption')) {
        this.handleLineBreakWith('p', parent);
        this.setRangeAtText(document.querySelector('.item-selected'));
        document.querySelector('.item-selected').dispatchEvent(new Event('mouseup'));
        return false;
      } if (!this.isLastChar()) {
        return false;
      }
    }

    if (parent.hasClass('item-iframe') || parent.hasClass('item-figure')) {
      if (this.isLastChar()) {
        this.handleLineBreakWith('p', parent);
        this.setRangeAtText(document.querySelector('.item-selected'));
        document.querySelector('.item-selected').dispatchEvent(new Event('mouseup'));
        return false;
      }
      return false;
    }

    if (anchorNode && this.toolbar.lineBreakReg.test(anchorNode.nodeName)) {
      if (this.isLastChar()) {
        e.preventDefault();
        this.handleLineBreakWith('p', parent);
      }
    }
    const self = this;
    setTimeout(() => {
      let node = self.getNode();

      if (!node) {
        return;
      }

      node.removeAttribute('name');

      self.setElementName(node);

      if (node.nodeName.toLowerCase() === 'div') {
        node = self.replaceWith('p', node);
      }
      // FIXME fix this code
      const pctAll = node && node.nodeType === 1 ? node.children : null;
      if (pctAll && pctAll.length) {
        Array.from(pctAll).forEach((pa) => {
          if (pa.matches('.placeholder-text')) {
            pa.parentNode.removeChild(pa);
          }
        });
      }
      // const pct = node.querySelector('> .placeholder-text');
      // if(pct) {
      //   pct.parentNode.removeChild(pct);
      // }

      self.markAsSelected(node);
      self.setupFirstAndLast();

      if (node.textContent.isEmpty()) {
        Array.from(node.children).forEach((n) => {
          n.parentNode.removeChild(n);
        });
        node.appendChild(document.createElement('br'));
        if (self.isTouch) {
          // $node.hammer({});
        }
      }
      return self.displayTooltipAt(self.elNode.querySelector('.item-selected'));
    }, 15);
  }

  if (e.which === BACKSPACE) {
    eventHandled = false;
    this.toolbar.hide();
    anchorNode = this.getNode();

    const selAnchor = this.selection().anchorNode;

    if (this.reachedTop) { // eslint-disable-line no-empty

    }

    if (anchorNode && anchorNode.querySelectorAll('.placeholder-text').length) {
      e.preventDefault();
      anchorNode.addClass('item-empty');
      anchorNode.innerHTML = '<br />';
      this.skip_keyup = true;
      this.setRangeAt(anchorNode);
      return false;
    }

    if ((this.prevented || this.reachedTop && this.isFirstChar()) && !selAnchor.hasClass('block-background')) {
      return false;
    }

    utilsAnchorNode = Utils.getNode();

    this.content_options.forEach((w) => {
      let handled;
      if (w.handleBackspaceKey && !handled) {
        return handled = w.handleBackspaceKey(e, anchorNode);
      }
    });

    if (eventHandled) {
      e.preventDefault();
      return false;
    }

    // Undo to normal quotes and dash if user immediately pressed backspace
    const existingText = this.getCharacterPrecedingCaret();
    const charAtEnd = existingText.charAt(existingText.length - 1);

    if (UNICODE_SPECIAL_CHARS.indexOf(charAtEnd) !== -1) {
      this.handleSpecialCharsBackspace(charAtEnd);
      return false;
    }

    if (parent && parent.hasClass('item-li') && this.getCharacterPrecedingCaret().length === 0) {
      return this.handleListBackspace(parent, e);
    }

    if (anchorNode.hasClass('item-p') && this.isFirstChar()) {
      if (anchorNode.previousElementSibling && anchorNode.previousElementSibling.hasClass('item-figure')) {
        // e.preventDefault();

        // return false;
      }
    }

    if (utilsAnchorNode.hasClass('main-body') || utilsAnchorNode.hasClass('item-first')) {
      if (utilsAnchorNode.textContent.isEmpty()) {
        return false;
      }
    }

    if (anchorNode && anchorNode.nodeType === 3) { // eslint-disable-line no-empty

    }

    if (anchorNode.hasClass('item-mixtapeEmbed') || anchorNode.hasClass('item-iframe')) {
      if (anchorNode.textContent.isEmpty() || this.isFirstChar()) {
        this.inmediateDeletion = this.isSelectingAll(anchorNode);
        if (this.inmediateDeletion) {
          this.handleInmediateDeletion(anchorNode);
        }
        return false;
      }
    }

    if (anchorNode.previousElementSibling && anchorNode.previousElementSibling.hasClass('item-mixtapeEmbed')) {
      if (this.isFirstChar() && !anchorNode.textContent.isEmpty()) {
        return false;
      }
    }

    if (anchorNode.hasClass('item-first')) {
      if ((anchorNode.textContent.isEmpty() || anchorNode.textContent.length === 1) && anchorNode.closest('.block-first')) {
        if (anchorNode.nextElementSibling && anchorNode.nextElementSibling.hasClass('item-last')) {
          anchorNode.innerHTML = '';
          return false;
        }
      }
    }

    const self = this;
    setTimeout(() => {
      const backspacedTo = window.getSelection();
      if (backspacedTo.type === 'Caret') {
        self.markAsSelected(backspacedTo.anchorNode);
      }
    }, 30);
  }

  if (e.which === SPACEBAR) {
    if (parent.hasClass('item-p')) {
      this.handleSmartList(parent, e);
    }
  }

  if (anchorNode) {
    if (!anchorNode.textContent.isEmpty() && anchorNode.querySelectorAll('.placeholder-text').length === 0) {
      this.hideContentBar();
      anchorNode.removeClass('item-empty');
    }
  }

  if ([UPARROW, DOWNARROW, LEFTARROW, RIGHTARROW].indexOf(e.which) !== -1) {
    this.handleArrowForKeyDown(e);
  }
};

Editor.prototype.handleSpecialCharsBackspace = function handleSpecialCharsBackspace(charAtEnd) {
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel.type !== 'Caret') { return; }
    const range = sel.getRangeAt(0);
    const commonAn = range.commonAncestorContainer;
    if (commonAn.nodeType === 3) { // its a text node
      const nv = commonAn.nodeValue;
      let toReplaceWith = '';
      if (charAtEnd === QUOTE_LEFT_UNICODE || charAtEnd === QUOTE_RIGHT_UNICODE) {
        toReplaceWith = "'";
      } else if (charAtEnd === DOUBLEQUOTE_LEFT_UNICODE || charAtEnd === DOUBLEQUOTE_RIGHT_UNICODE) {
        toReplaceWith = '"';
      } else if (charAtEnd === DASH_UNICODE) {
        toReplaceWith = '-';
      }
      const position = range.startOffset;
      if (nv.length === 1) {
        commonAn.nodeValue = toReplaceWith;
        const nrange = document.createRange();
        const sele = sel;

        nrange.setStart(commonAn, 1);
        nrange.collapse(true);
        sele.removeAllRanges();
        sele.addRange(nrange);
      } else {
        const newNodeValue = nv.substr(0, position - 1) + toReplaceWith + nv.substr(position);
        commonAn.nodeValue = newNodeValue;
        const nrange = document.createRange();
        const sele = sel;

        nrange.setStart(commonAn, position);
        nrange.collapse(true);
        sele.removeAllRanges();
        sele.addRange(nrange);
      }
    }
  }
};

Editor.prototype.handleKeyUp = function handleKeyUp(e) {
  let nextItem;
  if (this.skip_keyup) {
    this.skip_keyup = null;
    return false;
  }

  this.toolbar.hide();
  this.reachedTop = false;
  const anchorNode = this.getNode();

  const utilsAnchorNode = Utils.getNode();

  this.handleTextSelection(anchorNode);
  if ([BACKSPACE, SPACEBAR, ENTER].indexOf(e.which) !== -1) {
    if (anchorNode && anchorNode.hasClass('item-li')) {
      this.removeSpanTag(anchorNode);
    }
  }

  if ([LEFTARROW, UPARROW, RIGHTARROW, DOWNARROW].indexOf(e.which) !== -1) {
    return this.handleArrow(e);
  }

  if (e.which === BACKSPACE) {
    if (utilsAnchorNode.hasClass('article-body')) {
      this.handleCompleteDeletion(this.elNode);
      if (this.completeDeletion) {
        this.completeDeletion = false;
        return false;
      }
    }
    if (utilsAnchorNode.hasClass('main-body') || utilsAnchorNode.hasClass('item-first')) {
      if (utilsAnchorNode.textContent.isEmpty()) {
        nextItem = utilsAnchorNode.next('.item');
        if (nextItem) {
          this.setRangeAt(nextItem);
          utilsAnchorNode.parentNode.removeChild(utilsAnchorNode);
          this.setupFirstAndLast();
        } else {
          const cont = utilsAnchorNode.closest('.with-background');
          if (cont && cont.next('.block-content')) {
            const nxtSection = cont.next('.block-content');
            const item = nxtSection?.querySelector('.item');
            if (item) {
              this.setRangeAt(item);
            }
            cont.parentNode.removeChild(cont);
            this.fixSectionClasses();
            this.setupFirstAndLast();
          } else if (cont && !cont.next('.block-content')) {
            const havePrev = cont.prev('.block-content');
            if (havePrev) {
              const items = havePrev.querySelectorAll('.item');
              if (items.length) {
                const item = items[items.length - 1];
                if (item) {
                  this.setRangeAt(item);
                }
                cont.remove();
                this.fixSectionClasses();
                this.setupFirstAndLast();
              }
            } else {
              this.handleCompleteDeletion(utilsAnchorNode);
            }
          }
        }
        return false;
      }
    }

    if (!anchorNode) {
      this.handleNullAnchor();
      return false;
    }

    if (anchorNode.hasClass('item-first')) {
      if (this.getSelectedText() === this.getNode().textContent) {
        this.getNode().innerHTML = '<br>';
      }
      this.markAsSelected(anchorNode);
      this.setupFirstAndLast();
      return false;
    }

    if (anchorNode.hasClass('item-last')) {
      if (anchorNode.textContent.isEmpty() && anchorNode.closest('.block-first')) {
        if (anchorNode.previousElementSibling && anchorNode.previousElementSibling.hasClass('item-first')) {
          Utils.stopEvent(e);
          anchorNode.innerHTML = this.templates.subtitle_placeholder;
          return false;
        }
      }
    }

    if (anchorNode.hasClass('item-first')) {
      if (anchorNode.textContent.isEmpty() && anchorNode.closest('.block-first')) {
        if (anchorNode.nextElementSibling && anchorNode.nextElementSibling.hasClass('item-last')) {
          Utils.stopEvent(e);
          anchorNode.innerHTML = this.templates.title_placeholder;
          return false;
        }
      }
    }
  }

  const tg = e.target;
  if (tg.nodeName && tg.nodeName.toLowerCase() === 'figcaption') {
    if (tg.textContent.isEmpty()) {
      if (tg.hasClass('block-grid-caption')) {
        tg.closest('.block-grid')?.addClass('item-text-default');
      } else {
          tg.closest('.item-figure')?.addClass('item-text-default');
      }
    } else if (tg.hasClass('block-grid-caption')) {
        tg.closest('.block-grid')?.removeClass('item-text-default');
    } else {
        tg.closest('.item-figure')?.removeClass('item-text-default');
    }
  }

  if (e.which === BACKSPACE && tg.hasClass('figure-caption')) {
    const caption = e.target; const
      text = caption.textContent;
    if (text.killWhiteSpace().isEmpty() || (text.length === 1 && text === ' ')) {
      if (!caption.attr('data-placeholder-value')) {
        caption.attr('data-placeholder-value', 'Type caption for image(Optional)');
      }
      caption.appendChild(Utils.generateElement(`<span class="placeholder-text">${caption.attr('data-placeholder-value')}</span>`));
      if (caption.closest('.item-figure')) {
        caption.closest('.item-figure').addClass('item-text-default');
      }
    }
  }
};

/** image drag and drop * */
Editor.prototype.positionsCache = [];
Editor.prototype.createElementPositionsCache = function createElementPositionsCache() {
  if (this.positionsCache.length === 0) {
    const nodes = this.elNode.querySelectorAll('.item');
    const cache = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const it = nodes[i];
      const o = it.getBoundingClientRect();
      cache.push([it.attr('name'), o.top + it.height, o.left]);
    }
    cache.sort((a, b) => a[1] - b[1]);
    this.positionsCache = cache;
  }
};

Editor.prototype.generatePlaceholderForDrop = function generatePlaceholderForDrop(position) {
  let i = 0; const cache = this.positionsCache; const
    len = cache.length;
  for (; i < len; i += 1) {
    if (cache[i][1] > position) {
      break;
    }
  }
  const item = i > 0 ? cache[i - 1] : cache[0];
  if (item) {
    const already = document.querySelector(`#drag_pc_${item}`);
    if (!already) {
      const dp = document.querySelector('.drop-placeholder');
      dp.parentNode.remove(dp);
      const o = `<div class="drop-placeholder" id="drag_pc_${item}"></div>`;
      Utils.generateElement(o).insertAfter(document.querySelector(`[name="${item}"]`));
    }
  }
};

Editor.prototype.handleDragEnter = function handleDragEnter(e) {
  e.stopPropagation();
  this.createElementPositionsCache();
};

Editor.prototype.handleDragExit = function handleDragExit(e) {
  e.stopPropagation();
};

Editor.prototype.handleDragEnd = function handleDragEnd(e) {
  e.stopPropagation();
  this.positionsCache = {};
};

Editor.prototype.handleDrag = function handleDrag(e) {
  e.stopPropagation();
  e.preventDefault();
  this.generatePlaceholderForDrop(e.pageY);
};

Editor.prototype.handleDrop = function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  const dragItem = e.dataTransfer;
  const { files } = dragItem;
  let haveUploads = false;
  if (!files || files.length === 0) {
    this.image_uploader.uploadFiles(files, true);
    haveUploads = true;
  } else {
    const html = dragItem.getData('text/html');
    if (html && html.trim().length !== 0) {
      const placeholder = this.elNode.querySelector('.drop-placeholder');
      let m = placeholder.next('.item');
      // FIXME check for isngle item
      if (m.length) {
        this.aa = m;
      } else {
        m = placeholder.prev('.item');
        if (m.length) {
          this.aa = m;
        } else {
          this.aa = this.getNode();
        }
      }
      this.doPaste(html);
    }
  }

  if (haveUploads) {
    this.elNode.querySelector('.drop-placeholder').hide();
  } else {
    this.elNode.querySelector('.drop-placeholder').remove();
  }

  return false;
};

Editor.prototype.handleLineBreakWith = function handleLineBreakWith(etype, fromElement) {
  const newParagraph = Utils.generateElement(this.templates.singleItemTemplate(etype));

  if (fromElement.hasClass('block-grid-caption')) {
    fromElement.closest('.block-grid')?.insertAdjacentElement('afterend', newParagraph);
  } else if (fromElement.parentNode.matches('[class^="item-"]')) {
    fromElement.parentNode.insertAdjacentElement('afterend', newParagraph);
  } else {
    fromElement.insertAdjacentElement('afterend', newParagraph);
  }
  this.setRangeAt(newParagraph);
  return this.scrollTo(newParagraph);
};

Editor.prototype.replaceWith = function replaceWith(etype, fromElement) {
  const newParagraph = Utils.generateElement(this.templates.singleItemTemplate(etype));
  fromElement.replaceWith(newParagraph);
  this.setRangeAt(newParagraph);
  this.scrollTo(newParagraph);
  return newParagraph;
};

// EVENT LISTENERS END //

Editor.prototype.findNextFocusableElement = function findNextFocusableElement(currentNode) {
  let inner; let cont; let crossingSection = false;
  let nextNode;

  if (currentNode.hasClass('item-li')) {
    const list = currentNode.closest('.postList');
    if (list.nextElementSibling) {
      nextNode = list.nextElementSibling;
    }
  }

  if (!nextNode) {
    if (currentNode.hasClass('figure-in-row')) {
      const row = currentNode.closest('.block-grid-row');
      const nextRow = row?.nextElementSibling;

      if (nextRow && !nextRow.hasClass('block-grid-caption')) {
        nextNode = nextRow.querySelector('.item-figure:first-child');
      } else if (nextRow && nextRow.hasClass('block-grid-caption')) {
        nextNode = nextRow;
      }
    } else {
      inner = currentNode.closest('.block-content-inner');
      cont = inner?.nextElementSibling;
      if (cont.hasClass('block-grid')) {
        nextNode = cont.querySelector('.block-grid-row:first-child .item:first-child');
      } else if (cont) {
        nextNode = cont.querySelector('.item:first-child');
      } else { // probably a new section below then
        const section = inner.closest('section');
        const nextSection = section?.nextElementSibling;
        if (nextSection) {
          cont = nextSection.querySelector('.main-body .block-content-inner:first-child');
          if (cont) {
            nextNode = cont.querySelector('.item:first-child');
            crossingSection = true;
          }
        }
      }
    }
  }

  return { node: nextNode, section_crossed: crossingSection };
};

Editor.prototype.findPreviousFocusableElement = function findPreviousFocusableElement(currentNode) {
  let cont = currentNode.closest('.block-content-inner');
  cont = cont?.previousElementSibling;
  let prevNode; let
    crossingSection = false;

  if (currentNode.hasClass('figure-in-row')) {
    const cr = currentNode.closest('.block-grid');
    const first = cr?.querySelector('.block-grid-row:first-child .figure-in-row:first-child');

    if (first && first === currentNode) {
      const pr = cr.previousElementSibling;
      if (pr && !pr.hasClass('block-grid')) {
        prevNode = pr.querySelector('> .item:last-child');
      } else if (pr && pr.hasClass('block-grid')) {
        const lastCap = pr.querySelector('.block-grid-caption');
        prevNode = lastCap;
      }
    }
  }

  if (!prevNode) {
    if (cont.length && cont.hasClass('block-grid')) {
      const caption = cont.querySelector('.block-grid-caption');
      prevNode = caption;
    } else if (cont) {
      prevNode = cont.querySelector('.item:last-child');
    } else {
      const section = currentNode.closest('section');
      const prevSection = section?.previousElementSibling;

      if (prevSection) {
        cont = prevSection.querySelector('.main-body .block-content-inner:last-child');
        if (cont) {
          prevNode = cont.querySelector('.item:last-child');
          crossingSection = true;
        }
      }
    }
  }
  return { node: prevNode, section_crossed: crossingSection };
};

Editor.prototype.moveFigureUp = function moveFigureUp(figure) {
  const prev = figure.previousElementSibling;
  let toGrid = false;

  if (prev) {
    if (prev.hasClass('item')) {
      figure.insertBefore(prev);
    }
  } else if (figure.hasClass('figure-full-width')) { // eslint-disable-line no-empty

  } else {
    const column = figure.closest('.block-content-inner');
    const prevColumn = column.prev('.block-content-inner');
    if (prevColumn) {
      if (prevColumn.hasClass('block-grid')) {
        this.moveFigureInsideGrid(figure, prevColumn, false);
        toGrid = true;
      } else if (prevColumn.hasClass('center-column')) {
        prevColumn.appendChild(figure);
      } else if (prevColumn.hasClass('full-width-column')) {
        const prevBeforeFW = prevColumn.previousElementSibling;
        if (prevBeforeFW) {
          if (prevBeforeFW.hasClass('center-column')) {
            prevBeforeFW.appendChild(figure);
          } else if (prevBeforeFW.hasClass('full-width-column') || prevBeforeFW.hasClass('block-grid')) {
            const centerColumn = this.pushCenterColumn(prevBeforeFW, false);
            centerColumn.appendChild(figure);
          }
        }
      }
    }
  }

  if (!toGrid) {
    figure.removeClass('figure-in-row can-go-right can-go-down can-go-left');
  }
};

Editor.prototype.moveFigureDown = function moveFigureDown(figure) {
  const next = figure.nextElementSibling; let
    toGrid = false;
  figure.removeClass('figure-in-row');

  if (next) {
    if (next.hasClass('item')) {
      figure.insertAfter(next);
    }
  } else if (figure.hasClass('figure-full-width')) { // eslint-disable-line no-empty
    // full width image.. find next container
  } else { // figure is first item in the column
    const column = figure.closest('.block-content-inner');
    const nextColumn = column?.next('.block-content-inner');
    if (nextColumn) {
      if (nextColumn.hasClass('block-grid')) { // next item is grid, add image to the grid
        this.moveFigureInsideGrid(figure, nextColumn, true);
        toGrid = true;
      } else if (nextColumn.hasClass('center-column')) { // next is text based center clumn.. prepend item there..
        nextColumn.insertBefore(figure, nextColumn.firstChild);
      } else if (nextColumn.hasClass('full-width-column')) { // next is full width image..move image to next column after that..
        const nextAfterFW = nextColumn.nextElementSibling;
        if (nextAfterFW) { // we have something after next column
          if (nextAfterFW.hasClass('center-column')) { // its centered column
            nextAfterFW.insertBefore(figure, nextAfterFW.firstChild);
            // Utils.prependNode(figure, nextAfterFW);
          } else if (nextAfterFW.hasClass('full-width-column') || nextAfterFW.hasClass('block-grid')) { // anotehr full width here..or block grid put a center column inbetween and put figure there
            const centerColumn = this.pushCenterColumn(nextAfterFW, true);
            centerColumn.appendChild(figure);
          }
        }
      }
    }
  }

  if (!toGrid) {
    figure.removeClass('can-go-left can-go-right can-go-down figure-in-row');
  }
};

Editor.prototype.moveFigureInsideGrid = function moveFigureInsideGrid(figure, grid, firstItem) {
  if (firstItem) {
    const row = grid.querySelector('.block-grid-row:first-child');

    figure.addClass('figure-in-row');
    Utils.prependNode(figure, row);

    const figures = row.querySelectorAll('.item-figure');

    this.streamer.notifySubscribers('Katana.Images.Restructure', {
      container: row,
      count: figures.length,
      figures,
    });
  } else {
    const row = grid.querySelector('.block-grid-row:last-child');
    figure.addClass('figure-in-row');
    row.appendChild(figure);

    const figures = row.querySelectorAll('.item-figure');

    this.streamer.notifySubscribers('Katana.Images.Restructure', {
      container: row,
      count: figures.length,
      figures,
    });
  }
};

Editor.prototype.pushCenterColumn = function pushCenterColumn(place, before) {
  const div = Utils.generateElement('<div class="center-column block-content-inner"></div>');
  if (before) {
    place.insertAdjacentElement('beforebegin', div);
  } else {
    place.insertAdjacentElement('afterend', div);
  }
  return div;
};

Editor.prototype.addClassesToElement = function addClassesToElement(element, forceKlass) {
  let n; let name; let
    newEl;
  n = element;

  let fK = typeof forceKlass !== 'undefined' ? forceKlass : false;

  name = n.nodeName.toLowerCase();

  if (name === 'blockquote') {
    n.removeClass('text-center');
  } else {
    n.removeClass('text-center');
    n.removeClass('pullquote');
  }

  let hasEmpty = false;
  if (n.hasClass('item-empty')) {
    hasEmpty = true;
  }
  name = name === 'a' ? 'anchor' : name;

  switch (name) {
    case 'p':
    case 'pre':
      n.removeAttribute('class');
      n.addClass(`item item-${name}`);

      if (fK) {
        n.addClass(forceKlass);
      }

      if (name === 'p' && n.querySelectorAll('br').length === 0) {
        n.appendChild(document.createElement('br'));
      }
      break;
    case 'div':
      if (n.hasClass('block-grid-row')) { // eslint-disable-line no-empty

      } else if (!n.hasClass('item-mixtapeEmbed')) {
        n.removeAttribute('class');
        n.addClass(`item item-${name}`);
      }
      break;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      if (name === 'h1') {
        newEl = Utils.generateElement(`<h2 class='item item-h2'>${n.textContent}</h2>`);
        n.parentNode.replaceChild(newEl, n);

        this.setElementName(n);
      } else {
        n.removeAttribute('class');
        n.addClass(`item item-${name}`);
      }

      if (fK) {
        n.addClass(forceKlass);
      }

      break;
    case 'code':
      n.removeAttribute('class');
      n.unwrap().wrap('<p class=\'item item-pre\'></p>');
      n = n.parentNode;
      break;
    case 'ol':
    case 'ul':
      n.removeAttribute('class');
      n.addClass('postList');

      n.querySelectorAll('li').forEach((li) => {
        li.removeAttribute('class');
        li.addClass('item item-li');
      });

      break;
    case 'img':
      this.image_uploader.uploadExistentImage(n);
      break;
    case 'anchor':
    case 'a':
    case 'strong':
    case 'em':
    case 'br':
    case 'b':
    case 'u':
    case 'i':
      n.removeAttribute('class');
      n.addClass(`markup-${name}`);
      if (!n.closest('.item')) {
        n.wrap('<p class=\'item item-p\'></p>');
      }
      n = n.parentNode;
      break;
    case 'blockquote':
      if (n.hasClass('pullquote')) {
        fK = 'pullquote';
      }
      if (n.hasClass('with-cite')) {
        fK += ' with-cite';
      }
      n.removeAttribute('class');
      n.addClass(`item item-${name}`);
      if (fK) {
        n.addClass(fK);
      }
      break;
      // FIXME figure and caption
    case 'figure':
      // if (n.hasClass("item-figure")) {
      //   n = n;
      // }
      break;
    case 'figcaption':
      // if (n.hasClass('block-grid-caption') || n.hasClass('figure-caption')) {
      //   n = n;
      // }
      break;
    default:
      n.wrap(`<p class='item item-${name}'></p>`);
      n = n.parentNode;
  }

  if (['figure', 'img', 'iframe', 'ul', 'ol'].indexOf(name) === -1) {
    /* const n = n;
    n.html(n.html().replace(/&nbsp;/g, ' ')); */
  }
  if (hasEmpty) {
    n.addClass('item-empty');
  }

  return n;
};

Editor.prototype.addHammer = function addHammer() {
  if (this.isTouch) {
    // $(element).hammer({});
  }
};

Editor.prototype.setupElementsClasses = function setupElementsClasses(element, cb) {
  if (!element) {
    this.element = this.elNode.querySelectorAll('.block-content-inner');
  } else {
    this.element = typeof element.length === 'undefined' ? [element] : element;
  }
  const self = this;
  setTimeout(() => {
    self.cleanContents(self.element);
    self.wrapTextNodes(self.element);

    let ecC = [];
    let allAs = [];
    self.element.forEach((elcc) => {
      const cc = elcc.children ? Array.from(elcc.children) : [];
      ecC = ecC.concat(cc);
      let aas = elcc.querySelectorAll('a');
      if (aas.length) {
        aas = Array.from(aas);
        allAs = allAs.concat(aas);
      }
    });

    ecC.forEach((n) => {
      self.addClassesToElement(n);
      self.setElementName(n);
    });

    self.setupLinks(allAs);
    self.setupFirstAndLast();
    return cb();
  }, 20);
};

Editor.prototype.cleanContents = function cleanContents(element) {
  let elm;
  if (!element) {
    elm = this.elNode.querySelectorAll('.block-content-inner');
  } else {
    elm = typeof element.length === 'undefined' ? [element] : element;
  }
  clean.it(elm);
};

Editor.prototype.wrapTextNodes = function wrapTextNodes(element) {
  if (!element) {
    element = this.elNode.querySelectorAll('.block-content-inner');
  }
  let ecChildren = [];
  element.forEach((elm) => {
    const elmc = elm.children ? Array.from(elm.children) : [];
    ecChildren = ecChildren.concat(elmc);
  });

  const ecw = ecChildren.filter((item) => {
    const ii = item;
    if (ii.nodeType === 3) {
      const ht = ii.innerHTML;
      if (ht.trim().length > 0) {
        return true;
      }
    }
    return false;
  });

  Utils.arrayToNodelist(ecw).wrap("<p class='item item-p'></p>");
};

Editor.prototype.setElementName = function setElementName(element) {
  const el = element;
  if (el.tagName === 'LI') {
    return el.attr('name', Utils.generateId());
  }
  if (!el.matches('[name]')) {
    if (el.tagName === 'UL') {
      const elChilds = Array.prototype.filter.call(el.children, (e) => e.tagName === 'LI');

      const lis = elChilds; // el.querySelectorAll(' > li');
      lis.forEach((item) => {
        const li = item;
        if (!li.matches('[name]')) {
          li.attr('name', Utils.generateId());
        }
      });
    }
    return el.attr('name', Utils.generateId());
  }
};

Editor.prototype.handleSmartList = function handleSmartList(item, e) {
  let li; let match; let
    regex;

  const chars = this.getCharacterPrecedingCaret();
  match = chars.match(/^\s*(\-|\*)\s*$/); // eslint-disable-line no-useless-escape
  if (match) {
    e.preventDefault();
    regex = new RegExp(/\s*(\-|\*)\s*/); // eslint-disable-line no-useless-escape
    li = this.listify(item, 'ul', regex, match);
  } else {
    match = chars.match(/^\s*[1aAiI](\.|\))\s*$/);
    if (match) {
      e.preventDefault();
      regex = new RegExp(/\s*[1aAiI](\.|\))\s*/);
      li = this.listify(item, 'ol', regex, match);
    }
  }
  return li;
};

Editor.prototype.handleListLineBreak = function handleListLineBreak(li, e) {
  let content;
  this.hideContentBar();
  const list = li.parentNode;

  const paragraph = document.createElement('p');

  if (list.children && list.children.length === 1 && li.textContent.trim() === '') {
    this.replaceWith('p', list);
  } else if (li.textContent.trim() === '' && (li.nextElementSibling !== null)) {
    e.preventDefault();
  } else if (li.nextElementSibling !== null) {
    if (li.textContent.isEmpty()) {
      e.preventDefault();
      paragraph.parentNode.insertBefore(list, paragraph.nextElementSibling);

      // list.after(paragraph);
      li.addClass('item-removed');
      li.parentNode.removeChild(li);
    } else if (li.previousElementSibling !== null && li.previousElementSibling.textContent.trim() === '' && this.getCharacterPrecedingCaret() === '') {
      e.preventDefault();

      content = li.innerHTML;
      paragraph.parentNode.insertBefore(list, paragraph.nextElementSibling);
      // list.after(paragraph);
      if (li.previousElementSibling) {
        li.previousElementSibling.parentNode.removeChild(li.previousElementSibling);
      }
      li.addClass('item-removed');
      li.parentNode.removeChild(li);
      paragraph.innerHTML = content;
    }
  }

  if (list && list.children.length === 0) {
    list.parentNode.removeChild(list);
  }

  if (li.hasClass('item-removed')) {
    this.addClassesToElement(paragraph);
    this.setRangeAt(paragraph);
    this.markAsSelected(paragraph);
    return this.scrollTo(paragraph);
  }
};

Editor.prototype.listify = function listify(paragraph, listType, regex, match) {
  let list;
  this.removeSpanTag(paragraph);

  const content = paragraph.innerHTML.replace(/&nbsp;/g, ' ').replace(regex, '');
  const type = match[0].charAt(0);
  switch (listType) {
    case 'ul':
      list = document.createElement('ul');
      break;
    case 'ol':
      list = document.createElement('ol');
      break;
    default:
      return false;
  }

  this.addClassesToElement(list);
  this.replaceWith('li', paragraph);

  if (type !== 1) {
    list.addClass(`postList--${type}`);
    list.attr('type', type);
  }

  const li = document.querySelector('.item-selected');
  if (li) {
    this.setElementName(li);
    li.innerHTML = content;
    if (li.children && li.children.length > 0) {
      li.children.wrap(list);
    } else {
      li.wrap(list);
    }
    if (li.querySelectorAll('br').length === 0) {
      li.appendChild(document.createElement('br'));
    }
    this.setRangeAt(li);
  }
  return li;
};

Editor.prototype.handleListBackspace = function handleListBackspace(li, e) {
  let paragraph; let content;
  const list = li.parentNode;
  const liPr = li.parentNode.tagName.toLowerCase();
  if (liPr !== 'ul' && liPr !== 'ol') {
    return;
  }
  if (li.previousElementSibling) {
    e.preventDefault();
    list.insertBefore(li);
    content = li.innerHTML;
    this.replaceWith('p', li);
    paragraph = document.querySelector('.item-selected');
    if (paragraph) {
      paragraph.removeClass('item-empty');
      paragraph.innerHTML = content;
    }
    if (list.children && list.children.length === 0) {
      list.parentNode.removeChild(list);
    }
    return this.setupFirstAndLast();
  }
};

Editor.prototype.removeSpanTag = function removeSpanTag(item) {
  item.querySelectorAll('span').forEach((sp) => {
    if (!sp.hasClass('placeholder-text')) {
      if (sp.children) {
        const content = Array.from(sp.children);
        content.forEach((cn) => {
          sp.parentNode.insertBefore(cn, sp);
        });
        sp.parentNode.removeChild(sp);
      }
    }
  });
  return item;
};

Editor.prototype.handleInmediateDeletion = function handleInmediateDeletion(element) {
  this.inmediateDeletion = false;
  const newNode = Utils.generateElement(this.templates.baseParagraphTmpl()).insertBefore(element);
  newNode.addClass('item-selected');
  this.setRangeAt(element.previousElementSibling);
  return element.parentNode.removeChild(element);
};

Editor.prototype.handleUnwrappedNode = function handleUnwrappedNode(element) {
  const tmpl = Utils.generateElement(this.templates.baseParagraphTmpl());
  this.setElementName(tmpl);
  element.wrap(tmpl);
  const newNode = document.querySelector(`[name='${tmpl.attr('name')}']`);
  newNode.addClass('item-selected');
  this.setRangeAt(newNode);
  return false;
};

/*
This is a rare hack only for FF (I hope),
when there is no range it creates a new element as a placeholder,
then finds previous element from that placeholder,
then it focus the prev and removes the placeholder.
a nasty nasty one...
  */

Editor.prototype.handleNullAnchor = function handleNullAnchor() {
  let node; let num; let prev; let range; let
    span;
  const sel = this.selection();

  if (sel.isCollapsed && sel.rangeCount > 0) {
    if (sel.anchorNode.hasClass('block-background')) {
      return;
    }
    range = sel.getRangeAt(0);
    span = Utils.generateElement(this.templates.baseParagraphTmpl());
    range.insertNode(span);
    range.setStart(span, 0);
    range.setEnd(span, 0);
    sel.removeAllRanges();
    sel.addRange(range);

    node = range.commonAncestorContainer;
    prev = node.previousElementSibling;
    num = prev.children;

    if (prev && prev.hasClass('item')) {
      this.setRangeAt(prev, num);
      node.parentNode.removeChild(node);
      this.markAsSelected(this.getNode());
    } else if (prev && prev.hasClass('item-mixtapeEmbed')) {
      this.setRangeAt(prev, num);
      node.parentNode.removeChild();
      this.markAsSelected(this.getNode());
    } else if (!prev) {
      this.setRangeAt(this.elNode.querySelector('.block-content-inner p'));
    }
    return this.displayTooltipAt(this.elNode.querySelector('.item-selected'));
  }
};

Editor.prototype.handleCompleteDeletion = function handleCompleteDeletion(element) {
  if (element.textContent.isEmpty()) {
    this.selection().removeAllRanges();
    this.render();
    const self = this;
    setTimeout(() => {
      self.setRangeAt(self.elNode.querySelector('.block-content-inner p'));
    }, 20);
    this.completeDeletion = true;
  }
};

// Anchor tooltip //
Editor.prototype.displayPopOver = function displayPopOver(ev, matched) {
  return this.tooltip.displayAt(ev, matched);
};

Editor.prototype.hidePopOver = function hidePopOver(ev, matched) {
  return this.tooltip.hide(ev, matched);
};
// Anchor tooltip ends //

// Image toolbar related  //
Editor.prototype.displayImageToolbar = function displayImageToolbar() {
  if (!this.image_toolbar) {
    return;
  }

  setTimeout(() => {
    const pos = Utils.getImageSelectionDimension();
    this.image_toolbar.render();
    this.image_toolbar.show();
    this.relocateImageToolbar(pos);
  }, 16);
};

Editor.prototype.relocateImageToolbar = function relocateImageToolbar(position) {
  if (!position) {
    return;
  }
  let top;
  const ebr = this.image_toolbar.elNode.getBoundingClientRect();

  const { height } = ebr;
  const padd = ebr.width / 2;
  top = position.top - height + document.body.scrollTop;
  const left = position.left + (position.width / 2) - padd;
  const scrollTop = window.pageYOffset;

  if (scrollTop > top) {
    top = scrollTop;
  }
  const cst = this.image_toolbar.elNode.style;
  cst.left = left;
  cst.top = top;
  cst.position = 'absolute';
};

Editor.prototype.selectFigure = function selectFigure(figure) {
  if (!figure) {
    return;
  }

  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }

  this.elNode.querySelectorAll('.figure-focused').forEach((el) => el.removeClass('figure-focused'));

  if (figure.hasClass('with-background')) {
    figure.addClass('figure-focused');
    this.displayImageToolbar();
    const item = figure.querySelector('.item');
    if (item) {
      Utils.setCaretAtPosition(item, 0);
      item.focus();
      return;
    }
  } else {
    this.markAsSelected(figure.querySelector('.padding-cont'));
    figure.addClass('figure-focused item-selected');
    // const bg = figure.closest(".block-grid")?.addClass('figure-focused');
    this.selection().removeAllRanges();
    this.displayImageToolbar();
  }

  if (figure.hasClass('figure-in-row')) {
    figure.closest('.block-content-inner')?.addClass('figure-focused grid-focused');
  }

  figure.focus();
};

Editor.prototype.handleGrafFigureSelectImg = function handleGrafFigureSelectImg(ev, matched) {
  const text = this.getSelectedText();
  if (text && text.killWhiteSpace().length > 0) {
    return false;
  }

  const element = matched || ev.currentTarget;
  const sec = element.closest('.with-background');
  if (sec) {
    this.selectFigure(sec);
  } else {
    this.selectFigure(element.closest('.item-figure'));
  }

  if (this.mode === 'write' || this.mode === 'read') {
    // ev.preventDefault();
    return false;
  }
};

Editor.prototype.handleGrafFigureTypeCaption = function handleGrafFigureTypeCaption(ev) {
  const element = ev.currentTarget;
  const text = element.textContent;
  const figure = element.closest('figure');

  if (figure) {
    if (!text || text.isEmpty()) {
      figure.addClass('item-text-default');
    } else {
      figure.removeClass('item-text-default');
    }
  }
};

Editor.prototype.handleFigureAnchorClick = function handleFigureAnchorClick(ev) {
  ev.preventDefault();
  return false;
};

Editor.prototype.handleKeyDownOnFigure = function handleKeyDownOnFigure(ev, figure) {
  const { keyCode } = ev;
  if (!this.image_toolbar) {
    return;
  }
  switch (keyCode) {
    case LEFTARROW:
      this.image_toolbar.commandPositionSwitch('left', figure);
      ev.preventDefault();
      return false;
    case RIGHTARROW:
      this.image_toolbar.commandPositionSwitch('right', figure);
      ev.preventDefault();
      return false;
    case UPARROW:
      ev.preventDefault();
      this.image_toolbar.commandPositionSwitch('up', figure);
      return false;
    case DOWNARROW:
      ev.preventDefault();
      this.image_toolbar.commandPositionSwitch('down', figure);
      return false;
    case ENTER:
      break;
  }
};

Editor.prototype.handleImageActionClick = function handleImageActionClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  const action = tg.attr('data-action');
  const figure = tg.closest('figure');
  const row = figure.closest('.block-grid-row');

  Utils.stopEvent(ev);

  switch (action) {
    case 'remove':
      if (this.image_toolbar) {
        ev.preventDefault();
        this.image_toolbar.removeFigure(figure);
        return false;
      }
      break;
    case 'goleft':
      if (this.image_toolbar) {
        ev.preventDefault();
        this.image_toolbar.commandPositionSwitch('left', figure);
        return false;
      }
      break;
    case 'goright':
      if (this.image_toolbar) {
        ev.preventDefault();
        this.image_toolbar.commandPositionSwitch('right', figure);
        return false;
      }
      break;
    case 'godown':
      if (this.image_toolbar) {
        ev.preventDefault();
        this.image_toolbar.commandPositionSwitch('down', figure);
        return false;
      }
      break;
    case 'goup':
      if (this.image_toolbar) {
        ev.preventDefault();
        this.image_toolbar.commandPositionSwitch('up', figure);
        return false;
      }
      break;
    case 'addpic':
      if (row) {
        this.streamer.notifySubscribers('Katana.Images.Add', { row });
      } else {
        this.streamer.notifySubscribers('Katana.Images.Add', { figure });
      }
      break;
    case 'stretch':
      if (this.image_toolbar) {
        this.image_toolbar.commandPositionSwitch('stretch', figure);
        return false;
      }
      break;
  }
};

Editor.prototype.embedIFrameForPlayback = function embedIFrameForPlayback(ev) {
  const elem = ev.target;
  const frameContainer = elem.closest('.iframeContainer');
  const image = frameContainer?.querySelector('[data-frame-url]');
  if (image) {
    const frameUrl = `${image.attr('data-frame-url')}&autoplay=1`;
    const iframe = Utils.generateElement(`<iframe src="${frameUrl}"></iframe>`);
    image.parentNode.replaceChild(iframe, image);
    frameContainer.addClass('hide-controls');
  }
};

// Image toolbar related ends //

/**
* after image/embeds layout manipulation, we may end up with lots of linear same layouts
* function merges them together
*/
Editor.prototype.mergeInnerSections = function mergeInnerSections(section) {
  const self = this;
  const merge = function merge() {
    const inners = section.querySelectorAll('.block-content-inner');
    if (inners.length) {
      for (let i = 0; i < inners.length; i += 1) {
        const curr = inners[i];
        const k = i + 1;
        const next = typeof inners[k] !== 'undefined' ? inners[k] : false;
        if (next) {
          if (next.querySelectorAll('.item').length === 0) {
            next.parentNode.removeChild(next);
            return merge();
          }
          if (!curr.hasClass('block-grid') && Utils.elementsHaveSameClasses(curr, next)) {
            next.querySelectorAll('.item').forEach((elm) => {
              curr.appendChild(elm);
            });
            self.setupFirstAndLast();
            next.parentNode.removeChild(next);
            return merge();
          }
        }
      }
    }
  };
  merge(0);
};

Editor.prototype.cleanUpInnerSections = function cleanUpInnerSections() {
  const inners = this.elNode.querySelectorAll('.block-content-inner');
  for (let i = 0; i < inners.length; i += 1) {
    const curr = inners[i];
    if (curr.querySelectorAll('.item').length === 0) {
      curr.parentNode.removeChild(curr);
    }
  }

  const blockGrid = this.elNode.querySelectorAll('.block-grid');
  for (let i = 0; i < blockGrid.length; i += 1) {
    const curr = blockGrid[i];
    if (curr.querySelectorAll('.item-figure').length === 0) {
      curr.parentNode.removeChild(curr);
    }
  }

  const blockRows = this.elNode.querySelectorAll('.block-grid-row');
  for (let i = 0; i < blockRows.length; i += 1) {
    const curr = blockRows[i];
    if (curr.querySelectorAll('.item-figure').length === 0) {
      curr.parentNode.removeChild(curr);
    }
  }
};

Editor.prototype.fixSectionClasses = function fixSectionClasses() {
  this.elNode.querySelectorAll('section').forEach((el) => {
    el.removeClass('block-first');
    el.removeClass('block-last');
  });
  const fc = this.elNode.querySelector('section:first-child');
  if (fc) {
    fc.addClass('block-first');
  }
  const lc = this.elNode.querySelector('section:last-child');
  if (lc) {
    lc.addClass('block-last');
  }
};

Editor.prototype.refreshStoriesMenus = function refreshStoriesMenus(val) {
  if (val === '') {
    return;
  }
  let toAdd = null;
  if (val === 'featured') {
    const menu = this.templates.menuOpts[0];
    toAdd = document.createElement('option');
    toAdd.value = menu[0];
    toAdd.text = menu[1];
  } else if (val === 'latest') {
    const menu = this.templates.menuOpts[1];
    toAdd = document.createElement('option');
    toAdd.value = menu[0];
    toAdd.text = menu[1];
  }

  const stfors = this.elNode.querySelectorAll('.block-stories [data-for="storytype"]');
  if (stfors.length) {
    for (let i = 0; i < stfors.length; i += 1) {
      const stf = stfors[i];
      if (toAdd) {
        stf.appendChild(toAdd);
      }
    }
  }
};

Editor.prototype.removeUnnecessarySections = function removeUnnecessarySections() {
  const sects = this.elNode.querySelectorAll('section');
  for (let i = 0; i < sects.length; i += 1) {
    const sec = sects[i];
    if (sec.querySelectorAll('.item').length === 0) {
      sec.parentNode.removeChild(sec);
    }
  }
  this.parallaxCandidateChanged();
};

Editor.prototype.mergeWithUpperSection = function mergeWithUpperSection(curr) {
  const upper = curr.prev('.block-content');
  if (upper) {
    const mb = upper.querySelector('.main-body');
    if (mb) {
      const cmb = curr.querySelector('.main-body > .block-content-inner');
      mb.appendChild(cmb);
    }
    curr.parentNode.removeChild(curr);
    this.mergeInnerSections(upper);
    const newLast = upper.querySelector('.item:last-child');
    if (newLast) {
      this.markAsSelected(newLast);
    }
  }
  this.parallaxCandidateChanged();
};

Editor.prototype.splitContainer = function splitContainer(atNode, insrtSection, carryContent) {
  const currContainer = atNode.closest('.block-content');
  const currInner = atNode.closest('.block-content-inner');
  let insertAfterContainer;
  let newContainer;
  const carry = carryContent ? true : carryContent;
  const insertSection = typeof insrtSection === 'undefined' || !insrtSection ? Utils.generateElement(this.templates.getSingleSectionTemplate()) : insrtSection;
  let carryContainer = false;

  if (!carry) {
    newContainer = insertSection;
    newContainer.insertAfter(currContainer);
    carryContainer = Utils.generateElement(this.templates.getSingleSectionTemplate());
    carryContainer.insertAfter(newContainer);
    newContainer = carryContainer;
    insertAfterContainer = carryContainer;
  } else {
    newContainer = insertSection;
    insertAfterContainer = currContainer;
  }

  const newInner = newContainer.querySelector('.main-body');

  if (currInner) {
    while (currInner.nextElementSibling) {
      newInner.appendChild(currInner.nextElementSibling);
    }
  }

  const splittedLayout = Utils.generateElement(this.templates.getSingleLayoutTemplate());
  splittedLayout.attr('class', currInner.attr('class'));

  while (atNode.nextElementSibling) {
    splittedLayout.appendChild(atNode.nextElementSibling);
  }

  splittedLayout.insertBefore(atNode, splittedLayout.firstChild);
  newInner.insertBefore(splittedLayout, newInner.firstChild);

  newContainer.insertAfter(insertAfterContainer);

  this.removeUnnecessarySections();
  this.fixSectionClasses();
};

Editor.prototype.appendTextSection = function appendTextSection() {
  const sec = Utils.generateElement(this.templates.getSingleSectionTemplate());
  const mb = sec.querySelector('.main-body');
  if (mb) {
    const mbs = this.templates.singleColumnPara('item-empty');
    mb.appendChild(Utils.generateElement(mbs));
  }
  this.elNode.appendChild(sec);
};

Editor.prototype.parallaxImages = [];

// canvas scrolling related stuff
Editor.prototype.parallaxCandidateChanged = function parallaxCandidateChanged() {
  const sects = this.elNode.querySelectorAll('.image-in-background');
  const parallaxRect = this.parallax.getBoundingClientRect();

  if (this.parallaxContext && sects.length) {
    sects.forEach((se) => {
      se.addClass('talking-to-canvas').removeClass('talk-to-canvas');
    });
  }

  this.parallaxImages = [];
  this.sectionsForParallax = sects;

  for (let i = 0; i < sects.length; i += 1) {
    const item = sects[i];
    const bg = item.querySelector('.block-background-image');
    if (bg) {
      // const styles = getComputedStyle(bg);
      let path = Utils.getStyle(bg, 'backgroundImage'); // styles.getPropertyValue('background-image');
      path = /^url\((['"]?)(.*)\1\)$/.exec(path);
      path = path ? path[2] : '';
      if (path && path.trim().length !== 0) {
        const img = new Image();
        img.src = path;
        this.parallaxImages.push(img);
      }
    }
  }

  const scrolling = () => {
    this.checkViewPortForCanvas();
  };

  if (sects && sects.length) {
    Utils.unregisterFromScroll('katana', scrolling);
    Utils.registerForScroll('katana', scrolling);
    this.checkViewPortForCanvas();
  } else if (!sects.length) {
    this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
    Utils.unregisterFromScroll('katana', scrolling);
  }
};

Editor.prototype.calculatePosition = function calculatePosition(img, sect) {
  const iratio = img.naturalWidth / img.naturalHeight;
  const sectionRect = sect.getBoundingClientRect();
  const sectionWidth = sectionRect.width;
  const sectionHeight = sectionRect.height;
  const sectionBottom = sectionRect.bottom;
  const parallaxRect = this.parallax.getBoundingClientRect();
  const canvasHeight = parallaxRect.height;
  const scaledImageWidth = sectionWidth;
  const scaledImageHeight = scaledImageWidth / iratio;

  const padding = 50;

  let iY; let iHeight; let cY; let
    cHeight;

  if (sectionHeight > (scaledImageHeight - padding)) {
    const delta = sectionHeight - canvasHeight;
    const buffer = scaledImageHeight - canvasHeight;
    const factor = buffer / delta;

    if (sectionRect.top >= 0) {
      iY = 0;
      cY = sectionRect.top;
      cHeight = canvasHeight;
    } else if (sectionBottom < canvasHeight) {
      iY = canvasHeight - sectionBottom;
      cHeight = sectionBottom;
      cY = 0;
    } else {
      iY = -1 * sectionRect.top * factor;
      cY = 0;
      cHeight = sectionRect.height + sectionRect.top;
    }

    iHeight = (img.naturalWidth * cHeight) / sectionWidth;
  } else {
    if (sectionRect.top >= 0) {
      iY = 0;
      cY = sectionRect.top;
      cHeight = sectionRect.height - sectionRect.top;
    } else {
      iY = -1 * sectionRect.top;
      cY = 0;
      cHeight = sectionRect.height + sectionRect.top;
    }
    iHeight = (img.naturalWidth * cHeight) / sectionWidth;
  }

  const iX = 0;
  const cX = 0;

  return {
    ix: iX,
    iy: iY,
    iw: img.naturalWidth,
    ih: iHeight,
    cx: cX,
    cy: cY,
    cw: sectionWidth,
    ch: cHeight,
  };
};

Editor.prototype.checkViewPortForCanvas = function checkViewPortForCanvas() {
  let i = 0;
  let sect;
  const sections = this.sectionsForParallax;
  let isVisible = false;
  const draf = [];
  const videos = [];

  for (; i < sections.length; i += 1) {
    sect = sections[i];
    isVisible = sect.isElementVerticallyInViewPort();

    if (isVisible) {
      if (this.mode === 'read' && sect.hasClass('video-in-background')) {
        videos.push(sect);
      } else {
        const img = this.parallaxImages[i];
        const pos = this.calculatePosition(img, sect);
        draf.push([img, pos]);
      }
    }
  }

  const parallaxRect = this.parallax.getBoundingClientRect();

  if (draf.length > 0) {
    this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
    this.addImageToCanvas(draf);
  } else {
    this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
  }

  if (this.mode === 'read') {
    if (videos.length) {
      Player.cameInView(videos);
    } else {
      Player.notInView();
    }
  }
};

Editor.prototype.addImageToCanvas = function addImageToCanvas(draf) {
  for (let i = 0; i < draf.length; i += 1) {
    const image = draf[i][0];
    const pos = draf[i][1];
    this.parallaxContext.drawImage(
      image,
      pos.ix, pos.iy,
      pos.iw, pos.ih,
      pos.cx, pos.cy,
      pos.cw, pos.ch,
    );
  }
};

/** notes related * */
Editor.prototype.showNoteIcon = function showNoteIcon(ev, matched) {
  if (this.notesManager) {
    this.notesManager.showNote(ev, matched);
  }
};
/** notes related ends * */

/** mobile touch handling * */
Editor.prototype.pressWatch = null;
Editor.prototype.pressHappened = false;

Editor.prototype.handleTap = function handleTap() {
  if (this.pressHappened) {
    setTimeout(() => {
      const txt = this.getSelectedText();
      if (txt === '' && this.pressWatch) {
        clearInterval(this.pressWatch);
        this.pressHappened = false;
      }
    }, 100); // force wait
  }
};

Editor.prototype.handlePress = function handlePress() {
  let prev;
  const self = this;

  this.pressWatch = setInterval(() => {
    const txt = self.getSelectedText();
    if (prev && txt !== prev && txt !== '') {
      Utils.animationFrame.call(window, () => {
        self.handleMouseUp(false);
      });
    } else if (!prev && txt !== '') {
      Utils.animationFrame.call(window, () => {
        self.handleMouseUp(false);
      });
    }
    prev = txt;
  }, 250);
};

/** mobile touch handling ends * */

/** section stories event handling * */
Editor.prototype.handleSectionToolbarItemClicked = function handleSectionToolbarItemClicked(ev) {
  const tg = ev.currentTarget;
  const action = tg.attr('data-action');

  if (this.section_options) {
    this.section_options.command(action, tg);
    this.activateBlock(tg);
  }
};

Editor.prototype.handleSectionToolbarItemKeyUp = function handleSectionToolbarItemKeyUp(ev) {
  const { which } = ev;
  const stopFor = [BACKSPACE, DELETE, LEFTARROW, RIGHTARROW];

  if (stopFor.indexOf(which) !== -1) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }
};

Editor.prototype.handleSectionToolbarItemKeyDown = function handleSectionToolbarItemKeyDown(ev) {
  const { which } = ev;
  const stopFor = [BACKSPACE, DELETE, LEFTARROW, RIGHTARROW];

  if (stopFor.indexOf(which) !== -1) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }
};

Editor.prototype.handleSectionToolbarItemKeyPress = function handleSectionToolbarItemKeyPress() {

};

Editor.prototype.handleSectionToolbarItemMouseUp = function handleSectionToolbarItemMouseUp(ev) {
  Utils.simpleStop(ev);
};

Editor.prototype.handleSectionToolbarItemMouseDown = function handleSectionToolbarItemMouseDown(ev) {
  Utils.simpleStop(ev);
};

Editor.prototype.handleSectionToolbarItemDblclick = function handleSectionToolbarItemDblclick(ev) {
  Utils.simpleStop(ev);
};

Editor.prototype.handleSelectionStoryTypeChange = function handleSelectionStoryTypeChange(ev) {
  const ctg = ev.currentTarget;
  const cont = ctg.closest('.main-controls');
  const input = cont?.querySelector('[data-for="tagname"]');
  const autoCont = input?.closest('.autocomplete-buttons');
  if (ctg.value === 'tagged') {
    autoCont.show();
    input.focus();
  } else {
    autoCont.hide();
  }
};

Editor.prototype.handleSelectionStoryCountChange = function handleSelectionStoryCountChange(ev) {
  const ctg = ev.currentTarget;
  const section = ctg.closest('.block-stories');
  const val = parseInt(ctg.value);
  if (!Number.isNaN(val) && section) {
    section.attr('data-story-count', val);
    const bd = section.querySelector('.main-body');
    this.fillStoryPreview(bd, val);
  }
};

const KatanaEditor = function KatanaEditor(opts) {
  const { selector } = opts;
  const node = document.querySelector(selector);
  if (node) {
    return new Editor({ ...opts, node });
  }
  return null;
};

export default KatanaEditor;
