import Utils from './utils';
import Stream from './stream';
import Poly from './polyfills';
import boot from './boot';
import Tooltip from './tooltip';
import Player from './player';
import Templates from './templates';

import {TextToolbar, ImageToolbar} from './toolbars/index';
import { ContentBar, ImageContentBarItem, VideoContentBarItem, SectionContentBarItem, EmbedContentBarItem } from './content/index';
import ModelFactory from './models/factory';
import Notes from './notes/core';
import clean from './cleaner';

const BACKSPACE = 8,
    ESCAPE = 27,
    TAB = 9,
    ENTER = 13,
    SPACEBAR = 32,
    LEFTARROW = 37,
    UPARROW = 38,
    RIGHTARROW = 39,
    DOWNARROW = 40,
    DELETE = 46,
    END_KEY = 35,

    SINGLE_QUOTE_WHICH = 39,
    DOUBLE_QUOTE_WHICH = 34,
    DASH_WHICH = 45,

    QUOTE_LEFT_UNICODE = '\u2018',
    QUOTE_RIGHT_UNICODE = '\u2019',

    DOUBLEQUOTE_LEFT_UNICODE = '\u201c',
    DOUBLEQUOTE_RIGHT_UNICODE = '\u201d',

    DASH_UNICODE = '\u2014',

    UNICODE_SPECIAL_CHARS = [QUOTE_LEFT_UNICODE, QUOTE_RIGHT_UNICODE, DOUBLEQUOTE_LEFT_UNICODE, DOUBLEQUOTE_RIGHT_UNICODE, DASH_UNICODE],

    // number 1, number 2, number 3, Char C(center), char q(quote),
    NUMBER_HONE = 49,
    NUMBER_HTWO = 50,
    NUMBER_HTHREE = 51,
    NUMBER_QUOTE = 52,
    NUMBER_CODE_BLOCK = 53,

    CHAR_CENTER = 69, // E with Ctrl
    CHAR_LINK = 75, // k for link

    SHORT_CUT_KEYS = [NUMBER_HONE, NUMBER_HTWO, NUMBER_HTHREE, NUMBER_QUOTE, NUMBER_CODE_BLOCK, CHAR_CENTER, CHAR_LINK];

function Editor(opts) {
  opts.node.wrap('<div class="editor-wrapper"></div>');

  this.opts = opts;
  // entry points
  this.init = this.init.bind(this); // activate
  this.destroy = this.destroy.bind(this); // deactivate

  //templates
  this.templates = Templates;
  
  //streamer
  this.streamer = Stream;
  this.subscribe = this.subscribe.bind(this); // for subscription to events

  // ui related
  this.render = this.render.bind(this);
  
  //base methods
  this.initialize = this.initialize.bind(this);
  this.initContentOptions = this.initContentOptions.bind(this);
  this.initTextToolbar = this.initTextToolbar.bind(this);
  this.insertFancyChar = this.insertFancyChar.bind(this);
  this.markAsSelected = this.markAsSelected.bind(this);
  this.selectFigure = this.selectFigure.bind(this);

  // canvas related
  this.parallaxCandidateChanged = this.parallaxCandidateChanged.bind(this);

  //event listeners
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

  //image event listeners
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
  this.smallScreen = Utils.getWindowWidth() <= 480 ? true : false;

  this.segregateEvents();

  this.isTouch = 'ontouchstart' in window || 'msmaxtouchpoints' in window.navigator;
  this.isIOS = Utils.onIOS();

  boot.it(this, opts);

};


Editor.prototype.segregateEvents = function () {
  const mode = this.opts.mode || 'read';
  const publication = this.opts.editorType == 'publication' ? true : false;
  
  if (mode == 'read' || mode == 'edit') {
    this.events = {
      'mouseup': 'handleMouseUp',
      'mousedown' : 'handleMouseDown',
      'dblclick': 'handleDblclick',
      "mouseover .markup-anchor": "displayPopOver",
      "mouseout  .markup-anchor": "hidePopOver",
      "click .item-controls i": "embedIFrameForPlayback",
      "keydown .item-controls i": "playButtonPressedViaKeyboard"
    };

    if (this.smallScreen) {
      this.events["click .item"] = "showNoteIcon";
    } else {
      if (!publication) {
        this.events["mouseover .item"] = "showNoteIcon";  
      }
    }

  } else if (mode == 'write'){
    this.events = {
      "paste": "handlePaste",
      'mouseup': 'handleMouseUp',
      'mousedown' : 'handleMouseDown',
      'keydown': 'handleKeyDown',
      'keyup': 'handleKeyUp',
      'keypress': 'handleKeyPress',
      'dblclick': 'handleDblclick',
      
      // 'copy':'handleCopyEvent',
      
      "click .item-controls-cont .action": "handleImageActionClick",
      "click .markup-figure-anchor": "handleFigureAnchorClick",

      "click .item-figure .padding-cont": "handleGrafFigureSelectImg",
      "click .with-background .table-view": "handleGrafFigureSelectImg",
      "keyup .item-figure .caption": "handleGrafFigureTypeCaption",

      'dragover': 'handleDrag',
      'drop' : 'handleDrop',
      'dragenter': 'handleDragEnter',
      'dragexit': 'handleDragExit',

      "mouseover .markup-anchor": "displayPopOver",
      "mouseout  .markup-anchor": "hidePopOver",

      "press .item":"handlePress",
      "tap .item": "handleTap"
    };

    if (publication) {
      const o = {
        'click .main-controls [data-action]' : 'handleSectionToolbarItemClicked',
        'dblclick .main-controls' : 'handleSectionToolbarItemDblclick',
        'mouseup .main-controls' : 'handleSectionToolbarItemMouseUp',
        'mousedown .main-controls' : 'handleSectionToolbarItemMouseDown',
        'keyup .main-controls' : 'handleSectionToolbarItemKeyUp',
        'keydown .main-controls' : 'handleSectionToolbarItemKeyDown',
        'keypress .main-controls' : 'handleSectionToolbarItemKeyPress',
        'change [data-for="storytype"]' : 'handleSelectionStoryTypeChange',
        'change [data-for="storycount"]' : 'handleSelectionStoryCountChange'  
      };

      for(const [key, val] of Object.entries(o)) {
        this.events[key] = val;
      }

    }
  } else {
    this.events = {};
  }
};

Editor.prototype.subscribe = function(name, cb) {
  this.streamer.subscribe(name, cb);
}

Editor.prototype.__selectionChangeFired = false;

Editor.prototype.handleSelectionChange = function(ev) {
  const sel = document.getSelection();
  if (sel.type == 'Range') {
    ev.preventDefault();
    if (!this.__selectionChangeFired) {
      setTimeout(() => {
        this.handleMouseUp(ev);
        this.__selectionChangeFired = false;
      }, 200);
      this.__selectionChangeFired = true;
    }
  }
};

Editor.prototype.initialize = function () {
  const opts = this.opts;
  // debug mode
  window.debugMode = opts.debug || false;
  if (window.debugMode) {
    this.elNode.addClass("debug");
  }

  this.mode = opts.mode || 'read'; // can be write/ edit/ read
  this.editorType = opts.editorType || 'blog';
  this.publicationMode = opts.editorType == 'publication' ? true : false;

  this.base_content_options = opts.base_content_options || ['image', 'video', 'section'];
  this.content_options = [];

  this.current_node = null;
  this.prev_current_node = null;
  this.current_range = null;

  this.image_options = opts.image ? opts.image : { upload: true };
  this.embed_options = opts.embed ? opts.embed : { enabled: false };
  this.json_quack = opts.json_quack;

  this.storySectionFilterCallback = this.storySectionFilterCallback.bind(this);
  this.templates.init({...opts.placeholders, storySectionFilter: this.storySectionFilterCallback});

  this.sectionsForParallax = [];
  this.parallax = null;
  this.parallaxContext = null;

  this.currentRequestCount = 0;
  this.commentable = opts.commentable || false;

  this.notes_options = opts.notes || {};

  //this.paste_element = document.createElement('div');
  //this.elNode.closest('.editor-wrapper').appendChild(this.paste_element);

  return this;
};

Editor.prototype.destroy = function() {};

Editor.prototype.init = function(cb) {
  this.render(cb);
  if (this.mode == 'write') {
    this.elNode.attr('contenteditable', true);
    this.elNode.addClass('editable');
    
  } else {
    this.elNode.removeAttribute("contenteditable");
    const ces = this.elNode.querySelectorAll('[contenteditable]');
    ces.forEach((cel) => {
      cel.removeAttribute('contenteditable');
    });
    const mfps = this.elNode.querySelectorAll('.mfi-play');
    mfps.forEach( (mf) => {
      mf.attr('tabindex', '0');
    });
  }
  
  this.appendToolbars();
  this.appendParallax();

  if (this.mode == 'write') {
    const enabled = this.opts && typeof this.opts.enableDraft !== 'undefined' ? this.opts.enableDraft : true;
    if(enabled) {
      this.committer = new ModelFactory({editor: this, mode: 'write'});
      this.committer.manage(true);
    }
  }

  if (this.notes_options.commentable) {
    const winWidth = Utils.getWindowWidth();
    let layout = winWidth <= 480 ? 'popup' : 'side';
    this.notesManager = new Notes({editor: this, notes: [], info : this.notes_options, layout: layout, node: document.querySelector('#notes_container')});
    this.notesManager.init();
  }

  if (this.mode == 'write') {
    this.removeUnwantedSpans();
    setTimeout( () => {
      this.addFigureControls();
    }, 100);
  }

  if (this.mode == 'read') {
    Player.manage(this.opts.video);
  }

  if (this.mode == 'write') {
    //setTimeout( () => {
      //this.mutationHandler = new MutationOb
    //}, 300);
  }

  setTimeout( () => {
    this.addBlanktoTargets();
  }, 100);

  this.addEmptyClass();

  if ( this.isIOS ) {
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }
};

Editor.prototype.addBlanktoTargets = function() {
  this.elNode.querySelectorAll('a').forEach( (item) => {
    if(!item.hasAttribute('target')) {
      item.attr('target', '_blank');
    }
  });
};

Editor.prototype.addEmptyClass = function() {};

Editor.prototype.setInitialFocus = function () {
  const items = this.elNode.querySelectorAll('.item');
  if (items.length >= 2) {
    const first = items[0],
        sec = items[1];

    let toFocus = false,
        toolTip = false;
    if ( first.querySelectorAll('.placeholder-text').length && sec.querySelectorAll('.placeholder-text').length ) {
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

Editor.prototype.appendParallax = function () {
  const art = this.elNode.closest('body');
  if (art != null) {
    if (document.querySelector('.parallax') != null) {
      return;
    }
    let cv = Utils.generateElement(this.templates.canvasTemplate()),
        handled = false,
        resizeHandler;

    cv.attr('width', Utils.getWindowWidth());
    cv.attr('height', Utils.getWindowHeight());

    art.insertBefore(cv, art.firstElementChild);
    const _this = this;
    resizeHandler = function() {
      if (!handled){
        setTimeout(function() {
          _this.resized();
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

Editor.prototype.resized = function () {
  if (this.parallax) {
    const wnW = Utils.getWindowWidth(), wnH = Utils.getWindowHeight();
    this.parallax.attr('width', wnW);
    this.parallax.attr('height', wnH);
    this.checkViewPortForCanvas();
  }
};

Editor.prototype.appendToolbars = function () {
  this.initTextToolbar();
  if (this.base_content_options.length > 0 && this.mode == 'write') {
    this.initContentOptions();
  };

  this.tooltip = new Tooltip({editor: this, node: document.querySelector('body')});
  this.tooltip.render().hide();
};

Editor.prototype.initTextToolbar = function () {
  const editorWrapper = this.elNode.closest('.editor-wrapper');
  let toolbarNode = editorWrapper.querySelector('.mf-toolbar-base');

  if ( toolbarNode == null ) {
    const tbEl = Utils.generateElement(this.templates.textToolbarBase());
    toolbarNode = this.elNode.insertAdjacentElement('afterend', tbEl);
  }
  
  if (this.text_toolbar == null) {
    this.text_toolbar = new TextToolbar({
      node: toolbarNode,
      editor: this,
      mode: this.mode
    });
  }

  this.toolbar = this.text_toolbar;
  return this.text_toolbar;
};

Editor.prototype.initContentOptions = function () {
  const base_options = this.base_content_options;
  const editorWrapper = this.elNode.closest('.editor-wrapper');
  
  if (base_options.indexOf("image") >= 0) {
    let toolbarNode = editorWrapper.querySelector('.mf-toolbar-base-image');
    if (toolbarNode == null) {
      const igEl = Utils.generateElement(this.templates.imageToolbarBase());
      toolbarNode = this.elNode.insertAdjacentElement('afterend', igEl);
    }
    
    this.image_toolbar = new ImageToolbar({
      node: toolbarNode,
      editor: this,
      mode: this.mode
    });

    this.image_toolbar.render().hide();
    
    const opt = new ImageContentBarItem({editor: this, toolbar: this.image_toolbar});
    this.image_toolbar.setController(opt);
    this.content_options.push(opt);
    this.image_uploader = opt;
  }
  
  if (base_options.indexOf("video") >= 0) { 
    const opt = new VideoContentBarItem({editor: this});
    this.content_options.push(opt); 
    this.video_uploader = opt;
  }
  
  if (base_options.indexOf("section") >= 0) { 
    const opt = new SectionContentBarItem({editor: this, mode: this.mode, editorType: this.editorType});
    this.content_options.push(opt);
    this.section_options = opt;
  }
  
  if (base_options.indexOf("embed") >= 0) { 
    const opt = new EmbedContentBarItem({editor: this, mode: this.mode});
    this.embed_options = opt;
    this.content_options.push(opt);
  }

  let contentBaseNode = editorWrapper.querySelector('.inlineContentOptions');
  if (contentBaseNode == null) {
    const coEl = Utils.generateElement(this.templates.contentToolbarBase());
    contentBaseNode = this.elNode.insertAdjacentElement('afterend', coEl);
  }
  
  this.content_bar = new ContentBar({node: contentBaseNode, editor:this, widgets: this.content_options});
  this.content_bar.render();

};

Editor.prototype.render = function (cb) {
  if (this.elNode.innerHTML.trim() == '') {
    this.elNode.appendChild( Utils.generateElement(this.templates.mainTemplate(this.publicationMode)) );
    if (this.publicationMode) {
      const bd = this.elNode.querySelector('.block-stories .main-body');
      //TODO add autocomplete dependency
      //$(this.elNode.querySelector('.autocomplete')).autocomplete();

      this.fillStoryPreview(bd, 6);
      const lsect = this.elNode.querySelector('section:last-child .main-body');
      if(lsect != null) {
        lsect.appendChild(Utils.generateElement(this.templates.singleColumnPara()));
      }
    }
    return setTimeout(() => { 
      this.setInitialFocus(); 
      if (cb) {
        cb();
      }
    }, 100);
  } else {
    return this.parseInitialContent(cb);
  }
};

Editor.prototype.parseInitialContent = function (cb) {
  if (this.mode == 'read') {
    cb();
    return this;
  }
  let _this = this;

  this.setupElementsClasses(this.elNode.querySelectorAll('.block-content-inner'), () => {
    if (_this.mode == 'write') {
      const figures = _this.elNode.querySelectorAll('.item-figure');

      figures.forEach((item) => {
        if (item.hasClass('figure-in-row')) {
          const cont = item.closest('.block-grid');
          let caption = cont.querySelector('.block-grid-caption');
          if (caption == null) {
            const t = Utils.generateElement(_this.templates.figureCaptionTemplate(true));
            t.removeClass('figure-caption');
            t.addClass('block-grid-caption');
            cont.appendChild(t);
            caption = cont.querySelector('.block-grid-caption');
          }
          caption.attr('contenteditable', true);
        } else {
          let caption = item.querySelector('figcaption');
          if (caption == null) {
            item.appendChild(Utils.generateElement(_this.templates.figureCaptionTemplate()));
            caption = item.querySelector('figcaption');
            item.addClass('item-text-default');
          }
          caption.attr('contenteditable', true);

          if ( caption.textContent.killWhiteSpace().length == 0 ) {
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

      const bgSections = _this.elNode.querySelectorAll('.with-background');
      bgSections.forEach( (item) => {
        const cellVs = item.querySelectorAll('.table-cell-view');
        cellVs.forEach(cev => {
          cev.attr('contenteditable', 'false');
        });
        const mainB = item.querySelectorAll('.main-body');
        mainB.forEach(mb => {
          mb.attr('contenteditable', 'true');
        });

      });
    }

    _this.addPlaceholdersForBackgrounds();
    _this.setupFirstAndLast();
    _this.setUpStoriesToolbar();
    _this.setInitialFocus();  
    cb();
  });
};

Editor.prototype.setUpStoriesToolbar = function () {
  if (!this.publicationMode) {
    return;
  }
  const sects = this.elNode.querySelectorAll('section');
  if (sects.length) {
    for (let i = 0; i < sects.length; i = i + 1) {
      const section = sects[i];
      const body = section.querySelector('.main-body');
      if (!section.hasClass('block-add-width') && !section.hasClass('block-full-width')) {
        section.addClass('block-center-width');
      }
      let toolbar;
      if (section.hasClass('block-stories')) {
        toolbar = Utils.generateElement(this.templates.getStoriesSectionMenu(true));
        const name = section.attr('name');
        const obName = window['ST_' + name];
        
        const count = 6, stType = 'featured', tagValue = '';

        if (obName) {
          count = obName.storyCount;
          stType = obName.storyType;
          if (typeof obName.storyTag != 'undefined') {
            tagValue = obName.storyTag;
          }
        } 

        this.fillStoryPreview(body, count);

        const tStCount = toolbar.querySelector('[data-for="storycount"]');
        if(tStCount != null) {
          tStCount.value = count;
        }
        const tStType = toolbar.querySelector('[data-for="storytype"]');
        if(tStType != null) {
          tStType.value = stType;
        }

        //FIXME autocomplete issue
        //const auto = toolbar.querySelector('.autocomplete');
        //auto.autocomplete({threshold:2, behave: 'buttons', type: 'tag'});

        const tagInpt = toolbar.querySelector('[data-for="tagname"]');
        if (stType == 'tagged') {
          tagInpt.closest('.autocomplete-buttons').removeClass('hide');
          auto.autocomplete({action:'set', data: JSON.parse(tagValue)});
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

Editor.prototype.addFigureControls = function () {
  this.elNode.querySelectorAll('.item-figure:not(.item-iframe)').forEach( item => {
    const temp = Utils.generateElement(this.templates.getImageFigureControlTemplate());
    item.querySelector('img')?.insertAdjacentElement('afterend', temp);
  });

};

Editor.prototype.addPlaceholdersForBackgrounds = function () {
  const backgrounds = this.elNode.querySelectorAll('.with-background');
  if (backgrounds.length) {

  }
};

Editor.prototype.storySectionFilterCallback = function() {
  const existingSects = this.elNode.querySelectorAll('.block-stories'),
  excludes = [];

  if (existingSects.length) {
    for (let i = 0;i < existingSects.length; i = i + 1) {
      const sec = existingSects[i];
      let select = sec.querySelector('[data-for="storytype"]');
      if(select != null) {
        const val = select.value;
        if (val != 'tagged') {
          excludes.push(val);
        }
      }
    }
  }

  return excludes;
}

Editor.prototype.fillStoryPreview = function (container, count) {
  count = typeof count == 'undefined' || isNaN(count) ? 6 : count;
  let ht = `<div class="center-column" contenteditable="false">`;
  for (let i = 0; i < count; i = i + 1) {
    ht += this.templates.getStoryPreviewTemplate();
  }
  ht += `</div>`;
  container.innerHTML = ht;
};

Editor.prototype.hideImageToolbar = function() {
  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }
};

Editor.prototype.hideContentBar = function() {
  if (this.content_bar) {
    this.content_bar.hide();
  }
};

// DOM related methods //
Editor.prototype.getSelectedText = function() {
  let text = "";
  if (typeof window.getSelection !== "undefined") {
    text = window.getSelection().toString();
  } else if (typeof document.selection !== "undefined" && document.selection.type === "Text") {
    text = document.selection.createRange().text;
  }
  return text;
};

Editor.prototype.selection = function() {
  if (window.getSelection) {
    return window.getSelection();
  } else if (document.selection && document.selection.type !== "Control") {
    return document.selection;
  }
};

Editor.prototype.getRange = function() {
  let editor = this.elNode, 
  range = this.selection && this.selection.rangeCount && this.selection.getRangeAt(0);
  if (!range) {
    range = document.createRange();
  }
  if (!editor.contains(range.commonAncestorContainer)) {
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  return range;
};

Editor.prototype.setRange = function(range) {
  range = range || this.current_range;
  if (!range) {
    range = this.getRange();
    range.collapse(false);
  }
  this.selection().removeAllRanges();
  this.selection().addRange(range);
  return this;
};

Editor.prototype.getCharacterPrecedingCaret = function() {
  let precedingChar = "",
      sel = void 0,
      range = void 0,
      precedingRange = void 0;

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
    } else if ((sel = document.selection) && sel.type !== "Control") {
      range = sel.createRange();
      precedingRange = range.duplicate();
      precedingRange.moveToElementText(containerEl);
      precedingRange.setEndPoint("EndToStart", range);
      precedingChar = precedingRange.text.slice(0);
    }  
  }
  return precedingChar;
};

Editor.prototype.isLastChar = function() {
  return this.getNode().textContent.trim().length === this.getCharacterPrecedingCaret().trim().length;
};

Editor.prototype.isFirstChar = function() {
  return this.getCharacterPrecedingCaret().trim().length === 0;
};

Editor.prototype.isSelectingAll = function(element) {
  const a = this.getSelectedText().killWhiteSpace().length;
  const b = element.textContent.killWhiteSpace().length;
  return a === b;
};

Editor.prototype.setRangeAt = function(element, int) {
  if (int == null) {
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

Editor.prototype.setRangeAtText = function(element, int) {
  if (int == null) {
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

Editor.prototype.focus = function(focusStart) {
  if (!focusStart) {
    this.setRange();
  }
  this.elNode.focus();
  return this;
};

Editor.prototype.focusNode = function(node, range) {
  range.setStartAfter(node);
  range.setEndBefore(node);
  range.collapse(false);
  return this.setRange(range);
};

Editor.prototype.getTextNodeParent = function() {
  let node, range, root, selection;
  node = void 0;
  root = this.elNode,
  selection = this.selection();

  if (selection.rangeCount < 1) {
    return;
  }

  range = selection.getRangeAt(0);

  node = range.commonAncestorContainer;

  if (!node || node === root) {
    return null;
  }
  while(node.nodeType != 1) {
    node = node.parentNode;
  }
  if (root && root.contains(node) && root != node) {
    return node;
  } else {
    return null;
  }
}

Editor.prototype.getNode = function() {
  let node, range, root, selection;
  node = void 0;
  root = this.elNode,
  selection = this.selection();

  if (selection.rangeCount < 1) {
    return;
  }

  range = selection.getRangeAt(0);

  node = range.commonAncestorContainer;

  if (!node || node === root) {
    return null;
  }

  while(node.nodeType != 1) {
    node = node.parentNode;
  }
  
  const pt = node.closest('.block-content-inner') != null ? node.closest('.block-content-inner') : root;
  
  while (node && (node.nodeType !== 1 || !node.hasClass("item")) && (node.parentNode !== pt)) {
    node = node.parentNode;
  }

  if (node != null && !node.hasClass("item-li") && !node.hasClass('figure-in-row')) {
    let elementRoot = node.closest('.block-content-inner');
    while (node && (node.parentNode !== elementRoot) && node != root) {
      node = node.parentNode;
    }
  }

  if (root && root.contains(node) && root != node) {
    return node;
  } else {
    return null;
  }

};

Editor.prototype.markAsSelected = function(element) {
  if (!element || (element && element.nodeType != 1)) {
    return;
  }

  this.elNode.querySelectorAll(".item-selected").forEach(el => {
    el.removeClass("figure-focused"); 
    el.removeClass("item-selected");
  });

  this.elNode.querySelectorAll(".figure-focused").forEach(el => el.removeClass("figure-focused"));

  document.querySelectorAll('.grid-focused').forEach(el => el.removeClass('grid-focused'));

  if (element.hasClass('block-grid-caption')) {
    element.closest('.block-grid')?.addClass('grid-focused');
  }

  element.addClass("item-selected"); 

  if (this.image_toolbar) {
    this.image_toolbar.hide();  
  }
  
  this.setElementName(element);
  this.displayTooltipAt(element);
  this.activateBlock(element);

  if (element.hasClass("item-first") && element.closest('.block-first') != null) {
    this.reachedTop = true;
    if (element.querySelectorAll("br").length === 0) {
      return element.append(document.createElement("br"));
    }
  } else {
    this.reachedTop = false;
  }
};

Editor.prototype.activateBlock = function (elem) {
  this.elNode.querySelectorAll('.block-selected').forEach(el => el.removeClass('block-selected'));
  elem.closest('.block-content')?.addClass('block-selected');
};

Editor.prototype.setupFirstAndLast = function() {
  const il = this.elNode.querySelector('.item-last');
  const imf = this.elNode.querySelector('.item-first');
  
  if(il != null) { il.removeClass('item-last'); }
  if(imf != null) { imf.removeClass('item-first'); }

  const blocks = this.elNode.querySelectorAll('.block-content-inner');
  if(blocks.length > 0) {
    const chh = blocks[0].children;
    if(chh != null && chh.length > 0) {
      chh[0].addClass('item-first');
    }
    const llh = blocks[blocks.length - 1];
    const cllh = llh.children;
    if(cllh != null && cllh.length > 0) {
      cllh[cllh.length - 1].addClass('item-last');
    }
  }
  return;
};

// DOM Related methods ends //
// EDIT content methods //
Editor.prototype.scrollTo = function(node) {
  if ( node.isElementInViewport() ) {
    return;
  }
  //top = node.offsetTop;
  Utils.scrollToTop();
};

Editor.prototype.setupLinks = function(elems) {
  if(elems.length != 0) {
    elems.forEach( (ii) => {
      this.setupLink(ii);
    });
  }
};

Editor.prototype.setupLink = function(n) {
  let href, parent_name;
  parent_name = n.parentNode.tagName.toLowerCase();
  n.addClass("markup-" + parent_name);
  href = n.attr("href");
  return n.attr("data-href", href);
};

// EDIT content methods ends //
// Toolbar related methods //
Editor.prototype.displayTooltipAt = function(element) {
  if (!this.content_bar) {
    return;
  }

  if (!element || element.tagName === "LI") {
    return;
  }

  this.hideContentBar();
  this.content_bar.hide();

  this.content_bar.elNode.removeClass('on-darkbackground');

  if (!element.textContent.isEmpty() && element.querySelectorAll('.placeholder-text').length != 1) {
    return;
  }

  if(element.closest('.with-background') != null) {
    this.content_bar.elNode.addClass('on-darkbackground');
  }
  const rect = element.getBoundingClientRect();
  this.positions = { top: element.offsetTop, left: rect.left };
  
  if (element.hasClass('item-h2')) {
    this.positions.top += 10;
  }else if(element.hasClass('item-h3')) {
    this.positions.top += 5;
  }else if(element.hasClass('item-h4')) {
    this.positions.top += 5;
  }

  document.querySelector('.hide-placeholder')?.removeClass('hide-placeholder');
  
  if (element.querySelectorAll('.placeholder-text').length) {
    element.addClass('hide-placeholder');
  }else {
    element.removeClass('hide-placeholder');
  }

  this.content_bar.show(element);
  return this.content_bar.move(this.positions);
};

Editor.prototype.displayTextToolbar = function(sel) {
  return setTimeout(() => {
      const pos = Utils.getSelectionDimensions();
      this.text_toolbar.render();        
      this.relocateTextToolbar(pos);
      this.toolbar = this.text_toolbar;
      return this.text_toolbar.show();
    }, 10);
};

Editor.prototype.handleTextSelection = function(anchor_node) {
  if(!anchor_node) {
    return;
  }
  let text = this.getSelectedText();

  if (this.mode == 'read' && text && (text.length < 10 || text.length > 160)) {
    this.text_toolbar.hide();
    return;
  }
  
  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }

  if ( anchor_node.matches(".item-mixtapeEmbed, .item-figure") && !text.isEmpty() ) {
    this.text_toolbar.hide();
    let sel = this.selection(), range, caption, eleme;
    if (sel) {
      range = sel.getRangeAt(0),
      caption,
      eleme = range.commonAncestorContainer;
      caption = eleme != null ? eleme.closest('.caption') : null;
      if (caption != null) {
        this.current_node = anchor_node;    
        return this.displayTextToolbar();  
      }
    }
  }
  
  if (!anchor_node.matches(".item-mixtapeEmbed, .item-figure") && !text.isEmpty() && anchor_node.querySelectorAll('.placeholder-text').length == 0) {
    this.current_node = anchor_node;
    return this.displayTextToolbar();
  } else {
    this.text_toolbar.hide();
  }

};


Editor.prototype.relocateTextToolbar = function(position) {
  let height, left, padd, top;
  const elRect = this.toolbar.elNode.getBoundingClientRect();
  height = elRect.height;
  padd = elRect.width / 2;
  
  left = position.left + (position.width / 2) - padd;

  if (left < 0) {
    left = position.left;
  }

  if (this.isIOS) {
    top = position.top + window.scrollY + height;
    this.text_toolbar.elNode.addClass('showing-at-bottom')
  } else {
    this.text_toolbar.elNode.removeClass('showing-at-bottom')
    top = position.top + window.scrollY - height;
  }

  const elCss = this.text_toolbar.elNode.style;
  elCss.left = left + 'px';
  elCss.top = top + 'px';
  elCss.position = 'absolute';

};
// Toolbar related methods ends //

Editor.prototype.hidePlaceholder = function (node, ev) {
  let ev_type = ev.key || ev.keyIdentifier;

  if([UPARROW, DOWNARROW, LEFTARROW, RIGHTARROW].indexOf(ev.which) != -1) {
    this.skip_keyup = true;
    return;
  }

  if (node && node.hasClass('item-figure')) {
    node.querySelectorAll('.placeholder-text').forEach(el => el.parentNode.removeChild(el));
    return;
  }

  if (node && node.querySelectorAll('.placeholder-text').length) {
    node.innerHTML = '<br />';
    this.setRangeAt(node);
  }
};

// EVENT LISTENERS //

Editor.prototype.cleanupEmptyModifierTags = function (elements) {
  elements.forEach(element => {
    element.querySelectorAll('i, b, strong, em').forEach( item => {
      if(item.textContent.killWhiteSpace().length == 0) {
        const pnt = item.parentNode;
        item.parentNode.replaceChild(document.createTextNode(''), item);
        if(pnt != null) {
          pnt.normalize();
        }
      }
    });
  })
};

Editor.prototype.convertPsInnerIntoList = function (item, splittedContent, match) {
  let split = splittedContent,
      ht = '',
      k = 0,
      counter = match.matched[0].charAt(0);

  // FIXME .. counter checking for many chars which are not implements, not sure other languages have
  // 26 characters or more.. 
  // just avoid the splitting part if we have more than 26 characters and its not numerical
  if (['a','A','i','I','α','Ա','ა'].indexOf(counter) != -1 && split.length > 26) {
    return;
  }

  let count = isNaN(parseInt(counter)) ? counter: parseInt(counter) ;

  while (k < split.length) {
    const sf = '\\s*' + count +'(.|\\))\\s';
    const exp = new RegExp(sf);
    let sp = split[k].replace(exp, '');
    ht += '<li>' + sp + '</li>';
    k++;
    count = Utils.incrementCounter(count);
  }

  // we have a sequence..
  const olN = Utils.generateElement('<ol class="postList">' + ht + '</ol>');
  item.parentNode.replaceChild( olN, item );
    
  this.addClassesToElement( olN );

  if(olN.children) {
    Array.from(olN.children).forEach( elm => {
      this.setElementName(elm);
    });
  }
};

Editor.prototype.doesTwoItemsMakeAList = function (first, second) {
  let f = first,
      s = second,
      firstMatch = f.match(/\s*[1aA](\.|\))\s*/),
      secondMatch = s.match(/\s*[2bB](\.|\))\s*/);

  if (firstMatch && secondMatch) {
    return { matched: firstMatch, type: 'ol' };
  }

  firstMatch = f.match(/^\s*(\-|\*)\s*$/);
  secondMatch = s.match(/^\s*(\-|\*)\s*$/);

  if (firstMatch && secondMatch) {
    return {matched: firstMatch, type: 'ul'};
  }

  return {matched: false};
};


Editor.prototype.handleUnwrappedLists = function (elements) {
  elements.forEach( item => {
      if (item.hasClass('item-figure')) {
        return;
      }
      const html = item.innerHTML;
      if ( html.trim().length !== 0 ) {
        // first case
        let split = html.split('<br>');

        if (split.length >= 2 && split[1] != '') {
          let match = this.doesTwoItemsMakeAList(split[0], split[1]);
          match.matched = false;

          if (match.matched) {
            this.convertPsInnerIntoList(item, split, match);
          }  
        }
      }
  });
};


Editor.prototype.handleUnwrapParagraphs = function(elements) {
  elements.forEach( item => {
    const p = item.querySelectorAll('p');
    if (p.length) {
      const currNodeName = item.tagName.toLowerCase();
      if (currNodeName == 'blockquote') {
        const d = document.createElement('div');

        for (let i = 0; i < p.length; i = i + 1) {
          let len = p.children.length;
          for(let j = 0; j < len; j++) {
            d.appendChild(p.children[j]);
          }
          p.parentNode.removeChild(p);
        }

        const len = d.children.length;
        for(let i = 0; i < len; i++) {
          item.appendChild(d.children[i]);
        }

      }
    }
  });
};


Editor.prototype.handleUnwrappedImages = function(elements) {
  elements.forEach(item => {
    if (item.hasClass('ignore-block') && item.hasClass('item-uploading')) {
      return;
    }
    const img = item.querySelectorAll('img');
    if (img.length) {
      item.attr('data-pending', true);
      
      if (item && item.children) {
        const children = item.children;
        const div = document.createElement('p');
        for (let i = 0; i < children.length; i++) {
          const it = children[i];
          if (it == img[0]) {
            continue;
          } else {
            div.appendChild(it);
          }
        }
        item.insertAdjacentElement('afterend', div);

        //div.insertAfter(item);
        this.addClassesToElement(div);
        this.setElementName(div);
      }

      this.image_uploader.uploadExistentImage(img);
    }
  });

};

Editor.prototype.handleUnwrappedFrames = function (elements) {
  elements.forEach(element => {
    element.querySelectorAll('iframe').forEach( im => {
      this.video_uploader.uploadExistentIframe(im);
    });
  })
};

Editor.prototype.handleSpanReplacements = function (element) {
  const replaceWith = element.querySelectorAll('.replace-with');

  replaceWith.forEach( node => {
    const hasBold = node.hasClass('bold'),
      hasItalic = node.hasClass('italic');

    if (hasBold && hasItalic) {
      node.parentNode.replaceChild(Utils.generateElement(`<i class="markup-i"><b class="markup-b">${node.innerHTML}</b></i>`), node);
    }else if(hasItalic) {
      node.parentNode.replaceChild(Utils.generateElement(`<i class="markup-i">${node.innerHTML}</i>`), node);
    } else if(hasBold) {
      node.parentNode.replaceChild(Utils.generateElement(`<b class="markup-i">${node.innerHTML}</b>`), node);
    }
  });
};


Editor.prototype.removeUnwantedSpans = function () {
  this.elNode.addEventListener('DOMNodeInserted', (ev) => {
    const node = ev.target;
    if(node.nodeType == 1 && node.nodeName == 'SPAN') {
      if(!node.hasClass('placeholder-text')) {
        const pn = node.parentNode;
        let lastInserted = null;
        Array.from(node.childNodes).forEach(el => {
          if(lastInserted == null) {
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

Editor.prototype.cleanPastedText = function (text) {
  const regs =  [
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

    //[replace google docs bolds with a span to be replaced once the html is inserted
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
    [new RegExp(/<!\[if !supportLists\]>(((?!<!).)*)<!\[endif]\>/gi), '$1']

  ];

  for (let i = 0; i < regs.length; i += 1) {
      text = text.replace(regs[i][0], regs[i][1]);
  }

  return text;
};

Editor.prototype.insertTextAtCaretPosition = function (textToInsert, haveMoreNodes) {
  if (document.getSelection && document.getSelection().getRangeAt) {
    const sel = document.getSelection();
    const range = sel.getRangeAt(0);
    const ca = range.commonAncestorContainer;
    
    const getBlockContainer = (node) => {
      while (node) {
        if (node.nodeType == 1 && node.nodeName == 'FIGCAPTION') {
          return node;
        }
        node = node.parentNode;
      }
    };

    const generateRightParts = (node) => {
      if (sel.rangeCount > 0) {
        let blockEl = getBlockContainer(range.endContainer);
        if (blockEl) {
          const ran = range.cloneRange();
          ran.selectNodeContents(blockEl);
          ran.setStart(range.endContainer, range.endOffset);
          return ran.extractContents();
        }
      }
    };

    const generateLeftParts = (node) => {
      if (sel.rangeCount > 0) {
        let blockEl = getBlockContainer(range.startContainer);
        if (blockEl) {
          const ran = range.cloneRange();
          ran.selectNodeContents(blockEl);
          ran.setEnd(range.startContainer, range.startOffset);
          return ran.extractContents();
        }
      }
    };

    if (sel.type == 'Caret') {
      off = range.endOffset;
      const rest = generateRightParts();

      if (ca.nodeType == 3) {
        ca = ca.parentNode;
      }
      ca.appendChild(textToInsert);
      if (!haveMoreNodes) {
        ca.appendChild(rest);
      }
      return rest;
    }
    if (sel.type == 'Range') {
      const left = generateLeftParts();
      let right = '';
      if (haveMoreNodes) {
        right = generateRightParts();
      }
      if (ca.nodeType == 3) {
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

Editor.prototype.doPaste = function (pastedText) {

  if (pastedText.match(/<\/*[a-z][^>]+?>/gi)) {

    pastedText = this.cleanPastedText(pastedText);
    let pei = this.paste_element;
    if(pei != null) {
      this.paste_element.parentNode.removeChild(pei);
    }

    pei = document.createElement('div');
    pei.style.display = 'none';
    this.paste_element = pei;
    this.elNode.closest('.editor-wrapper').appendChild(pei);

    if(pei != null) {
      pei.innerHTML = `<span>${pastedText}</span>`;
    }

    // fix span with related tags 
    this.handleSpanReplacements(pei);

    this.pastingContent = true;

    this.setupElementsClasses(pei, () => {
        let last_node, new_node, nodes, num, top;
        nodes = Utils.generateElement(this.paste_element.innerHTML)
        if(nodes != null && typeof nodes['length'] !== 'undefined') {
          nodes = [...nodes]; //
        } else if(nodes != null) { // single element
          nodes = [nodes];
          //this.aa.insertAdjacentElement('afterend', nodes);
        } 
        if(nodes == null || nodes.length == 0) {
          return;
        }

        let after = this.aa;
        for(let i = 0; i < nodes.length; i++) {
          let nd = nodes[i];
          after.insertAdjacentElement('afterend', nd);
          after = nd;
        }

        const aa = this.aa;
        let caption;

        if (aa.hasClass('item-figure')) {
          if (aa.hasClass('figure-in-row')) {
            const grid = aa.closest('.block-grid');
            if(grid != null) {
              caption = grid.querySelector('.block-grid-caption');
            }
          } else {
            caption = aa.querySelector('figcaption');
          }
        } else if(aa.hasClass('block-grid-caption')) {
          caption = aa;
        }

        if (caption != null) {
          let first = nodes;
          let firstText = first.textContent;
          let leftOver = '';
          if (aa.hasClass('item-text-default')) {
            caption.innerHTML = firstText;
          } else {
            leftOver = this.insertTextAtCaretPosition(firstText, nodes.length - 1); // don't count the current node
          }
          aa.removeClass('item-text-default');
          nodes.splice(0, 1);
          first.parentNode.removeChild(first);
          if (leftOver != '') {
            const o = document.createElement('p');
            o.appendChild(Utils.generateElement(leftOver));
            o.insertAfter(nodes.lastElementChild);
          }
        }

        if (!nodes.length) {
          return;
        }
        if (aa.textContent == '') {
          aa.parentNode.removeChild(aa);
        }

        if(this.paste_element != null) {
          const pt = this.paste_element.querySelector('figure');
          if(pt != null) {
            this.paste_element.parentNode.removeChild(pei);
          }
        }

        last_node = nodes[nodes.length - 1];
        if (last_node && last_node.length) {
          last_node = last_node[0];
        }
        num = last_node.childNodes.length;
        this.setRangeAt(last_node, num);
        if(new_node != null) {
          new_node = this.getNode();
          top = new_node.offsetTop;
          this.markAsSelected(new_node);
        }

        this.displayTooltipAt(this.elNode.querySelector(".item-selected"));

        this.cleanupEmptyModifierTags(nodes);

        // handle unwrapped images
        this.handleUnwrappedImages(nodes);
        // unwrapped iframes, if we can handle, we should
        this.handleUnwrappedFrames(nodes);
        // unwrapped lists items, inside p's or consective p's
        this.handleUnwrappedLists(nodes);

        // unwrap p's which might be inside other elements
        this.handleUnwrapParagraphs(nodes);

        this.elNode.querySelectorAll('figure').forEach( (ite) => {
          let it = ite;
          if (it.querySelectorAll('img').length == 0) {
            it.parentNode.removeChild(it);
          }
        });

        this.elNode.querySelectorAll('figcaption').forEach((ite) => {
          let it = ite.closest('.item');
          if (it != null && it.querySelectorAll('img').length == 0) {
            it.parentNode.removeChild(it);
          }
        });

        return Utils.scrollToTop(top);
      
      }
    );
    return false;
  } else {
    //its plain text
    const node = this.aa;
    if (node.hasClass('item-figure') ) {
      let caption;
      if (node.hasClass('figure-in-row')) {
        let grid = node.closest('.block-grid');
        caption = grid != null ? grid.querySelector('.block-grid-caption') : null;
      } else {
        caption = node.querySelector('figcaption');
      }
      if (caption != null) {
        caption.innerHTML = pastedText;
        return false;
      }
    }
  }
};


Editor.prototype.handlePaste = function(ev) {
  ev.preventDefault();
  let cbd, pastedText;
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


Editor.prototype.handleDblclick = function(e) {
  let tg = e.target.closest('.main-controls');
  if (tg != null) {
    return false;
  }
  const node = this.getNode();
  if (!node) {
    this.setRangeAt(this.prev_current_node);
  }
  return false;
};

Editor.prototype.handleMouseDown = function (e) {
  let node, anchor_node,
    el = e.toElement;

  if (el.hasClass('placeholder-text') || el.querySelectorAll('.placeholder-text').length) {
    node = el.closest('.figure-caption');
    if(node != null) {
      e.preventDefault();
      Utils.setCaretAtPosition(node, 0);
    } else {
      node =  el.closest('.item');
      if(node != null) {
        e.preventDefault();
        Utils.setCaretAtPosition(node, 0);
      }  
    }
  } else if(el.hasClass('block-background') || el.hasClass('table-view') || el.hasClass('table-cell-view')) {
    const section = el.closest('section');
    if(section != null) {
      this.selectFigure(section);
    }
  } else if(el.hasClass('block-grid-caption')) {
    el.closest('.block-grid')?.addClass('grid-focused');
  }

};

// NOTE don't use the event, as its just dummy, function gets called from selection change also
Editor.prototype.handleMouseUp = function () {
  let anchor_node,
      selection = this.selection();
  
  if (!selection && selection.anchorNode.hasClass('main-divider')) {
    let new_anchor = selection.anchorNode,
        focusTo = new_anchor.nextElementSibling.querySelector('.block-content-inner:first-child .item:first-child');
      if (focusTo != null) {
        this.setRangeAt(focusTo);
        Utils.setCaretAtPosition(focusTo);
      }
  }

  anchor_node = this.getNode();

  if (!anchor_node) {
    return;
  }

  this.prev_current_node = anchor_node;
  this.handleTextSelection(anchor_node);
  this.markAsSelected(anchor_node);

  if (!anchor_node.hasClass('item-figure')) {
    return this.displayTooltipAt(anchor_node);  
  } else {
    this.hideContentBar();
    return this;
  }
};

Editor.prototype.handleArrow = function(ev) {
  const current_node = this.getNode();
  if (current_node != null) {
    this.markAsSelected(current_node);
    return this.displayTooltipAt(current_node);
  }
};


Editor.prototype.handleTab = function(anchor_node, event) {
  const nextTabable = function (node) {
    let next = node.next('.item');
    if (next != null) {
      return next;
    }
    let cont = node.closest('.block-content-inner');
    next = cont != null ? cont.nextElementSibling : null;
    if (next != null) {
      return next;
    }
    let sec = node.closest('.block-content');
    next = sec != null ? sec.next() : null;
    if (next != null) {
      let block = next.querySelector('.block-content-inner:last-child');
      if (block != null) {
        let item = block.querySelector('.item:last-child');
        if (item != null) {
          return item;
        } else {
          return block;
        }
      } else {
        return next;  
      }
    }
    return false;
  };

  const prevTabable = function (node) {
    let prev = node.prev('.item');
    if (prev != null) {
      return prev;
    }
    let cont = node.closest('.block-content-inner');
    cont = cont != null ? cont.previousElementSibling : null;

    if (cont != null && (cont.hasClass('block-grid') || cont.hasClass('full-width-column')) ) {
      return cont;
    } else if(cont.length && cont.hasClass('center-column')) {
      let i = cont.querySelector('.item:last-child');
      if (i != null) {
        return i;
      }
    }

    let sec = node.closest('.block-content');
    prev = sec.previousElementSibling;
    if (prev != null) {
      const last = prev.querySelector('.block-content-inner:last-child');
      if (last != null && last.hasClass('block-grid')) {
        return last;
      } else if(last != null && last.hasClass('center-column')) {
        const i = last.querySelector('.item:last-child');
        if (i != null) {
          return i;
        }
      }
    }
    return false;
  };

  let next;
  if (!anchor_node) {
    anchor_node = document.querySelector('.item-selected');
    if (!anchor_node) {
      anchor_node = document.querySelector('.grid-focused');
    }
  }
  if (!anchor_node) {
    return;
  }
  if (event.shiftKey) {
    next = prevTabable(anchor_node);
  } else {
    next = nextTabable(anchor_node);
  }
  if (next) {
    if (next.hasClass('block-grid')) {
      const cap = next.querySelector('.block-grid-caption');
      if (cap != null) {
        this.setRangeAt(cap);
      }
      next.addClass('grid-focused');
    } else if(next.hasClass('full-width-column')) {
      const fig = next.querySelector('.item-figure');
      if (fig != null) {
        const cap = fig.querySelector('figcaption');
        if (cap != null) {
          this.setRangeAt(cap);
        }
        this.selectFigure(fig);
      }
    } else if(next.hasClass('item-figure')) {
      const cap = next.querySelector('figcaption');
      if (cap != null) {
        this.setRangeAt(cap);
      }
      this.selectFigure(next);
    } else if(next.hasClass('with-background')) {
      const items = next.querySelector('.item:first-child');
      if (items != null) {
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

Editor.prototype.handleArrowForKeyDown = function(ev) {
  if (ev.shiftKey) { // probably trying
    return
  }
  let caret_node, current_node, ev_type, n, next_node, num, prev_node, crossing_section = false, cn;
  caret_node = this.getNode();
  current_node = caret_node;

  ev_type = ev.key || ev.keyIdentifier;

  switch (ev_type) {
    case "Left":
    case "Right":
      if ( !current_node || !current_node.length) {
        if (document.querySelector(".item-selected") != null) {
          current_node = document.querySelector(".item-selected");
        }
      }
      if(current_node.querySelectorAll('.placeholder-text').length == 1) {
        Utils.stopEvent(ev);
        return false;
      }
      break;
    case "Down":
      if ( !current_node || !current_node.length) {
        if (document.querySelector(".item-selected") != null) {
          current_node = document.querySelector(".item-selected");
        }
      }

      next_node = current_node.nextElementSibling;

      if (next_node == null) {
        n = this.findNextFocusableElement(current_node);
        next_node = n.node;
        crossing_section = n.section_crossed;
      }

      if (current_node.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
        // we move to caption unles its a partialwidth
        if (current_node.hasClass('figure-in-row') && next_node && !next_node.hasClass('figure-in-row')) {
          const cont = current_node.closest('.block-content-inner');
          if (cont != null) {
            const last = cont.querySelector('.item-figure:last-child');
            if (last != null && last.attr('name') == current_node.attr('name')) {
              next_node = cont.closest('.block-grid').querySelector('.block-grid-caption');
            }
          }
        } else if (!next_node || !current_node.hasClass('figure-in-row')) {
            next_node = current_node.querySelector('.figure-caption');
        }
      } else if (current_node.hasClass('item-figure') && ev.target.hasClass('figure-caption')) {
        if (current_node.hasClass('figure-in-row')) {
          current_node.closest('.block-content-inner').removeClass('figure-focused');
        } 
        if(!next_node) { // we don't have a next node
          const cont = current_node.closest('.block-content-inner').nextElementSibling;
          if (cont != null) {
            next_node = cont.querySelector('.item:first-child');
          }
        } 
      }
      cn = current_node;

      if (!cn.hasClass("item") && cn.nodeName != 'FIGCAPTION') {
        return;
      }

      if (cn.hasClass('item-last') && Utils.editableCaretOnLastLine(current_node)) {
        return;
      }

      if (!next_node) {
        return;
      }

      if (next_node.hasClass('figure-caption') || next_node.hasClass('block-grid-caption')) {
        const figure = next_node.closest('.item-figure');
        if (figure != null || current_node.hasClass('figure-in-row')) {
          this.hideImageToolbar();
          this.markAsSelected(figure);
          this.setRangeAt(next_node);
          if (figure.hasClass('figure-in-row')) {
            figure.closest('.block-content-inner').addClass('figure-focused'); 
          }
          if (current_node.hasClass('figure-in-row')) {
            current_node.closest('.block-grid').addClass('grid-focused');
          }
          Utils.setCaretAtPosition(next_node);
          ev.preventDefault();
          return false;
        }
      }

      if (current_node.hasClass("item-figure") && next_node.hasClass("item-figure")) {
        this.scrollTo(next_node);
        this.skip_keyup = true;
        this.selectFigure(next_node);
        return false;
      }

      if (next_node.hasClass("item-figure") && caret_node) {
        this.skip_keyup = true;
        this.selectFigure(next_node);
        ev.preventDefault();
        return false;
      } else if (next_node.hasClass("item-mixtapeEmbed")) {
        n = current_node.next(".item-mixtapeEmbed");
        num = n.childNodes.length;
        this.setRangeAt(n, num);
        this.scrollTo(n);
  
        return false;
      } 

      if (current_node.hasClass("item-figure") && next_node.hasClass("item")) {
        this.scrollTo(next_node);
  
        if(next_node.querySelectorAll('.placeholder-text').length) {
          this.markAsSelected(next_node);
          this.setRangeAt(next_node); 
          Utils.setCaretAtPosition(next_node,0);
          ev.preventDefault();
          return false;
        } else {
          this.markAsSelected(next_node);
          this.setRangeAt(next_node);  
          ev.preventDefault();
          return false;
        }
      }

      if (next_node.hasClass('item-last') && next_node.querySelector('.placeholder-text') != null) {
        Utils.stopEvent(ev);
        Utils.setCaretAtPosition(next_node, 0);
        return false;
      }

      if(next_node.querySelectorAll('.placeholder-text').length) {
        Utils.setCaretAtPosition(next_node, 0);
        return false; 
      }

      if (crossing_section) {
        ev.preventDefault();
        this.setRangeAt(next_node);
        Utils.setCaretAtPosition(next_node, 0);
        this.markAsSelected(next_node);
        return false
      }

      this.markAsSelected(next_node);

      break;
    case "Up":
      if ( !current_node || !current_node.length) {
        if (document.querySelector(".item-selected") != null) {
          current_node = document.querySelector(".item-selected");
        }
      }

      prev_node = current_node.previousElementSibling;

      if (prev_node == null) {
        n = this.findPreviousFocusableElement(current_node);
        prev_node = n.node;
        crossing_section = n.section_crossed;
      }

      if (typeof prev_node == 'undefined') {
        prev_node = current_node.previousElementSibling;
      }

      if (current_node.hasClass('block-grid-caption')) {
        const lastRow = current_node.closest('.block-grid').querySelector('.block-grid-row');
        if (lastRow != null) {
          prev_node = lastRow.querySelector('.item-figure:last-child');
        }
        
      } else if (current_node.hasClass('block-grid-row') && ev.target.hasClass('figure-caption')) {
          prev_node = current_node.querySelector('.figure-in-row:last-child');
      } else if(current_node.hasClass('block-grid-row')) {

      } else {
        if (prev_node.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
          if (prev_node.hasClass('figure-in-row')) {
            const cont = prev_node.closest('.block-content-inner'),
            lastGraf = cont ? cont.querySelector('.item-figure:last-child') : null;
            if (cont != null && lastGraf != null && lastGraf.attr('name') == prev_node.attr('name')) {
              prev_node = prev_node.querySelector('.figure-caption');
            }
          } else {
            prev_node = prev_node.querySelector('.figure-caption');
          }
        } else if (current_node.hasClass('item-figure') && ev.target.hasClass('figure-caption')) {
          if (current_node.hasClass('figure-in-row')) {
            prev_node = current_node;
          } else {
            prev_node = current_node;
          }
        }  
      }
      cn = current_node;

      if (!cn.hasClass("item") && !cn.hasClass('block-grid-caption')) {
        return;
      }
      if (!(cn.hasClass("item-figure") || !cn.hasClass('item-first'))) {
        return;
      }

      if (prev_node.hasClass('block-grid-caption')) {
        prev_node.closest('.block-grid')?.addClass('grid-focused');
      }

      if (prev_node.hasClass('figure-caption')) {
        const figure = prev_node.closest('.item-figure');
        this.hideImageToolbar();
        this.markAsSelected(figure);
        this.setRangeAt(prev_node);
        this.scrollTo(prev_node);
        if (figure.hasClass('figure-in-row')) {
          figure.closest('.block-content-inner').addClass('figure-focused');
        }
        Utils.setCaretAtPosition(prev_node);
        ev.preventDefault();
        return false;
      }

      if (prev_node.hasClass("item-figure")) {
        document.activeElement.blur();
        this.elNode.focus();
        this.selectFigure(prev_node);
        return false;
      } else if (prev_node.hasClass("item-mixtapeEmbed")) {
        n = current_node.prev(".item-mixtapeEmbed");
        if(n != null) {
          num = n.childNodes.length;
          this.setRangeAt(n, num);
          this.scrollTo(n);
        }
        return false;
      }

      if (current_node.hasClass("item-figure") && prev_node.hasClass("item")) {

        if(document.activeElement) {
          document.activeElement.blur();  
          this.elNode.focus();
        }
        
        this.hideImageToolbar();

        this.markAsSelected(prev_node);
        this.scrollTo(prev_node);

        this.setRangeAt(prev_node);
        Utils.setCaretAtPosition(prev_node);
        this.skip_keyup = true;
        ev.preventDefault();
      
        return false;
      } else if (prev_node.hasClass("item") && !crossing_section) {
        n = current_node.prev(".item");
        if (n != null) {
          this.scrollTo(n);  
        }else {
          this.scrollTo(prev_node);
        }

        this.markAsSelected(prev_node);

        if(prev_node.hasClass('item-first') && prev_node.querySelector('.placeholder-text') != null) {              
          Utils.stopEvent(ev);
          Utils.setCaretAtPosition(prev_node, 0);
        }

        return false;
      }

      if (crossing_section) {
        ev.preventDefault();
        this.setRangeAt(prev_node);
        Utils.setCaretAtPosition(prev_node, 0);
        this.markAsSelected(prev_node);
        return false
      }
  }
};

Editor.prototype.insertFancyChar = function (event, text) {
  Utils.stopEvent(event);
  let node = this.getNode(),
      textVal,
      range = this.selection().getRangeAt(0);

    range.deleteContents();
  if(text == 'single' || text == 'double') {
    textVal = node.textContent;
    let leftQuote = false, rightQuote = false;

    if((text == null || (text != null && text.trim().length == 0)) || this.isFirstChar() || /\s/.test(textVal.charAt(textVal.length - 1)) ) {
      leftQuote = true;
    }

    if (text == 'single') {
      if (leftQuote) {
        text = QUOTE_LEFT_UNICODE;
      } else {
        text = QUOTE_RIGHT_UNICODE;
      }
    } else if (text == 'double') {
      if (leftQuote) {
        text = DOUBLEQUOTE_LEFT_UNICODE;
      } else {
        text = DOUBLEQUOTE_RIGHT_UNICODE;
      }
    }
  } else if(text == 'dash') {
    text = DASH_UNICODE;
  }

  let appended = false;
  if (node.hasClass('pullquote') && !node.hasClass('with-cite') && (text == DOUBLEQUOTE_RIGHT_UNICODE || text == DASH_UNICODE)) {
    if (Utils.editableCaretAtEnd(node)) {
      let cite = ('<cite class="item-cite">' + DASH_UNICODE + ' </cite>');
      node.appendChild(Utils.generateElement(cite));
      Utils.setCaretAtPosition(cite,2);
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
Editor.prototype.handleKeyPress = function({which}) { 
  
  switch(which) {
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

Editor.prototype.handleShortCutKeys = function (e) {
  const which = e.which;
  this.current_node = this.getNode();
  let node = this.current_node;

  if (e.ctrlKey && which == CHAR_LINK) {
    if (this.image_toolbar && (node.hasClass('item-figure') || node.hasClass('item-iframe')) ) {
      return this.image_toolbar.addLink(e);
    }
  }

  if (e.ctrlKey && e.altKey) {
    if (SHORT_CUT_KEYS.indexOf(which) != -1 && this.text_toolbar) {
      
      return this.text_toolbar.shortCutKey(which);
    }
  } else if(e.ctrlKey && (which == CHAR_CENTER || which == CHAR_LINK)) {
    return this.text_toolbar.shortCutKey(which, e);
  }
};

Editor.prototype.handleKeyDown = function(e) {
  const tg = e.target;
  if (tg.hasClass('.autocomplete')) {
    this.skip_keyup = true;
    return;
  }

  if (e.ctrlKey && !e.shiftKey && [LEFTARROW,DOWNARROW, UPARROW, DOWNARROW].indexOf(e.which) != -1 && tg.hasClass('item-figure')) {
    return this.handleKeyDownOnFigure(e, tg);
  }

  
  if (e.ctrlKey && !e.shiftKey && e.which >= 49 && e.which <= 52 && (tg.hasClass('item-figure') || document.querySelectorAll('.with-background.figure-focused').length) ) {
    if (this.image_toolbar) {
      this.image_toolbar.shortCutKey(e.which , e);
    }
    return false;
  }

  let anchor_node,
      eventHandled, li, parent, utils_anchor_node;

  anchor_node = this.getNode();
  parent = anchor_node;

  if (anchor_node) {
    this.markAsSelected(anchor_node);
  }

  this.hidePlaceholder(anchor_node, e); // hide placeholder if we are in placeholder item

  this.handleShortCutKeys(e);

  if (e.which == ESCAPE) {
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
    this.handleTab(anchor_node, e);
    return false;
  }

  if (e.ctrlKey && !e.shiftKey && e.which == 67 && (!anchor_node || anchor_node.length == 0) && document.querySelector('.figure-focused') != null) {
    if (document.createRange) {
      const range = document.createRange();
      const figure = document.querySelector('.figure-focused .item-image');
      this.skip_keyup = true;
      if (figure != null) {
        const sel = this.selection();
        sel.removeAllRanges();
        range.selectNode(figure);
        sel.addRange(range);  
      }
    }
  }

  if (e.which == DELETE) {

    if (this.reachedTop && this.isFirstChar() && anchor_node.next('.item') == null) {
      const sec = anchor_node.closest('.block-content');

      if (sec != null && sec.next('.block-content') != null) {
        this.content_options.forEach( w => {
          if (w && w.contentId && w.contentId == 'SECTION') {
            w.handleDeleteKey(e, anchor_node);
          }
        });
      }

      const df = anchor_node.querySelector('.placeholder-text');
      const intt = anchor_node.next('.item');
      if (df != null && intt != null && intt.querySelectorAll('.placeholder-text').length)  {
        intt.parentNode.removeChild(intt);
        anchor_node.addClass('item-last');
        anchor_node.innerHTML = '<br />';
      } else {
        anchor_node.addClass('item-empty');
        anchor_node.innerHTML = '<br />';
      }
      Utils.setCaretAtPosition(anchor_node);
      return false;
    } else {
      if (anchor_node.querySelectorAll('.placeholder-text').length) {
        anchor_node.addClass('item-empty');
        anchor_node.innerHTML = '<br />';
        Utils.setCaretAtPosition(anchor_node);
        return false;
      }
    }

    this.content_options.forEach( w => {
      if (w.handleDeleteKey) {
        return w.handleDeleteKey(e, parent);
      }
    });
    
  }


  if (e.which === ENTER) {
    const sel = this.elNode.querySelector('.item-selected'),
        placeholderText = sel?.querySelector('.placeholder-text');

    if (sel != null && !sel.hasClass('item-figure') && placeholderText != null) {
      sel.innerHTML = '<br />';
      sel.addClass('item-empty');
      placeholderText.parentNode.removeChild(placeholderText);
    }

    if(sel != null) {
      sel.removeClass("item-selected");
    }

    if (parent.hasClass("item-p")) {
      li = this.handleSmartList(parent, e);
      if (li) {
        anchor_node = li;
      }
    } else if (parent.hasClass("item-li")) {
      this.handleListLineBreak(parent, e);
    }

    this.content_options.forEach( w => {
      if (w.handleEnterKey) {
        return w.handleEnterKey(e, parent);
      }
    });
    
    if (e.handled) {
      return false;
    }

    if (sel.hasClass('block-grid-caption')) {
      this.handleLineBreakWith("p", parent);
      this.setRangeAtText(document.querySelector(".item-selected"));
      document.querySelector('.item-selected').dispatchEvent(new Event("mouseup"));

      return false;
    }
    
    if (parent.hasClass("item-mixtapeEmbed") || parent.hasClass("item-iframe") || parent.hasClass("item-figure")) {
      
      if ( e.target.hasClass('figure-caption') ) {
        this.handleLineBreakWith("p", parent);
        this.setRangeAtText(document.querySelector(".item-selected"));
        document.querySelector('.item-selected').dispatchEvent(new Event("mouseup"));
        return false;
      } else if (!this.isLastChar()) {
        return false;
      }
    }

    if (parent.hasClass("item-iframe") || parent.hasClass("item-figure")) {
      if (this.isLastChar()) {
        this.handleLineBreakWith("p", parent);
        this.setRangeAtText(document.querySelector(".item-selected"));
        document.querySelector('.item-selected').dispatchEvent(new Event("mouseup"));
        return false;
      } else {
        return false;
      }
    }

    if (anchor_node && this.toolbar.lineBreakReg.test(anchor_node.nodeName)) {
      if (this.isLastChar()) {
        e.preventDefault();
        this.handleLineBreakWith("p", parent);
      }
    }
    const _this = this;
    setTimeout(function() {
      const node = _this.getNode();

      if ( !node ) {
        return;
      }
      
      node.removeAttribute('name');

      _this.setElementName(node);

      if (node.nodeName.toLowerCase() === "div") {
        node = _this.replaceWith("p", node);
      }
      const pctAll = node && node.nodeType == 1 ? node.children : null;
      if(pctAll != null && pctAll.length) {
        Array.from(pctAll).forEach(pa => {
          if(pa.matches('.placeholder-text')) {
            pct.parentNode.removeChild(pct);
          }
        });
      }
      // const pct = node.querySelector('> .placeholder-text');
      // if(pct != null) {
      //   pct.parentNode.removeChild(pct);
      // }

      _this.markAsSelected(node);
      _this.setupFirstAndLast();
      
      if ( node.textContent.isEmpty() ) {
        Array.from(node.children).forEach(n => {
          n.parentNode.removeChild(n);
        });
        node.appendChild(document.createElement("br"));
        if (_this.isTouch) {
          //$node.hammer({});
        }
      }
      return _this.displayTooltipAt(_this.elNode.querySelector(".item-selected"));
    }, 15);
  }

  if (e.which === BACKSPACE) {
    
    eventHandled = false;
    this.toolbar.hide();
    anchor_node = this.getNode();

    const sel_anchor = this.selection().anchorNode;

    if (this.reachedTop) {

    }

    if(anchor_node != null && anchor_node.querySelectorAll('.placeholder-text').length) {
      e.preventDefault();
      anchor_node.addClass('item-empty');
      anchor_node.innerHTML = '<br />';
      this.skip_keyup = true;
      this.setRangeAt(anchor_node);
      return false;
    }

    if ( (this.prevented || this.reachedTop && this.isFirstChar()) && !sel_anchor.hasClass('block-background')) {
      return false;
    }

    utils_anchor_node = Utils.getNode();  

    this.content_options.forEach( w => {
      let handled;
      if (w.handleBackspaceKey && !handled) {
        return handled = w.handleBackspaceKey(e, anchor_node);
      }
    });

    if (eventHandled) {
      e.preventDefault();
      return false;
    }

    // Undo to normal quotes and dash if user immediately pressed backspace
    let existingText = this.getCharacterPrecedingCaret(), 
        existingTextLength = existingText.length,
        charAtEnd = existingText.charAt(existingText.length - 1);

    if ( UNICODE_SPECIAL_CHARS.indexOf(charAtEnd) != -1) {
      this.handleSpecialCharsBackspace(charAtEnd);
      return false;
    }

    if (parent != null && parent.hasClass("item-li") && this.getCharacterPrecedingCaret().length === 0) {
      return this.handleListBackspace(parent, e);
    }

    if (anchor_node.hasClass("item-p") && this.isFirstChar()) {
      if (anchor_node.previousElementSibling && anchor_node.previousElementSibling.hasClass("item-figure")) {
        //e.preventDefault();
        
        //return false;
      }
    }

    if ( utils_anchor_node.hasClass("main-body") || utils_anchor_node.hasClass("item-first")) {
      if ( utils_anchor_node.textContent.isEmpty() ) {
        return false;
      }
    }

    if (anchor_node && anchor_node.nodeType === 3) {

    }

    if (anchor_node.hasClass("item-mixtapeEmbed") || anchor_node.hasClass("item-iframe")) {
      if (anchor_node.textContent.isEmpty() || this.isFirstChar()) {
  
        this.inmediateDeletion = this.isSelectingAll(anchor_node);
        if (this.inmediateDeletion) {
          this.handleInmediateDeletion(anchor_node);
        }
        return false;
      }
    }

    if (anchor_node.previousElementSibling != null && anchor_node.previousElementSibling.hasClass("item-mixtapeEmbed")) {
      if (this.isFirstChar() && !anchor_node.textContent.isEmpty() ) {
        return false;
      }
    }

    if (anchor_node.hasClass("item-first")) {
      if( (anchor_node.textContent.isEmpty() || anchor_node.textContent.length == 1) && anchor_node.closest('.block-first') != null) {

        if(anchor_node.nextElementSibling && anchor_node.nextElementSibling.hasClass('item-last')) {
          anchor_node.innerHTML = '';
          return false;
        }
      }
    }

    const _this = this;
    setTimeout(function () {
      const backspacedTo = window.getSelection();
      if (backspacedTo.type == 'Caret') {
        _this.markAsSelected(backspacedTo.anchorNode);
      }
    }, 30);

  }

  if (e.which === SPACEBAR) {

    if (parent.hasClass("item-p")) {
      this.handleSmartList(parent, e);
    }
  }

  if (anchor_node) {
    if (!anchor_node.textContent.isEmpty() && anchor_node.querySelectorAll('.placeholder-text').length == 0) {
      this.hideContentBar();
      anchor_node.removeClass("item-empty");
    }
  }

  if ([UPARROW, DOWNARROW, LEFTARROW, RIGHTARROW].indexOf(e.which) != -1) {
    this.handleArrowForKeyDown(e);
  }

};


Editor.prototype.handleSpecialCharsBackspace = function (charAtEnd) {
  let anchor_node = '';
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel.type != 'Caret') { return; }
    const range = sel.getRangeAt(0);
    const commonAn = range.commonAncestorContainer;
    if (commonAn.nodeType == 3) { // its a text node
      let nv = commonAn.nodeValue;
      let toReplaceWith = '';
      if (charAtEnd == QUOTE_LEFT_UNICODE || charAtEnd == QUOTE_RIGHT_UNICODE) {
        toReplaceWith = "'";
      } else if (charAtEnd == DOUBLEQUOTE_LEFT_UNICODE || charAtEnd == DOUBLEQUOTE_RIGHT_UNICODE) {
        toReplaceWith = '"';
      } else if(charAtEnd == DASH_UNICODE) {
        toReplaceWith = "-";
      }
      let position = range.startOffset;
      if (nv.length == 1) {
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
        let nrange = document.createRange();
        let sele = sel;

        nrange.setStart(commonAn, position);
        nrange.collapse(true);
        sele.removeAllRanges();
        sele.addRange(nrange);  
      }
    }
  }

};


Editor.prototype.handleKeyUp = function(e, node) {
  let anchor_node, next_item, utils_anchor_node;
  if (this.skip_keyup) {
    this.skip_keyup = null;
    return false;
  }

  this.toolbar.hide();
  this.reachedTop = false;
  anchor_node = this.getNode();
  
  utils_anchor_node = Utils.getNode();

  this.handleTextSelection(anchor_node);
  if ([BACKSPACE, SPACEBAR, ENTER].indexOf(e.which) != -1) {
    if (anchor_node != null && anchor_node.hasClass("item-li")) {
      this.removeSpanTag(anchor_node);
    }
  }

  if ([LEFTARROW, UPARROW, RIGHTARROW, DOWNARROW].indexOf(e.which) != -1) {
    return this.handleArrow(e);
  }

  if (e.which === BACKSPACE) {
    if (utils_anchor_node.hasClass("article-body")) {

      this.handleCompleteDeletion(this.elNode);
      if (this.completeDeletion) {
        this.completeDeletion = false;
        return false;
      }
    }
    if (utils_anchor_node.hasClass("main-body") || utils_anchor_node.hasClass("item-first")) {

      if ( utils_anchor_node.textContent.isEmpty() ) {
        next_item = utils_anchor_node.next(".item");
        if (next_item) {
          this.setRangeAt(next_item);
          utils_anchor_node.parentNode.removeChild(utils_anchor_node);
          this.setupFirstAndLast();
        } else {
          const cont = utils_anchor_node.closest('.with-background');
          if (cont != null && cont.next('.block-content') != null) {
            const nxtSection = cont.next('.block-content');
            const item = nxtSection != null ? nxtSection.querySelector('.item') : null;
            if (item != null) {
              this.setRangeAt(item);
            }
            cont.parentNode.removeChild(cont);
            this.fixSectionClasses();
            this.setupFirstAndLast();
          } else if(cont != null && cont.next('.block-content') != null) {
            const havePrev = cont.prev('.block-content');
            if (havePrev != null) {
              const items = nxtSection.querySelectorAll('.item');
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
              this.handleCompleteDeletion(utils_anchor_node);
            }
          }
        }
        return false;
      }
    }

    if (!anchor_node) {
      this.handleNullAnchor();
      return false;
    }

    if (anchor_node.hasClass("item-first")) {
      if (this.getSelectedText() === this.getNode().textContent) {
        this.getNode().innerHTML = "<br>";
      }
      this.markAsSelected(anchor_node);
      this.setupFirstAndLast();
      return false;
    }

    if (anchor_node.hasClass("item-last")) {
      if( anchor_node.textContent.isEmpty() && anchor_node.closest('.block-first') != null) {
        if(anchor_node.previousElementSibling && anchor_node.previousElementSibling.hasClass('item-first')) {
          Utils.stopEvent(e);
          anchor_node.innerHTML = this.templates.subtitle_placeholder;
          return false;
        }
      }
    }

    if (anchor_node.hasClass("item-first")) {
      if(anchor_node.textContent.isEmpty() && anchor_node.closest('.block-first') != null) { 
  
        if(anchor_node.nextElementSibling && anchor_node.nextElementSibling.hasClass('item-last')) {
          Utils.stopEvent(e);
          anchor_node.innerHTML = this.templates.title_placeholder;
          return false;
        }
      }
    }
  }
  
  let tg = e.target;
  if (tg.nodeName && tg.nodeName.toLowerCase() == 'figcaption') {
    if ( tg.textContent.isEmpty() ) {
      if (tg.hasClass('block-grid-caption')) {
        tg.closest('.block-grid')?.addClass('item-text-default');
      } else {
          tg.closest('.item-figure')?.addClass('item-text-default');
      }
    } else {
      if (tg.hasClass('block-grid-caption')) {
        tg.closest('.block-grid')?.removeClass('item-text-default');
      } else {
        tg.closest('.item-figure')?.removeClass('item-text-default');
      }
    }
  }

  if (e.which == BACKSPACE && tg.hasClass('figure-caption')) {
    const caption = e.target, text = caption.textContent;
    if( text.killWhiteSpace().isEmpty() || (text.length == 1 && text == " ")) {
      if (!caption.attr('data-placeholder-value')) {
        caption.attr('data-placeholder-value', 'Type caption for image(Optional)');
      }
      caption.appendChild(Utils.generateElement(`<span class="placeholder-text">${caption.attr('data-placeholder-value')}</span>`));
      if(caption.closest('.item-figure') != null) {
        caption.closest('.item-figure').addClass('item-text-default');
      }
    }
  }
};

/** image drag and drop **/
Editor.prototype.__positionsCache = [];
Editor.prototype.createElementPositionsCache = function () {
  if (this.__positionsCache.length == 0) {
    const nodes = this.elNode.querySelectorAll('.item');
    const cache = [];
    for (let i = 0; i < nodes.length; i = i + 1) {
      const it = nodes[i];
      const o = it.getBoundingClientRect();
      cache.push([it.attr('name') ,o.top + it.height, o.left]);
    }
    cache.sort(function(a, b) {return a[1] - b[1]})
    this.__positionsCache = cache;
  }
};

Editor.prototype.generatePlaceholderForDrop = function(position) {
  let i = 0, cache = this.__positionsCache, len = cache.length;
  for (; i < len; i = i + 1) {
    if (cache[i][1] > position) {
      break;
    }
  }
  let item = i > 0 ? cache[i - 1] : cache[0];
  if(item) {
    let already = document.querySelector('#drag_pc_' + item);
    if (!already) {
      const dp = document.querySelector('.drop-placeholder');
      dp.parentNode.remove(dp);
      const o = `<div class="drop-placeholder" id="drag_pc_${item}"></div>`;
      Utils.generateElement(o).insertAfter( document.querySelector('[name="' + item + '"]'));
    }  
  }
};


Editor.prototype.handleDragEnter = function (e) {
  e.stopPropagation();
  this.createElementPositionsCache();
};

Editor.prototype.handleDragExit = function(e) {
  e.stopPropagation();
}

Editor.prototype.handleDragEnd = function (e) {
  e.stopPropagation();
  this.__positionsCache = {};
};

Editor.prototype.handleDrag = function (e) {
  e.stopPropagation();
  e.preventDefault();
  this.generatePlaceholderForDrop(e.pageY);
};

Editor.prototype.handleDrop = function (e) {
  e.stopPropagation();
  e.preventDefault();
  let dragItem = e.dataTransfer;
  let files = dragItem.files;
  let haveUploads = false;
  if (!files || files.length == 0) {
    this.image_uploader.uploadFiles(files, true);
    haveUploads = true;
  } else {
    const html = dragItem.getData('text/html');
    if (html != '') {
      const placeholder = this.elNode.querySelector('.drop-placeholder');
      const m = placeholder.next('.item');
      //FIXME check for isngle item
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

Editor.prototype.handleLineBreakWith = function(etype, from_element) {
  let new_paragraph = Utils.generateElement(this.templates.singleItemTemplate(etype));

  if (from_element.hasClass('block-grid-caption')) {
    from_element.closest('.block-grid')?.insertAdjacentElement('afterend', new_paragraph)
  } else if (from_element.parentNode.matches('[class^="item-"]')) {
    from_element.parentNode.insertAdjacentElement('afterend', new_paragraph);
  } else {
    from_element.insertAdjacentElement('afterend', new_paragraph);
  }
  this.setRangeAt(new_paragraph);
  return this.scrollTo(new_paragraph);
};

Editor.prototype.replaceWith = function(etype, from_element) {
  const new_paragraph = Utils.generateElement(this.templates.singleItemTemplate(etype));
  from_element.replaceWith(new_paragraph);
  this.setRangeAt(new_paragraph);
  this.scrollTo(new_paragraph);
  return new_paragraph;
};

// EVENT LISTENERS END //

Editor.prototype.findNextFocusableElement = function (current_node) {
  let inner, cont, crossing_section = false,
    next_node;
  
  if (current_node.hasClass('item-li')) {
    let list = current_node.closest('.postList');
    if (list.nextElementSibling != null) {
      next_node = list.nextElementSibling;
    }
  }

  if (!next_node) {
    if (current_node.hasClass('figure-in-row')) {
        let row = current_node.closest('.block-grid-row');
        let nextRow = row != null ? row.nextElementSibling : null;

        if (nextRow != null && !nextRow.hasClass('block-grid-caption')) {
          next_node = nextRow.querySelector('.item-figure:first-child');
        } else if (nextRow != null && nextRow.hasClass('block-grid-caption')) {
          next_node = nextRow;
        }

    } else {
      inner = current_node.closest('.block-content-inner');
      cont = inner != null ? inner.nextElementSibling : null;
      if (cont.hasClass('block-grid')) {
        next_node = cont.querySelector('.block-grid-row:first-child .item:first-child');
      } else if (cont != null) {
        next_node = cont.querySelector('.item:first-child');
      } else { // probably a new section below then
        let section = inner.closest('section'),
            next_section = section != null ? section.nextElementSibling : null;
        if (next_section != null) {
          cont = next_section.querySelector('.main-body .block-content-inner:first-child');
          if (cont != null) {
            next_node = cont.querySelector('.item:first-child');
            crossing_section = true;
          }
        }
      }  
    }
  }
  
  return {node: next_node, section_crossed: crossing_section};
};

Editor.prototype.findPreviousFocusableElement = function(current_node) {
  let cont = current_node.closest('.block-content-inner');
    cont = cont != null ? cont.previousElementSibling : null;
  let prev_node, crossing_section = false;

  if (current_node.hasClass('figure-in-row')) {
    let cr = current_node.closest('.block-grid');
    let first = cr != null ? cr.querySelector('.block-grid-row:first-child .figure-in-row:first-child') : null;

    if (first != null && first == current_node) {
      let pr = cr.previousElementSibling;
      if (pr != null && !pr.hasClass('block-grid')) {
        prev_node = pr.querySelector('> .item:last-child');
      } else if(pr && pr.hasClass('block-grid')) {
        let lastCap = pr.querySelector('.block-grid-caption');
        prev_node = lastCap;
      }
    }
  }

  if (!prev_node) {
    if (cont.length && cont.hasClass('block-grid')) {
      let caption = cont.querySelector('.block-grid-caption');
      prev_node = caption;
    } else {
      if (cont != null) {
        prev_node = cont.querySelector('.item:last-child');
      } else {
        let section = current_node.closest('section'), 
          prev_section = section != null ? section.previousElementSibling : null;

        if (prev_section != null) {
          cont = prev_section.querySelector('.main-body .block-content-inner:last-child');
          if (cont != null) {
            prev_node = cont.querySelector('.item:last-child');
            crossing_section = true;
          }
        }
      }
    }  
  }
  return {node: prev_node, section_crossed: crossing_section};
};


Editor.prototype.moveFigureUp = function (figure) {
  let prev = figure.previousElementSibling;
  let toGrid = false;

  if (prev != null) {
    if (prev.hasClass('item')) {
      figure.insertBefore(prev);
    }
  } else if(figure.hasClass('figure-full-width')) {

  } else {
    const column = figure.closest('.block-content-inner');
    const prevColumn = column.prev('.block-content-inner');
    if (prevColumn != null) {
      if (prevColumn.hasClass('block-grid')) {
        this.moveFigureInsideGrid(figure, nextColumn, false);
        toGrid = true;
      } else if (prevColumn.hasClass('center-column')) {
        prevColumn.appendChild(figure);
      } else if (prevColumn.hasClass('full-width-column')) {
        let prevBeforeFW = prevColumn.previousElementSibling;
        if (prevBeforeFW != null) {
          if (prevBeforeFW.hasClass('center-column')) {
            prevBeforeFW.appendChild(figure);
          } else if(prevBeforeFW.hasClass('full-width-column') || prevBeforeFW.hasClass('block-grid')) {
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


Editor.prototype.moveFigureDown = function (figure) {
  let next = figure.nextElementSibling, toGrid = false;
  figure.removeClass('figure-in-row');

  if (next != null) {
    if (next.hasClass('item')) {
      figure.insertAfter(next);
    }
  } else if (figure.hasClass('figure-full-width')) { // full width image.. find next container
    
  } else { // figure is first item in the column
    const column = figure.closest('.block-content-inner');
    const nextColumn = column != null ? column.next('.block-content-inner') : null;
    if (nextColumn != null) {
      if (nextColumn.hasClass('block-grid')) { // next item is grid, add image to the grid
        this.moveFigureInsideGrid(figure, nextColumn, true);
        toGrid = true;
      } else if (nextColumn.hasClass('center-column')) {  // next is text based center clumn.. prepend item there..
        nextColumn.insertBefore(figure, nextColumn.firstChild);
      } else if (nextColumn.hasClass('full-width-column')) { //next is full width image..move image to next column after that..
        const nextAfterFW = nextColumn.nextElementSibling;
        if (nextAfterFW != null) { // we have something after next column
          if (nextAfterFW.hasClass('center-column')) { // its centered column
            nextAfterFW.insertBefore(figure, nextAfterFW.firstChild);
            //Utils.prependNode(figure, nextAfterFW);
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


Editor.prototype.moveFigureInsideGrid = function (figure, grid, firstItem) {
  if (firstItem) {
    const row = grid.querySelector('.block-grid-row:first-child');

    figure.addClass('figure-in-row');
    Utils.prependNode(figure, row);

    const figures = row.querySelectorAll('.item-figure');

    this.streamer.notifySubscribers('Katana.Images.Restructure', {
      container: row,
      count: figures.length,
      figures: figures
    })

  } else {
    const row = grid.querySelector('.block-grid-row:last-child');
    figure.addClass('figure-in-row');
    row.appendChild(figure);

    const figures = row.querySelectorAll('.item-figure');

    this.streamer.notifySubscribers('Katana.Images.Restructure', {
      container: row,
      count: figures.length,
      figures: figures
    });

  }
};

Editor.prototype.pushCenterColumn = function (place, before) {
  const div = Utils.generateElement(`<div class="center-column block-content-inner"></div>`);
  if(before) {
    place.insertAdjacentElement('beforebegin', div);
  } else {
    place.insertAdjacentElement('afterend', div);
  }
  return div;
}

Editor.prototype.addClassesToElement = function(element, forceKlass) {
  let n, name, new_el;
  n = element;

  let fK = typeof forceKlass != 'undefined' ? forceKlass : false;

  name = n.nodeName.toLowerCase();

  if (name == 'blockquote') {
    n.removeClass('text-center');
  } else {
    n.removeClass('text-center');
    n.removeClass('pullquote');
  }

  let hasEmpty = false;
  if (n.hasClass('item-empty')) {
    hasEmpty = true;
  }
  name = name == "a" ? "anchor" : name;

  switch (name) {
    case "p":
    case "pre":
      n.removeAttribute('class');
      n.addClass("item item-" + name);

      if(fK) {
        n.addClass(forceKlass);
      }

      if (name === "p" && n.querySelectorAll("br").length === 0) {
        n.appendChild(document.createElement("br"));
      }
    break;
    case "div":
      if (n.hasClass('block-grid-row')) {

      } else if (!n.hasClass("item-mixtapeEmbed")) {
        n.removeAttribute('class');
        n.addClass("item item-" + name);
      }
      break;
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      if (name === "h1") {
        new_el = Utils.generateElement(`<h2 class='item item-h2'>${n.textContent}</h2>`);
        n.parentNode.replaceChild(new_el, n);

        this.setElementName(n);
      } else {
        n.removeAttribute('class');
        n.addClass("item item-" + name);
      }

      if(fK) {
        n.addClass(forceKlass);
      }

      break;
    case "code":
      n.removeAttribute('class');
      n.unwrap().wrap(`<p class='item item-pre'></p>`);
      n = n.parentNode;
      break;
    case "ol":
    case "ul":
      n.removeAttribute('class');
      n.addClass("postList");

      n.querySelectorAll('li').forEach( li => {
        li.removeAttribute('class');
        li.addClass('item item-li');
      })

      break;
    case "img":
      this.image_uploader.uploadExistentImage(n);
      break;
    case "anchor":
    case "a":
    case 'strong':
    case 'em':
    case 'br':
    case 'b':
    case 'u':
    case 'i':
      n.removeAttribute('class');
      n.addClass('markup-' + name);
      if(n.closest('.item') == null) {
        n.wrap(`<p class='item item-p'></p>`);
      }
      n = n.parentNode;
      break;  
    case "blockquote":
      if (n.hasClass('pullquote')) {
        fK = 'pullquote';
      };
      if (n.hasClass('with-cite')) {
        fK = fK + ' with-cite';
      }
      n.removeAttribute('class');
      n.addClass('item item-' + name);
      if(fK) {
        n.addClass(fK);
      }
      break;
    case "figure":
      if (n.hasClass("item-figure")) {
        n = n;
      }
      break;
    case "figcaption":
      if (n.hasClass('block-grid-caption') || n.hasClass('figure-caption')) {
        n = n;
      }
    break;
    default:
      n.wrap(`<p class='item item-${name}'></p>`);
      n = n.parentNode;
  }

  if (['figure', 'img', 'iframe', 'ul', 'ol'].indexOf(name) == -1) {
    /*const n = n;
    n.html(n.html().replace(/&nbsp;/g, ' ')); */
  }
  if (hasEmpty) {
    n.addClass('item-empty');
  }

  return n;
};

Editor.prototype.addHammer = function (element) {
  if (this.isTouch) {
    // $(element).hammer({});
  }
};

Editor.prototype.setupElementsClasses = function(element, cb) {
  if (!element) {
    this.element = this.elNode.querySelectorAll('.block-content-inner');
  } else {
    this.element = typeof element['length'] == 'undefined' ? [element] : element;
  }
  const _this = this;
  setTimeout(() => {
      _this.cleanContents(_this.element);
      _this.wrapTextNodes(_this.element);

      let ecC = [];
      let allAs = [];
      _this.element.forEach(elcc => {
        let cc = elcc.children ? Array.from(elcc.children) : [];
        ecC = ecC.concat(cc);
        let aas = elcc.querySelectorAll('a');
        if(aas.length) {
          aas = Array.from(aas);
          allAs = allAs.concat(aas);
        }
      });

      ecC.forEach( (n) => {
        _this.addClassesToElement(n);
        _this.setElementName(n);
      });

      _this.setupLinks( allAs );
      _this.setupFirstAndLast();
      return cb();
  }, 20);

};

Editor.prototype.cleanContents = function(element) {
  let elm;
  if (!element) {
    elm = this.elNode.querySelectorAll('.block-content-inner');
  } else {
    elm = typeof element['length'] == 'undefined' ? [element] : element;
  }
  clean.it(elm);
};

Editor.prototype.wrapTextNodes = function(element) {
  if (!element) {
    element = this.elNode.querySelectorAll('.block-content-inner');
  } else {
    element = element;
  }
  let ecChildren = [];
  element.forEach( (elm) => {
    let elmc = elm.children ? Array.from(elm.children) : [];
    ecChildren = ecChildren.concat(elmc);
  });

  const ecw = ecChildren.filter( (item) => {
    const ii = item;
    if(ii.nodeType === 3) {
      const ht = ii.innerHTML;
      if(ht.trim().length > 0) {
        return true;
      }
    }
    return false;
  });

  Utils.arrayToNodelist(ecw).wrap("<p class='item item-p'></p>");
};

Editor.prototype.setElementName = function(element) {
  let el = element;
  if (el.tagName == 'LI') {
    return el.attr('name', Utils.generateId());
  }
  if (!el.matches('[name]')) {
    if(el.tagName == 'UL') {
      const elChilds = Array.prototype.filter.call(el.children, e => {
        return e.tagName === 'LI';
      });

      let lis = elChilds; //el.querySelectorAll(' > li');
      lis.forEach( item => {
        const li = item;
        if(!li.matches('[name]')) {
          li.attr('name', Utils.generateId());
        }
      });
    }
    return el.attr("name", Utils.generateId());
  }
};


Editor.prototype.handleSmartList = function(item, e) {
  let li, chars, match, regex;

  chars = this.getCharacterPrecedingCaret();
  match = chars.match(/^\s*(\-|\*)\s*$/);
  if (match) {
    e.preventDefault();
    regex = new RegExp(/\s*(\-|\*)\s*/);
    li = this.listify(item, "ul", regex, match);
  } else {
    match = chars.match(/^\s*[1aAiI](\.|\))\s*$/);
    if (match) {
      e.preventDefault();
      regex = new RegExp(/\s*[1aAiI](\.|\))\s*/);
      li = this.listify(item, "ol", regex, match);
    }
  }
  return li;
};

Editor.prototype.handleListLineBreak = function(li, e) {
  let list, paragraph, content;
  this.hideContentBar();
  list = li.parentNode;

  paragraph = document.createElement('p');

  if (list.children != null && list.children.length === 1 && li.textContent.trim() === "") {
    this.replaceWith("p", list);
  } else if (li.textContent.trim() === "" && (li.nextElementSibling !== null)) {
    e.preventDefault();
  } else if (li.nextElementSibling !== null) {
    if (li.textContent.isEmpty()) {
      e.preventDefault();          
      paragraph.parentNode.insertBefore(list, paragraph.nextElementSibling);

      // list.after(paragraph);
      li.addClass("item-removed");
      li.parentNode.removeChild(li);
    } else if (li.previousElementSibling !== null && li.previousElementSibling.textContent.trim() === "" && this.getCharacterPrecedingCaret() === "") {
      e.preventDefault();

      content = li.innerHTML;
      paragraph.parentNode.insertBefore(list, paragraph.nextElementSibling);
      // list.after(paragraph);
      if(li.previousElementSibling) {
        li.previousElementSibling.parentNode.removeChild(li.previousElementSibling);
      }
      li.addClass("item-removed");
      li.parentNode.removeChild(li);
      paragraph.innerHTML = content;
    }
  }

  if (list && list.children.length === 0) {
    list.parentNode.removeChild(list);
  }

  if (li.hasClass("item-removed")) {
    this.addClassesToElement(paragraph);
    this.setRangeAt(paragraph);
    this.markAsSelected(paragraph);
    return this.scrollTo(paragraph);
  }
};

Editor.prototype.listify = function(paragraph, listType, regex, match) {
  let li, list, content;
  this.removeSpanTag(paragraph);

  content = paragraph.innerHTML.replace(/&nbsp;/g, " ").replace(regex, "");
  const type = match[0].charAt(0);
  switch (listType) {
    case "ul":
      list = document.createElement('ul');
      break;
    case "ol":
      list = document.createElement('ol');
      break;
    default:
      return false;
  }
  
  this.addClassesToElement(list);
  this.replaceWith("li", paragraph);

  if (type != 1) {
    list.addClass('postList--' + type);
    list.attr('type', type);
  }

  li = document.querySelector(".item-selected");
  if(li != null) {
    this.setElementName(li);
    li.innerHTML = content;
    if(li.children != null && li.children.length > 0) {
      li.children.wrap(list);
    } else {
      li.wrap(list);
    }
    if (li.querySelectorAll("br").length === 0) {
      li.appendChild(document.createElement("br"));
    }
    this.setRangeAt(li);
  }
  return li;
};


Editor.prototype.handleListBackspace = function(li, e) {
  let list, paragraph, content;
  list = li.parentNode;
  liPr = li.parentNode.tagName.toLowerCase();
  if(liPr != 'ul' && liPr != 'ol') {
    return;
  }
  if(li.previousElementSibling != null) {
    e.preventDefault();
    list.insertBefore(li);
    content = li.innerHTML;
    this.replaceWith("p", li);
    paragraph = document.querySelector(".item-selected");
    if(paragraph != null) {
      paragraph.removeClass("item-empty");
      paragraph.innerHTML = content;
    }
    if (list.children != null && list.children.length == 0) {
      list.parentNode.removeChild(list);
    }
    return this.setupFirstAndLast();
  }
};


Editor.prototype.removeSpanTag = function(item) {
  item.querySelectorAll("span").forEach((sp) => {
    if(!sp.hasClass('placeholder-text')) {
      if(sp.children != null) {
        const content = Array.from(sp.children);
        content.forEach(cn => {
          sp.parentNode.insertBefore(cn, sp);
        });
        sp.parentNode.removeChild(sp);
      }
    }
  });
  return item;
};


Editor.prototype.handleInmediateDeletion = function(element) {
  this.inmediateDeletion = false;
  let new_node = Utils.generateElement(this.templates.baseParagraphTmpl()).insertBefore(element);
  new_node.addClass("item-selected");
  this.setRangeAt( element.previousElementSibling );
  return element.parentNode.removeChild(element);
};

Editor.prototype.handleUnwrappedNode = function(element) {
  let new_node, tmpl;
  tmpl = Utils.generateElement(this.templates.baseParagraphTmpl());
  this.setElementName(tmpl);
  element.wrap(tmpl);
  new_node = document.querySelector("[name='" + (tmpl.attr('name')) + "']");
  new_node.addClass("item-selected");
  this.setRangeAt(new_node);
  return false;
};

/*
This is a rare hack only for FF (I hope),
when there is no range it creates a new element as a placeholder,
then finds previous element from that placeholder,
then it focus the prev and removes the placeholder.
a nasty nasty one...
  */

Editor.prototype.handleNullAnchor = function() {
  let node, num, prev, range, sel, span;
  sel = this.selection();

  if (sel.isCollapsed && sel.rangeCount > 0) {
    if ( sel.anchorNode.hasClass('block-background') ) {
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

    if (prev != null && prev.hasClass("item")) {
      this.setRangeAt(prev, num);
      node.parentNode.removeChild(node);
      this.markAsSelected(this.getNode());
    } else if (prev != null && prev.hasClass("item-mixtapeEmbed")) {
      this.setRangeAt(prev, num);
      node.parentNode.removeChild();
      this.markAsSelected(this.getNode());
    } else if (!prev) {
      this.setRangeAt(this.elNode.querySelector(".block-content-inner p"));
    }
    return this.displayTooltipAt(this.elNode.querySelector(".item-selected"));
  }
};

Editor.prototype.handleCompleteDeletion = function(element) {
  if(element.textContent.isEmpty()) {
    this.selection().removeAllRanges();
    this.render();
    const _this = this;
    setTimeout( () => {
      _this.setRangeAt( _this.elNode.querySelector('.block-content-inner p') );
    }, 20);
    this.completeDeletion = true;
    return ;
  }
};

// Anchor tooltip //
Editor.prototype.displayPopOver = function(ev, matched) {
  return this.tooltip.displayAt(ev, matched);
};

Editor.prototype.hidePopOver = function(ev, matched) {
  return this.tooltip.hide(ev, matched);
};
// Anchor tooltip ends //

// Image toolbar related  //
Editor.prototype.displayImageToolbar = function () {
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

Editor.prototype.relocateImageToolbar = function (position) {
  if(position == null) {
    return;
  }
  let height, left, padd, top, scrollTop;
  const ebr = this.image_toolbar.elNode.getBoundingClientRect();

  height = ebr.height;      
  padd = ebr.width / 2;
  top = position.top - height + document.body.scrollTop;
  left = position.left + (position.width / 2) - padd;
  scrollTop = window.pageYOffset;

  if (scrollTop > top) {
    top = scrollTop;
  }
  const cst = this.image_toolbar.elNode.style;
  cst.left = left;
  cst.top = top;
  cst.position = 'absolute';
};

Editor.prototype.selectFigure = function (figure) {
  if(!figure) {
    return;
  }
  
  if (this.image_toolbar) {
    this.image_toolbar.hide();
  }

  this.elNode.querySelectorAll(".figure-focused").forEach(el => el.removeClass("figure-focused"));

  if (figure.hasClass('with-background')) {
    figure.addClass('figure-focused');
    this.displayImageToolbar();
    const item = figure.querySelector('.item');
    if (item != null) {
      Utils.setCaretAtPosition(item, 0);
      item.focus();
      return;
    }
  } else {
    this.markAsSelected(figure.querySelector('.padding-cont'));
    figure.addClass('figure-focused item-selected');
    const bg = figure.closest(".block-grid")?.addClass('figure-focused');
    this.selection().removeAllRanges();
    this.displayImageToolbar();  
  }

  if (figure.hasClass('figure-in-row')) {
    figure.closest('.block-content-inner')?.addClass('figure-focused grid-focused');
  }

  figure.focus();
};

Editor.prototype.handleGrafFigureSelectImg = function (ev, matched) {
  let text = this.getSelectedText();
  if (text && text.killWhiteSpace().length > 0) {
    return false;
  }

  const element = matched ? matched : ev.currentTarget;
  const sec = element.closest('.with-background');
  if (sec != null) {
    this.selectFigure(sec);
  } else {
    this.selectFigure(element.closest('.item-figure'));  
  }
  
  if (this.mode == 'write' || this.mode == 'read') {
    //ev.preventDefault();
    return false;
  }
};

Editor.prototype.handleGrafFigureTypeCaption = function(ev) {
  let element = ev.currentTarget,
      text = element.textContent,
      figure = element.closest('figure');

  if(figure != null) {
    if(!text || text.isEmpty()) {
      figure.addClass('item-text-default');
    } else {
      figure.removeClass('item-text-default');
    }
  }
  return;
};

Editor.prototype.handleFigureAnchorClick = function (ev, matched) {
  ev.preventDefault();
  return false;
};

Editor.prototype.handleKeyDownOnFigure = function (ev, figure) {
  const keyCode = ev.keyCode;
  if (!this.image_toolbar) {
    return;
  }
  switch(keyCode) {
    case LEFTARROW:
      this.image_toolbar.commandPositionSwitch('left', figure);
      ev.preventDefault();
      return false;
    break;
    case RIGHTARROW:
      this.image_toolbar.commandPositionSwitch('right', figure);
      ev.preventDefault();
      return false;
    break;
    case UPARROW:
      ev.preventDefault();
      this.image_toolbar.commandPositionSwitch('up', figure);
      return false;
    break;
    case DOWNARROW:
      ev.preventDefault();
      this.image_toolbar.commandPositionSwitch('down', figure);
      return false;
    break;
    case ENTER:
    break;
  }
};

Editor.prototype.handleImageActionClick = function (ev, matched) {
  const tg = matched ? matched : ev.currentTarget,
    action = tg.attr('data-action'),
    figure = tg.closest('figure');

  Utils.stopEvent(ev);
  
  switch(action) {
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
    case 'addpic':
      const row = figure.closest('.block-grid-row');
      if (row != null) {
        this.streamer.notifySubscribers('Katana.Images.Add', {row})
      } else {
        this.streamer.notifySubscribers('Katana.Images.Add', {figure})
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

Editor.prototype.embedIFrameForPlayback = function (ev) {
  const elem = ev.target,
      frameContainer = elem.closest('.iframeContainer'),
      image = frameContainer?.querySelector('[data-frame-url]');
  if (image != null) {
    const frameUrl = image.attr('data-frame-url') + '&autoplay=1';
    const iframe = Utils.generateElement('<iframe src="' + frameUrl + '"></iframe>');
    image.parentNode.replaceChild(iframe, image);
    frameContainer.addClass('hide-controls');
  }
};

// Image toolbar related ends //

/** 
* after image/embeds layout manipulation, we may end up with lots of linear same layouts
* function merges them together
*/
Editor.prototype.mergeInnerSections = function (section) {
  let _this = this;
  let merge = function() {
    const inners = section.querySelectorAll('.block-content-inner');
    if(inners.length) {
      for(let i = 0; i < inners.length; i = i + 1) {
        const curr = inners[i],
            k = i + 1,
            next = typeof inners[k] != 'undefined' ? inners[k] : false;
        if (next) {
          if(next.querySelectorAll('.item').length == 0) {
            next.parentNode.removeChild(next);
            return merge();
          }
          if (!curr.hasClass('block-grid') && Utils.elementsHaveSameClasses(curr, next)) {
            next.querySelectorAll('.item').forEach(elm => {
              curr.appendChild(elm);
            });
            _this.setupFirstAndLast();
            next.parentNode.removeChild(next);
            return merge();
          }
        }
      }
    }
  };
  merge(0);
};

Editor.prototype.cleanUpInnerSections = function () {
  const inners = this.elNode.querySelectorAll('.block-content-inner');
  for( let i = 0; i < inners.length; i = i + 1) {
    const curr = inners[i];
    if (curr.querySelectorAll('.item').length == 0) {
      curr.parentNode.removeChild(curr);
    }
  }

  const blockGrid = this.elNode.querySelectorAll('.block-grid');
  for (let i = 0; i < blockGrid.length; i = i + 1) {
    const curr = blockGrid[i];
    if (curr.querySelectorAll('.item-figure').length == 0 ) {
      curr.parentNode.removeChild(curr);
    }
  }

  const blockRows = this.elNode.querySelectorAll('.block-grid-row');
  for (let i = 0; i < blockRows.length; i = i + 1) {
    const curr = blockRows[i];
    if (curr.querySelectorAll('.item-figure').length == 0 ) {
      curr.parentNode.removeChild(curr);
    }
  }      
};

Editor.prototype.fixSectionClasses = function () {
  this.elNode.querySelectorAll('section').forEach(el => { 
    el.removeClass('block-first');
    el.removeClass('block-last');
  });
  const fc = this.elNode.querySelector('section:first-child');
  if(fc != null) {
    fc.addClass('block-first');
  }
  const lc = this.elNode.querySelector('section:last-child');
  if(lc != null) {
    lc.addClass('block-last');
  }
};

Editor.prototype.refreshStoriesMenus = function (val) {
  if (val == '') {
    return;
  }
  let toAdd = null;
  if (val == 'featured') {
    const menu = this.templates.menuOpts[0];
    toAdd = document.createElement('option');
    toAdd.value = menu[0];
    toAdd.text = menu[1];
  } else if(val == 'latest') {
    const menu = this.templates.menuOpts[1];
    toAdd = document.createElement('option');
    toAdd.value = menu[0];
    toAdd.text = menu[1];
  }

  const stfors = this.elNode.querySelectorAll('.block-stories [data-for="storytype"]');
  if (stfors.length) {
    for (let i = 0; i < stfors.length; i = i + 1) {
      const stf = stfors[i];
      if(toAdd != null) {
        stf.appendChild(toAdd);
      }
    }
  }
};


Editor.prototype.removeUnnecessarySections = function () {
  const sects = this.elNode.querySelectorAll('section');
  for (let i = 0; i < sects.length; i = i + 1) {
    const sec = sects[i];
    if (sec.querySelectorAll('.item').length == 0) {
      sec.parentNode.removeChild(sec);
    }
  }
  this.parallaxCandidateChanged();
};


Editor.prototype.mergeWithUpperSection = function (curr) {
  const upper = curr.prev('.block-content');
  if (upper != null) {
    const mb = upper.querySelector('.main-body');
    if(mb != null) {
      const cmb = curr.querySelector('.main-body > .block-content-inner');
      mb.appendChild(cmb);
    }
    curr.parentNode.removeChild(curr);
    this.mergeInnerSections(upper);
    let newLast = upper.querySelector('.item:last-child');
    if(newLast != null) {
      this.markAsSelected(newLast);
    }
  }
  this.parallaxCandidateChanged();
};


Editor.prototype.splitContainer = function (atNode, insrtSection, carryContent) {
  let currContainer = atNode.closest('.block-content'),
      currInner  = atNode.closest('.block-content-inner'),
      insertAfterContainer,
      newContainer,
      newInner,
      carry = carryContent ? true : carryContent,
      insertSection = typeof insrtSection == 'undefined' || insrtSection == null ? Utils.generateElement(this.templates.getSingleSectionTemplate()) : insrtSection,
      carryContainer = false;

  if (!carry) {
    newContainer = insertSection;
    newContainer.insertAfter(currContainer);
    carryContainer = Utils.generateElement(this.templates.getSingleSectionTemplate());
    carryContainer.insertAfter(newContainer);
    newContainer = carryContainer;
    insertAfterContainer = carryContainer;
  }else {
    newContainer = insertSection;
    insertAfterContainer = currContainer;
  }

  newInner = newContainer.querySelector('.main-body');

  if(currInner != null) {
    while (currInner.nextElementSibling != null) {
      newInner.appendChild(currInner.nextElementSibling);
    }
  }

  const splittedLayout = Utils.generateElement(this.templates.getSingleLayoutTemplate());
  splittedLayout.attr('class', currInner.attr('class'));

  while (atNode.nextElementSibling != null) {
    splittedLayout.appendChild(atNode.nextElementSibling);
  }

  splittedLayout.insertBefore(atNode, splittedLayout.firstChild);
  newInner.insertBefore(splittedLayout, newInner.firstChild);
  
  newContainer.insertAfter(insertAfterContainer);

  this.removeUnnecessarySections();
  this.fixSectionClasses();
};


Editor.prototype.appendTextSection = function () {
  const sec = Utils.generateElement(this.templates.getSingleSectionTemplate());
  const mb = sec.querySelector('.main-body');
  if(mb != null) {
    const mbs = this.templates.singleColumnPara("item-empty");
    mb.appendChild(Utils.generateElement(mbs));
  }
  this.elNode.appendChild(sec);
};

Editor.prototype.parallaxImages = [];

// canvas scrolling related stuff
Editor.prototype.parallaxCandidateChanged = function () {

  let sects = this.elNode.querySelectorAll('.image-in-background'),
      scrolling,
      _this = this,
      parallaxRect = this.parallax.getBoundingClientRect();

  if (this.parallaxContext && sects.length) {
    sects.forEach(se => {
      se.addClass('talking-to-canvas').removeClass('talk-to-canvas');
    });
  }

  this.parallaxImages = [];
  this.sectionsForParallax = sects;

  for (let i = 0; i < sects.length;i = i + 1) {
    const item = sects[i];
    const bg = item.querySelector('.block-background-image');
    if(bg != null) {
      // const styles = getComputedStyle(bg);
      let path = Utils.getStyle(bg, 'backgroundImage'); // styles.getPropertyValue('background-image');
      path = /^url\((['"]?)(.*)\1\)$/.exec(path);
      path = path ? path[2] : '';
      if (path != '') {
        const img = new Image();
        img.src = path;
        this.parallaxImages.push(img);  
      }
    }
  }

  scrolling = function() {
    _this.checkViewPortForCanvas();
  };

  if (sects != null && sects.length) {
    Utils.unregisterFromScroll('katana', scrolling);
    Utils.registerForScroll('katana', scrolling);
    this.checkViewPortForCanvas();
  }else if(!sects.length) {
    this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
    Utils.unregisterFromScroll('katana', scrolling);
  }
};

Editor.prototype.calculatePosition = function (img, sect) {
  let iratio = img.naturalWidth / img.naturalHeight,
      sectionRect = sect.getBoundingClientRect(),
      sectionWidth = sectionRect.width,
      sectionHeight = sectionRect.height,
      sectionBottom = sectionRect.bottom,
      parallaxRect = this.parallax.getBoundingClientRect(),
      canvasHeight = parallaxRect.height,
      scaledImageWidth = sectionWidth,
      scaledImageHeight = scaledImageWidth / iratio;

  let padding = 50, singlePad = padding / 2;

  let iX, iY, iWidth, iHeight, cX, cY, cWidth, cHeight;
  
  if (sectionHeight > (scaledImageHeight - padding)) {
    let delta = sectionHeight - canvasHeight,
        buffer = scaledImageHeight - canvasHeight,
        factor = buffer / delta;

    if (sectionRect.top >= 0) {
      iY = 0;
      cY = sectionRect.top;
      cHeight = canvasHeight;
    } else if(sectionBottom < canvasHeight) {
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
    }else {
      iY = -1 * sectionRect.top;
      cY = 0;
      cHeight = sectionRect.height + sectionRect.top;
    }
    iHeight = (img.naturalWidth * cHeight) / sectionWidth;
  }

  iX = 0;
  cX = 0;
  iWidth = img.naturalWidth;
  cWidth = sectionWidth;

  return {
    ix: iX,
    iy: iY,
    iw: iWidth,
    ih: iHeight,
    cx: cX,
    cy: cY,
    cw: cWidth,
    ch: cHeight
  };
};

Editor.prototype.checkViewPortForCanvas = function () {
  let i = 0,
      sect,
      sections = this.sectionsForParallax,
      isVisible = false,
      draf = [],
      videos = [];

  for (; i < sections.length; i = i + 1) {
    sect = sections[i];
    isVisible = sect.isElementVerticallyInViewPort();

    if (isVisible) {
      if (this.mode == 'read' && sect.hasClass('video-in-background')) {
        videos.push(sect);
      } else {
        let img = this.parallaxImages[i],
          pos = this.calculatePosition(img, sect);
          draf.push([img, pos]);  
      }
    }
  }

  const parallaxRect = this.parallax.getBoundingClientRect();

  if (draf.length  > 0) {
    this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
    this.addImageToCanvas(draf);
  } else {
    this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
  }
  
  if (this.mode == 'read') {
    if (videos.length) {
      Player.cameInView(videos);  
    } else {
      Player.notInView();
    }
  }
  
};

Editor.prototype.addImageToCanvas = function (draf, image, pos) {
  for (let i = 0; i < draf.length;i = i + 1) {
    const image = draf[i][0];
    const pos = draf[i][1];
    this.parallaxContext.drawImage(
      image,
      pos.ix, pos.iy, 
      pos.iw, pos.ih, 
      pos.cx, pos.cy, 
      pos.cw, pos.ch);
  }
};

/** notes related **/
Editor.prototype.showNoteIcon = function (ev, matched) {
  if (this.notesManager) {
    this.notesManager.showNote(ev, matched);
  }
};
/** notes related ends **/


/** mobile touch handling **/
Editor.prototype._pressWatch = null;
Editor.prototype._pressHappened = false;

Editor.prototype.handleTap = function (ev) {
  if (this._pressHappened) {
    setTimeout( () => {
      const txt = this.getSelectedText();
      if (txt == '' && this._pressWatch) {
        clearInterval(this._pressWatch);
        this._pressHappened = false;
      }
    }, 100); // force wait
  }
};

Editor.prototype.handlePress = function (ev) {
  let prev, _this = this;

  this._pressWatch = setInterval( function() {
    const txt = _this.getSelectedText();
    if (prev && txt != prev && txt != '') {
      Utils.animationFrame.call(window, function() {
        _this.handleMouseUp(false);
      });
    } else if (!prev && txt != ''){
      Utils.animationFrame.call(window, function() {
        _this.handleMouseUp(false);
      });
    }
    prev = txt;
  }, 250);
};

/** mobile touch handling ends **/

/** section stories event handling **/
Editor.prototype.handleSectionToolbarItemClicked = function (ev) {
  const tg = ev.currentTarget,
      action = tg.attr('data-action');

  if (this.section_options) {    
    this.section_options.command(action, tg);
    this.activateBlock(tg);
    return;
  }
};

Editor.prototype.handleSectionToolbarItemKeyUp = function (ev) {
  const which = ev.which,
    stopFor = [BACKSPACE, DELETE, LEFTARROW, RIGHTARROW];

  if(stopFor.indexOf(which) != -1) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }
  return;
};

Editor.prototype.handleSectionToolbarItemKeyDown = function (ev) {
  const which = ev.which,
    stopFor = [BACKSPACE, DELETE, LEFTARROW, RIGHTARROW];

  if(stopFor.indexOf(which) != -1) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }
  
  return;
};

Editor.prototype.handleSectionToolbarItemKeyPress = function (ev) {
  
};

Editor.prototype.handleSectionToolbarItemMouseUp = function (ev) {
  Utils.simpleStop(ev);
  return;
};

Editor.prototype.handleSectionToolbarItemMouseDown = function (ev) {
  Utils.simpleStop(ev);
  return;
};

Editor.prototype.handleSectionToolbarItemDblclick = function (ev) {
  Utils.simpleStop(ev);
  return;
};

Editor.prototype.handleSelectionStoryTypeChange = function (ev) {
  let ctg = ev.currentTarget,
  cont = ctg.closest('.main-controls'),
  input = cont != null ? cont.querySelector('[data-for="tagname"]') : null,
  autoCont = input != null ? input.closest('.autocomplete-buttons') : null;
  if (ctg.value == 'tagged') {
    autoCont.show();
    input.focus();
  } else {
    autoCont.hide();
  }
};

Editor.prototype.handleSelectionStoryCountChange = function (ev) {
  let ctg = ev.currentTarget;
  const section = ctg.closest('.block-stories');
  const val = parseInt(ctg.value);
  if (!isNaN(val) && section != null) {
    section.attr('data-story-count', val);
    const bd = section.querySelector('.main-body');
    this.fillStoryPreview(bd, val);
  }
};

const KatanaEditor = function(opts) {
  const {selector} = opts;
  const node = document.querySelector(selector);
  if(node != null) {
    return new Editor({...opts, node});
  }
}

export default KatanaEditor;
