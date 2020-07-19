/** editor **/
(function() { 
  var u = Katana.utils;

  Katana.Editor = (function(_super) {
    u.__extends(Editor, _super);

    var BACKSPACE = 8,
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
      NUMBER_QUOTE = 52;
      NUMBER_CODE_BLOCK = 53,

      CHAR_CENTER = 69, // E with Ctrl
      CHAR_LINK = 75; // k for link

      SHORT_CUT_KEYS = [NUMBER_HONE, NUMBER_HTWO, NUMBER_HTHREE, NUMBER_QUOTE, NUMBER_CODE_BLOCK, CHAR_CENTER, CHAR_LINK];

    
    function Editor(opts) {  

      this.editor_options = opts;
      // entry points
      this.init = u.__bind(this.init, this); // activate
      this.destroy = u.__bind(this.destroy, this); // deactivate
      this.subscribe = u.__bind(this.subscribe, this); // for subscription to events
      this.notifySubscribers = u.__bind(this.notifySubscribers, this); // notify subscribers of events

      // ui related
      this.render = u.__bind(this.render, this);
      this.template = u.__bind(this.template, this);

      //base methods
      this.initialize = u.__bind(this.initialize, this);
      this.initContentOptions = u.__bind(this.initContentOptions, this);
      this.initTextToolbar = u.__bind(this.initTextToolbar, this);
      this.insertFancyChar = u.__bind(this.insertFancyChar, this);
      this.markAsSelected = u.__bind(this.markAsSelected, this);
      this.selectFigure = u.__bind(this.selectFigure, this);

      // canvas related
      this.parallaxCandidateChanged = u.__bind(this.parallaxCandidateChanged, this);

      //event listeners
      this.handlePaste = u.__bind(this.handlePaste, this);
      this.handleDrag = u.__bind(this.handleDrag, this);
      this.handleDrop = u.__bind(this.handleDrop, this);
      this.handleDragEnter = u.__bind(this.handleDragEnter, this);
      this.handleDragExit = u.__bind(this.handleDragExit, this);

      this.handleSelectionChange = u.__bind(this.handleSelectionChange, this);
      this.handleMouseUp = u.__bind(this.handleMouseUp, this);
      this.handleMouseDown = u.__bind(this.handleMouseDown, this);
      this.handleKeyUp = u.__bind(this.handleKeyUp, this);
      this.handleKeyDown = u.__bind(this.handleKeyDown, this);
      this.handleKeyPress = u.__bind(this.handleKeyPress, this);
      this.handleDblclick = u.__bind(this.handleDblclick, this);
      this.handlePress = u.__bind(this.handlePress, this);
      this.handleTap = u.__bind(this.handleTap, this);

      // this.handleCopyEvent = u.__bind(this.handleCopyEvent, this);

      //image event listeners
      this.handleGrafFigureSelectImg = u.__bind(this.handleGrafFigureSelectImg, this);
      this.handleGrafFigureTypeCaption = u.__bind(this.handleGrafFigureTypeCaption, this);
      this.handleImageActionClick = u.__bind(this.handleImageActionClick, this);

      // section toolbar event listeners
      this.handleSectionToolbarItemClicked = u.__bind(this.handleSectionToolbarItemClicked, this);
      this.handleSectionToolbarItemMouseUp = u.__bind(this.handleSectionToolbarItemMouseUp, this);
      this.handleSectionToolbarItemMouseDown = u.__bind(this.handleSectionToolbarItemMouseDown, this);
      this.handleSectionToolbarItemKeyUp = u.__bind(this.handleSectionToolbarItemKeyUp, this);
      this.handleSectionToolbarItemKeyDown = u.__bind(this.handleSectionToolbarItemKeyDown, this);
      this.handleSectionToolbarItemKeyPress = u.__bind(this.handleSectionToolbarItemKeyPress, this);
      this.handleSectionToolbarItemDblclick = u.__bind(this.handleSectionToolbarItemDblclick, this);

      this.handleSelectionStoryTypeChange = u.__bind(this.handleSelectionStoryTypeChange, this);
      this.handleSelectionStoryCountChange = u.__bind(this.handleSelectionStoryCountChange, this);

      // notes
      this.showNoteIcon = u.__bind(this.showNoteIcon, this);
      this.smallScreen = u.getWindowWidth() <= 480 ? true : false;

      this.segregateEvents();

      this.isTouch = 'ontouchstart' in window || 'msmaxtouchpoints' in window.navigator;
      this.isIOS = u.onIOS();
      return Editor.__super__.constructor.apply(this, arguments);
    };

    Editor.prototype.segregateEvents = function () {
      var mode = this.editor_options.mode || 'read';
      var publication = this.editor_options.editorType == 'publication' ? true : false;
      
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
          
          "click .item-figure .padding-cont": "handleGrafFigureSelectImg",
          "click .with-background .table-view": "handleGrafFigureSelectImg",
          "keyup .item-figure .caption": "handleGrafFigureTypeCaption",

          "click .markup-figure-anchor": "handleFigureAnchorClick",
          "click .item-controls-cont .action": "handleImageActionClick",

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
          var o = {
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

    Editor.prototype.__selectionChangeFired = false;

    Editor.prototype.handleSelectionChange = function(ev) {
      var sel = document.getSelection();
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

    Editor.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.editorOpts = opts;
      this.el = opts.el || "#editor";

      // debug mode
      window.debugMode = opts.debug || false;
      if (window.debugMode) {
        this.elNode.addClass("debug");
      }

      this.mode = opts.mode || 'read'; // can be write/ edit/ read
      this.editorType = opts.editorType || 'blog';
      this.publicationMode = this.editorType == 'publication' ? true : false;

      this.base_content_options = opts.base_content_options || ['image', 'video', 'section'];
      this.content_options = [];

      this.current_node = null;
      this.prev_current_node = null;
      this.current_range = null;

      this.image_options = opts.image ? opts.image : { upload: true };
      this.embed_options = opts.embed ? opts.embed : { enabled: false };
      this.json_quack = opts.json_quack;

      let embedPlcStr = opts.placeholders && opts.placeholders.embed ? opts.placeholders.embed : 'Paste a YouTube video link, and press Enter';
      let titlePlcStr = opts.placeholders && opts.placeholders.title ? opts.placeholders.title : 'Title here';
      let subTitlePlcStr = opts.placeholders && opts.placeholders.subtitle ? opts.placeholders.subtitle : 'Start with introduction ..';
      
      this.embed_placeholder = `<span class='placeholder-text placeholder-text--root'>${embedPlcStr}</span><br>`;
      //this.oembed_url = `http://iframe.ly/api/iframely?api_key=4afb3d8a83ee3fdb9ecf73&url=`;
      this.title_placeholder = `<span class="placeholder-text placeholder-text--root" data-placeholder-text="${titlePlcStr}">${titlePlcStr}</span><br>`;
      this.subtitle_placeholder = `<span class="placeholder-text placeholder-text--root" data-placeholder-text="${subTitlePlcStr}">${subTitlePlcStr}</span><br>`;

      this.sectionsForParallax = [];
      this.parallax = null;
      this.parallaxContext = null;

      this.currentRequestCount = 0;
      this.commentable = opts.commentable || false;

      this.notes_options = opts.notes || {};

      this.paste_element_id = '#mf_paste_div';

      this.streamHandlers = {};

      return this;
    };

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
        const enabled = this.editorOpts && this.editorOpts.enableDraft ? this.editorOpts.enableDraft : true;
        if(enabled) {
          this.committer = new Katana.ModelFactory({editor: this, mode: 'write'});
          this.committer.manage(true);
        }
      }

      if (this.notes_options.commentable) {
        const winWidth = u.getWindowWidth();
        var layout = winWidth <= 480 ? 'popup' : 'side';
        this.notesManager = new Katana.Notes({editor: this, notes: [], info : this.notes_options, layout: layout});
        this.notesManager.init();
      }

      if (this.mode == 'write') {
        this.removeUnwantedSpans();
        setTimeout( () => {
          this.addFigureControls();
        }, 200);
      }

      if (this.mode == 'read') {
        Katana.Player.manage(this.editor_options.video);
      }

      if (this.mode == 'write') {
        setTimeout( () => {
          //this.mutationHandler = new MutationOb
        }, 300);
      }

      setTimeout( () => {
        this.addBlanktoTargets();
      }, 200);

      this.addEmptyClass();

      if ( this.isIOS ) {
        document.addEventListener('selectionchange', this.handleSelectionChange);
      }
    };

    const _SubWrap = function(name, cb, set) {
      this.name = name;
      this.cb = cb;
      this.set = set;
    }
    _SubWrap.prototype.execute = function(ev) {
      this.cb(ev);
    }
    _SubWrap.prototype.release = function() {
      this.cb = null;
      this.set.clear(this);
    }

    Editor.prototype.subscribe = function(name, cb) {
      if(typeof this.streamHandlers[name] === 'undefined') {
        this.streamHandlers[name] = new Set();
      }
      const sub = new _SubWrap(name, cb, this.streamHandlers[name]);
      this.streamHandlers[name].add(sub);
      return sub;
    };

    Editor.prototype.notifySubscribers = function(name, ev) {
      if(typeof this.streamHandlers[name] === 'undefined') {
        return;
      }
      const entries = this.streamHandlers[name].entries();
      for(const [k, v] of entries) {
        v.execute(ev);
      }
    }

    Editor.prototype.addBlanktoTargets = function() {
      var anchors = this.elNode.querySelectorAll('a');
      anchors.forEach( (item) => {
        if(!item.hasAttribute('target')) {
          item.attr('target', '_blank');
        }
      });
    };

    Editor.prototype.addEmptyClass = function() {
    };

    Editor.prototype.setInitialFocus = function () {
      var items = this.elNode.querySelectorAll('.item');
      if (items.length >= 2) {
        var first = items[0],
            sec = items[1],
            toFocus = false,
            toolTip = false;
        if ( first.querySelectorAll('.placeholder-text').length && sec.querySelectorAll('.placeholder-text').length ) {
          toFocus = items[1];
          toolTip = true;
        } else {
          toFocus = items[0];
        }

        if (toFocus) {
          var _this = this;
          _this.markAsSelected(toFocus);
          _this.setRangeAt(toFocus);
          if (toolTip) {
            _this.displayTooltipAt(toFocus);
          }
        }
      }
    };

    Editor.prototype.appendParallax = function () {
      var art = this.elNode.closest('body');
      if (art != null) {
        if (document.querySelector('.parallax') != null) {
          return;
        }
        var cv = u.generateElement(`<canvas class="parallax"></canvas>`),
            handled = false,
            resizeHandler;

        cv.attr('width', u.getWindowWidth());
        cv.attr('height', u.getWindowHeight());

        art.insertBefore(cv, art.firstElementChild);
        let _this = this;
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
        const wnW = u.getWindowWidth(), wnH = u.getWindowHeight();
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

      this.tooltip = new Katana.Tooltip({editor: this});
      this.tooltip.render().hide();
    };

    Editor.prototype.initTextToolbar = function () {
      if ( document.querySelector('#mfToolbarBase') == null ) {
        const tbHt = `<div id='mfToolbarBase' class='mf-menu mf-toolbar-base mf-toolbar hide' ></div>`;
        const tbEl = u.generateElement(tbHt);
        tbEl.insertAfter(this.elNode.parentNode);
      }
      
      if (this.text_toolbar == null) {
        this.text_toolbar = new Katana.Toolbar.TextToolbar({
          editor: this,
          mode: this.mode
        });
      }

      this.toolbar = this.text_toolbar;
      return this.text_toolbar;
    };

    Editor.prototype.initContentOptions = function () {
      var base_options;
      base_options = this.base_content_options;

      if (base_options.indexOf("image") >= 0) {         
        if (document.querySelector('#mfImageToolbarBase') == null) {
          const igTb = `<div id='mfImageToolbarBase' class='mf-menu mf-toolbar-base mf-toolbar hide'></div>`;
          const igEl = u.generateElement(igTb);
          igEl.insertAfter(this.elNode.parentNode);
        }
        
        this.image_toolbar = new Katana.Toolbar.ImageToolbar({
          editor: this,
          mode: this.mode
        });

        this.image_toolbar.render().hide();
        var opt = new Katana.Content.Images({editor: this, toolbar: this.image_toolbar});
        this.image_toolbar.setController(opt);
        this.content_options.push(opt);
        this.image_uploader = opt;
      }

      if (base_options.indexOf("video") >= 0) { 
       var opt = new Katana.Content.Video({editor: this});
       this.content_options.push(opt); 
       this.video_uploader = opt;
      }

      if (base_options.indexOf("section") >= 0) { 
        var opt = new Katana.Content.Section({editor: this,
          mode: this.mode, editorType: this.editorType});
        this.content_options.push(opt);
        this.section_options = opt;
      }
      
      if (base_options.indexOf("embed") >= 0) { 
        var opt = new Katana.Content.Embed({editor: this,
          mode: this.mode});
        this.embed_options = opt;
        this.content_options.push(opt);
      }

      if (document.querySelector('#mfContentBase') == null) {
        const coEl = u.generateElement(`<div class='inlineContentOptions inlineTooltip' id='mfContentBase'></div>`);
        coEl.insertAfter(this.elNode);
      }
      
      this.content_bar = new Katana.ContentBar({editor:this, widgets: this.content_options});
      this.content_bar.render();

    };

    Editor.prototype.render = function (cb) {
      if (this.elNode.innerHTML.trim() == '') {
        this.elNode.appendChild( u.generateElement(this.template()) );
        if (this.publicationMode) {
          var bd = this.elNode.querySelector('.block-stories .main-body');
          $(this.elNode.querySelector('.autocomplete')).autocomplete();

          this.fillStoryPreview(bd, 6);
          var lsect = this.elNode.querySelector('section:last-child .main-body');
          if(lsect != null) {
            lsect.appendChild(u.generateElement(`<div class="block-content-inner center-column"><p class="item item-p" name="${u.generateId()}"><br /></p></div>`));
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

      this.setupElementsClasses(this.elNode.querySelectorAll('.block-content-inner'), function() {
        if (_this.mode == 'write') {
          const figures = _this.elNode.querySelectorAll('.item-figure');
          figures.forEach((item) => {
            if (item.hasClass('figure-in-row')) {
              var cont = item.closest('.block-grid');
              var caption = cont.querySelector('.block-grid-caption');
              if (caption == null) {
                var t = u.generateElement(_this.figureCaptionTemplate(true));
                t.removeClass('figure-caption');
                t.addClass('block-grid-caption');
                cont.appendChild(t);
                caption = cont.querySelector('.block-grid-caption');
              }
              caption.attr('contenteditable', true);
            } else {
              var caption = item.querySelector('figcaption');
              if (caption == null) {
                item.appendChild(u.generateElement(_this.figureCaptionTemplate()));
                caption = item.querySelector('figcaption');
                item.addClass('item-text-default');
              }
              caption.attr('contenteditable', true);

              if ( caption.textContent.killWhiteSpace().length == 0 ) {
                var txt = 'Type caption for image(Optional)';
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
      var sects = this.elNode.querySelectorAll('section');
      if (sects.length) {
        for (var i = 0; i < sects.length; i = i + 1) {
          var section = sects[i];
          var body = section.querySelector('.main-body');
          var toolbar;
          if (!section.hasClass('block-add-width') && !section.hasClass('block-full-width')) {
            section.addClass('block-center-width');
          }
          if (section.hasClass('block-stories')) {
            toolbar = u.generateElement(this.getStoriesSectionMenu(true));
            var name = section.attr('name');
            var obName = window['ST_' + name];
            
            var count = 6, stType = 'featured', tagValue = '';

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

            var auto = toolbar.querySelector('.autocomplete');
            auto.autocomplete({threshold:2, behave: 'buttons', type: 'tag'});

            var tagInpt = toolbar.querySelector('[data-for="tagname"]');
            if (stType == 'tagged') {
              tagInpt.closest('.autocomplete-buttons').removeClass('hide');
              auto.autocomplete({action:'set', data: JSON.parse(tagValue)});
            } else {
              tagInpt.closest('.autocomplete-buttons').addClass('hide');
            }
            toolbar.insertBefore(body);
          } else {
            toolbar = u.generateElement(this.getStoriesSectionMenu(false));
            toolbar.insertBefore(body);
          }
        }
      }
    };

    Editor.prototype.addFigureControls = function () {
      var imageFigures = document.querySelectorAll('.item-figure:not(.item-iframe)');
      imageFigures.forEach( item => {
        var temp = u.generateElement(this.getImageFigureControlTemplate());
        var img = item.querySelector('img');
        if(img != null) {
          img.insertAfter(temp);
        }
      });

    };

    Editor.prototype.addPlaceholdersForBackgrounds = function () {
      var backgrounds = this.elNode.querySelectorAll('.with-background');
      if (backgrounds.length) {

      }
    };

    Editor.prototype.backgroundSectionPlaceholder = function () {
      var ht = '<h';
    };

    Editor.prototype.getPlaceholders = function () {
      var ht = `<h3 class="item item-h3 item-first" name="${u.generateId()}">${this.title_placeholder}</h3>
      <p class="item item-p item-last" name="${u.generateId()}">${this.subtitle_placeholder}</p>`;
      return ht;
    };

    Editor.prototype.getSingleLayoutTempalte = function () {
      return `<div class="block-content-inner center-column"></div>`;
    };

    Editor.prototype.getSingleSectionTemplate = function () {
      var ht = `<section class="block-content" name="${u.generateId()}">
        <div class="main-divider" contenteditable="false"><hr class="divider-line" tabindex="-1"></div>
        <div class="main-body">
        </div>
        </section>`;
      return ht;
    };

    Editor.prototype.getSingleStorySectionTemplate = function () {
      var existingSects = this.elNode.querySelectorAll('.block-stories'),
      excludes = [];

      if (existingSects.length) {
        for (var i = 0;i < existingSects.length; i = i + 1) {
          var sec = existingSects[i];
          var select = sec.querySelector('[data-for="storytype"]');
          if(select != null) {
            var val = select.value;
            if (val != 'tagged') {
              excludes.push(val);
            }
          }
        }
      }

      var ht = `<section class="block-stories block-add-width as-image-list" name="${u.generateId()}" data-story-count="6">
          <div class="main-divider" contenteditable="false"><hr class="divider-line" tabindex="-1"></div>
          ${this.getStoriesSectionMenu(true, excludes)}
          <div class="main-body">
          </div>
          </section>`;
      return ht;
    };

    Editor.prototype.getStoryPreviewTemplate = function () {
      var ht = `<div class="st-pre" >
          <div class="st-img"></div>
          <div class="st-title"></div>
          <div class="st-sub"></div>
          <div class="st-sub2"></div>
          </div>`;
      return ht;
    };

    Editor.prototype.fillStoryPreview = function (container, count) {
      count = typeof count == 'undefined' || isNaN(count) ? 6 : count;
      var ht = `<div class="center-column" contenteditable="false">`;
      for (var i = 0; i < count; i = i + 1) {
        ht += this.getStoryPreviewTemplate();
      }
      ht += `</div>`;
      container.innerHTML = ht;
    };

    Editor.prototype.menuOpts = [['featured','Featured'],['latest','Latest'],['tagged','Tagged as']];

    Editor.prototype.getStoriesSectionMenu = function (forStories, exclude) {
      var fs = typeof forStories == 'undefined' ? true : forStories,
        ht = `<div class="main-controls '${fs ? `story-mode` : `plain-mode`}" contenteditable="false">
            <div class="main-controls-inner center-column">
            <select data-for="storytype">`;

      var opts = '';
      var excludeOpts = typeof exclude != 'undefined' ? exclude : [];

      for (var i = 0; i < this.menuOpts.length; i = i + 1) {
        var menu = this.menuOpts[i];
        if (excludeOpts.indexOf(menu[0]) == -1) {
          opts += `<option value="${menu[0]}">${menu[1]}</option>`;
        }
      }

      ht += opts;

      ht += `</select>';
        <input type="text" class="text-small autocomplete" data-behave="buttons" data-type="tag" data-for="tagname" placeholder="Tag name here"></input>
        <input type="number" class="text-small" data-for="storycount" value="6" min="4" max="10"></input>
        <div class="right">
        <div class="main-controls-structure">
        <i class="mfi-text-left" data-action="list-view"></i>
        <i class="mfi-photo" data-action="image-grid"></i>
        </div>
        <div class="main-controls-layout">`;

      if (!fs) {
        ht += `<i class="mfi-image-default" data-action="center-width"></i>`;
      }

      ht += `<i class="mfi-image-add-width" data-action="add-width"></i>
        <i class="mfi-image-full-width" data-action="full-width"></i>
        <i class="mfi-cross left-spaced" data-action="remove-block"></i>
        </div>
        </div>
        </div>
        </div>`
      return ht;
    };

    Editor.prototype.getImageFigureControlTemplate = function () {
      const ht =
      `<div class='item-controls-cont'>
      <div class='item-controls-inner'>
      <i class='mfi-arrow-up action' data-action='goup' title='Move image up'></i>
      <i class='mfi-arrow-left action' data-action='goleft' title='Move image to left'></i>
      <i class='mfi-arrow-right action' data-action='goright' title='Move image to right'></i>
      <i class='mfi-cross action' data-action='remove' title='Remove image'></i>
      <i class='mfi-carriage-return action' data-action='godown' title='Move image to next line'></i>
      <i class='mfi-plus action' data-action='addpic' title='Add photo here'></i>
      <div class='extend-button action' data-action='stretch' title='Stretch to full width'><i class='mfi-extend-in-row'></i></div>
      </div>
      </div>`;
      return ht;
    };

    Editor.prototype.getFigureTemplate = function () {
      var ht = 
      `<figure contenteditable='false' class='item item-figure item-text-default' name='${u.generateId()}' tabindex='0'>
      <div style='' class='padding-cont'> 
      <div style='padding-bottom: 100%;' class='padding-box'></div> 
      <img src='' data-height='' data-width='' data-image-id='' class='item-image' data-delayed-src='' /> 
      ${this.getImageFigureControlTemplate()}
      </div> 
      <figcaption contenteditable='true' data-placeholder-value='Type caption for image (optional)' class='figure-caption caption'>
      <span class='placeholder-text'>Type caption for image (optional)</span> <br> 
      </figcaption> 
      </figure>`;
      return ht;
    };

    Editor.prototype.figureCaptionTemplate = function (multiple) {
      var plc = typeof multiple != 'undefined' ? `Type caption for images(optional)` : `Type caption for image(optional)`;
      var ht = `<figcaption contenteditable='true' data-placeholder-value='${plc}' class='figure-caption caption'>
        <span class="placeholder-text">${plc}<span> <br />
        </figcaption>`;
      return ht;
    };

    Editor.prototype.getFrameTemplate = function () {
      var ht = 
      `<figure contenteditable='false' class='item item-figure item-iframe item-first item-text-default' name='${u.generateId()}' tabindex='0'>
      <div class='iframeContainer'>
      <div style='' class='padding-cont'> 
      <div style='padding-bottom: 100%;' class='padding-box'>
      </div>
      <img src='' data-height='' data-width='' data-image-id='' class='item-image' data-delayed-src=''> 
      </div> 
      <div class='item-controls ignore'>
      <i class='mfi-icon mfi-play'></i>
      </div>
      </div> 
      <figcaption contenteditable='true' data-placeholder-value='Type caption for video (optional)' class='figure-caption caption'>
      <span class='placeholder-text'>Type caption for video (optional)</span>"
      </figcaption> 
      </figure>`;
      return ht;
    };

    Editor.prototype.template = function() {
      if (this.publicationMode) {
        var ht = `<section class='block-content block-first block-last block-center-width' name='${u.generateId()}'>
              <div class='main-divider' contenteditable='false'>
                <hr class='divider-line' tabindex='-1'/>
              </div> 
            ${this.getStoriesSectionMenu()}
            <div class='main-body'>  
            <div class='block-content-inner center-column'>${this.getPlaceholders()}</div> </div> </section>
            ${this.getSingleStorySectionTemplate()}
            ${this.getSingleSectionTemplate()}`;
        return ht;
      }

      var ht = `<section class='block-content block-first block-last' name='${u.generateId()}'>
        <div class='main-divider' contenteditable='false'>
          <hr class='divider-line' tabindex='-1'/>
        </div>
        <div class='main-body'>
          <div class='block-content-inner center-column'>${this.getPlaceholders()}</div>
        </div>
        </section>`;
      
      return ht;
    };

    Editor.prototype.templateBackgroundSectionForImage = function () {
      var ht = `<section name="${u.generateId()}" class="block-content block-image image-in-background with-background">
      <div class="block-background" data-scroll="aspect-ratio-viewport" contenteditable="false" data-image-id="" data-width="" data-height="">
      <div class="block-background-image" style="display:none;"></div>
      </div>
      <div class="table-view">
      <div class="table-cell-view" contenteditable="false">
      <div class="main-body" contenteditable="true">
      <div class="block-content-inner center-column">
      <h2 name="${u.generateId()}" class="item item-h2 item-text-default item-first item-selected" data-placeholder-value="Continue writing">
      <span class="placeholder-text">Continue writing</span><br>
      </h2>
      </div></div>
      </div></div>
      <div class="block-caption">
      <label name="${u.generateId()}" data-placeholder-value="Type caption " class="section-caption item-text-default item-last">
      <span class="placeholder-text">Type caption </span><br>
      </label>
      </div>
      </section>`;
      return ht;
    };

    Editor.prototype.templateBackgroundSectionForVideo = function () {
      var ht = `<section name="${u.generateId()}" class="block-content video-in-background block-image image-in-background with-background">
      <div class="block-background" data-scroll="aspect-ratio-viewport" contenteditable="false" data-image-id="" data-width="" data-height="">
      <div class="block-background-image" style="display:none;"></div>
      </div>
      <div class="table-view">
      <div class="table-cell-view" contenteditable="false">
      <div class="main-body" contenteditable="true">
      <div class="block-content-inner center-column">
      <h2 name="${u.generateId()}" class="item item-h2 item-text-default item-first item-selected" data-placeholder-value="Continue writing" data-scroll="native">
      <span class="placeholder-text">Continue writing</span><br>
      </h2>
      </div></div>
      </div></div>
      <div class="block-caption">
      <label name="${u.generateId()}" data-placeholder-value="Type caption " class="section-caption item-text-default item-last">
      <span class="placeholder-text">Type caption </span><br>
      </label>
      </div>
      </section>`;
      return ht;
    };

    Editor.prototype.baseParagraphTmpl = function() {
      return `<p class='item item-p' name='${u.generateId()}'><br></p>`;
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
      var text;
      text = "";
      if (typeof window.getSelection !== "undefined") {
        text = window.getSelection().toString();
      } else if (typeof document.selection !== "undefined" && document.selection.type === "Text") {
        text = document.selection.createRange().text;
      }
      return text;
    };

    Editor.prototype.selection = function() {
      if (window.getSelection) {
        return selection = window.getSelection();
      } else if (document.selection && document.selection.type !== "Control") {
        return selection = document.selection;
      }
    };

    Editor.prototype.getRange = function() {
      var editor, range;
      editor = this.elNode;
      range = selection && selection.rangeCount && selection.getRangeAt(0);
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
      var precedingChar, precedingRange, range, sel;
      precedingChar = "";
      sel = void 0;
      range = void 0;
      precedingRange = void 0;
      var node = this.getNode();
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
      var a, b;
      a = this.getSelectedText().killWhiteSpace().length;
      b = element.textContent.killWhiteSpace().length;
      return a === b;
    };

    Editor.prototype.setRangeAt = function(element, int) {
      var range, sel;
      if (int == null) {
        int = 0;
      }
      range = document.createRange();
      sel = window.getSelection();
      range.setStart(element, int);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return element.focus();
    };

    Editor.prototype.setRangeAtText = function(element, int) {
      var node, range, sel;
      if (int == null) {
        int = 0;
      }
      range = document.createRange();
      sel = window.getSelection();
      node = element.firstChild;
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

    Editor.prototype.getNode = function() {
      var node, range, root;
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
      
      var pt = node.closest('.block-content-inner') != null ? node.closest('.block-content-inner') : root;
      
      while (node && (node.nodeType !== 1 || !node.hasClass("item")) && (node.parentNode !== pt)) {
        node = node.parentNode;
      }

      if (node != null && !node.hasClass("item-li") && !node.hasClass('figure-in-row')) {
        var elementRoot = node.closest('.block-content-inner');
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
        const bg = element.closest('.block-grid');
        if(bg) {
          bd.addClass('grid-focused');
        }
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
      const bdc = elem.closest('.block-content');
      if(bdc != null) {
        bdc.addClass('block-selected');
      }
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
      top = node.offsetTop;
      u.scrollToTop();
    };

    Editor.prototype.setupLinks = function(elems) {
      if(elems.length != 0) {
        elems.forEach( (ii) => {
          this.setupLink(ii);
        });
      }
    };

    Editor.prototype.setupLink = function(n) {
      var href, parent_name;
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

      var pl = document.querySelector('.hide-placeholder');
      if (pl != null) {
        pl.removeClass('hide-placeholder');
      }

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
          var pos;
          pos = u.getSelectionDimensions();
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
      var text = this.getSelectedText();

      if (this.mode == 'read' && text && (text.length < 10 || text.length > 160)) {
        this.text_toolbar.hide();
        return;
      }
      
      if (this.image_toolbar) {
        this.image_toolbar.hide();
      }

      if ( anchor_node.matches(".item-mixtapeEmbed, .item-figure") && !text.isEmpty() ) {
        this.text_toolbar.hide();
        var sel = this.selection(), range, caption;
        if (sel) {
          range = sel.getRangeAt(0),
          caption,
          eleme = range.commonAncestorContainer;
          caption = eleme.closest('.caption');
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
      var height, left, padd, top;
      let elRect = this.toolbar.elNode.getBoundingClientRect();
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
      elements.querySelectorAll('i, b, strong, em').forEach( item => {
        if(item.textContent.killWhiteSpace().length == 0) {
          var pnt = item.parentNode;
          item.parentNode.replaceChild(document.createTextNode(''), item);
          if(pnt != null) {
            pnt.normalize();
          }
        }
      });
    };

    Editor.prototype.convertPsInnerIntoList = function (item, splittedContent, match) {
      var split = splittedContent,
          ht = '',
          k = 0,
          counter = match.matched[0].charAt(0);

      // FIXME .. counter checking for many chars which are not implements, not sure other languages have
      // 26 characters or more.. 
      // just avoid the splitting part if we have more than 26 characters and its not numerical
      if (['a','A','i','I','α','Ա','ა'].indexOf(counter) != -1 && split.length > 26) {
        return;
      }

      var count = isNaN(parseInt(counter)) ? counter: parseInt(counter) ;

      while (k < split.length) {
        
        var sf = '\\s*' + count +'(.|\\))\\s';
        var exp = new RegExp(sf);
        var sp = split[k].replace(exp, '');
        ht += '<li>' + sp + '</li>';
        k++;
        count = u.incrementCounter(count);
      }

      // we have a sequence..
      const olN = u.generateElement('<ol class="postList">' + ht + '</ol>');
      item.parentNode.replaceChild( olN, item );
        
      this.addClassesToElement( olN );

      if(olN.children) {
        Array.from(olN.children).forEach( elm => {
          this.setElementName(elm);
        });
      }
    };

    Editor.prototype.doesTwoItemsMakeAList = function (first, second) {
      var f = first,
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
      let _this = this;
      elements.forEach( item => {
          if (item.hasClass('item-figure')) {
            return;
          }
          const html = item.innerHTML;
          if ( html.trim().length !== 0 ) {
            // first case
            var split = html.split('<br>');

            if (split.length >= 2 && split[1] != '') {
              var match = _this.doesTwoItemsMakeAList(split[0], split[1]);
              match.matched = false;

              if (match.matched) {
                _this.convertPsInnerIntoList($item, split, match);
              }  
            }
          }
      });
    };


    Editor.prototype.handleUnwrapParagraphs = function(elements) {
      elements.forEach( item => {
        var p = item.querySelectorAll('p');
        if (p.length) {
          var currNodeName = item.tagName.toLowerCase();
          if (currNodeName == 'blockquote') {
            var d = document.createElement('div');

            for (var i = 0; i < p.length; i = i + 1) {
              let len = p.children.length;
              for(let j = 0; j < len; j++) {
                d.appendChild(p.children[j]);
              }
              p.parentNode.removeChild(p);
            }

            let len = d.children.length;
            for(let i = 0; i < len; i++) {
              item.appendChild(d.children[i]);
            }

          }
        }
      });
    };


    Editor.prototype.handleUnwrappedImages = function(elements) {
      let _this = this;
      elements.forEach(item => {
        if (item.hasClass('ignore-block') && item.hasClass('item-uploading')) {
          return;
        }
        var img = item.querySelectorAll('img');
        if (img.length) {

          item.attr('data-pending', true);
          
          if (item && item.children) {
            const children = item.children;
            var div = document.createElement('p');
            for (let i = 0; i < children.length; i++) {
              var it = children[i];
              if (it == img[0]) {
                continue;
              } else {
                div.appendChild(it);
              }
            }

            div.insertAfter(item);
            _this.addClassesToElement(div);
            _this.setElementName(div);
          }

          return _this.image_uploader.uploadExistentImage(img);
        }
      });

    };

    Editor.prototype.handleUnwrappedFrames = function (elements) {
      elements.querySelectorAll('iframe').forEach( im => {
        this.video_uploader.uploadExistentIframe(im);
      });
    };

    Editor.prototype.handleSpanReplacements = function (element) {
      const replaceWith = element.querySelectorAll('.replace-with');

      replaceWith.forEach( node => {
        var hasBold = node.hasClass('bold'),
          hasItalic = node.hasClass('italic');

        if (hasBold && hasItalic) {
          node.parentNode.replaceChild(u.generateElement(`<i class="markup-i"><b class="markup-b">${node.innerHTML}</b></i>`), node);
        }else if(hasItalic) {
          node.parentNode.replaceChild(u.generateElement(`<i class="markup-i">${node.innerHTML}</i>`), node);
        } else if(hasBold) {
          node.parentNode.replaceChild(u.generateElement(`<b class="markup-i">${node.innerHTML}</b>`), node);
        }
      });
    };


    Editor.prototype.removeUnwantedSpans = function () {
      this.elNode.addEventListener('DOMNodeInserted', (ev) => {
        var node = ev.target;
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
      var regs =  [
        // replace two bogus tags that begin pastes from google docs
        [new RegExp(/<[^>]*docs-internal-guid[^>]*>/gi), ''],
        [new RegExp(/<\/b>(<br[^>]*>)?$/gi), ''],

         // un-html spaces and newlines inserted by OS X
        [new RegExp(/<span class="Apple-converted-space">\s+<\/span>/g), ' '],
        [new RegExp(/<br class="Apple-interchange-newline">/g), '<br>'],

        // replace google docs italics+bold with a span to be replaced once the html is inserted
        [new RegExp(/<span[^>]*(font-style:italic;font-weight:bold|font-weight:bold;font-style:italic)[^>]*>/gi), '<span class="replace-with italic bold">'],

        // replace google docs italics with a span to be replaced once the html is inserted
        [new RegExp(/<span[^>]*font-style:italic[^>]*>/gi), '<span class="replace-with italic">'],

        //[replace google docs bolds with a span to be replaced once the html is inserted
        [new RegExp(/<span[^>]*font-weight:bold[^>]*>/gi), '<span class="replace-with bold">'],

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

        // deductions over, now cleanup
        // remove all style related informations from the tags.
        [new RegExp(/(<[^>]+) style=".*?"/gi), '$1'],

        // remove multiple line breaks with one.
        [new RegExp(/<br\s*\/?>(?:\s*<br\s*\/?>)+/gi), '<br>'],

      ];

      for (i = 0; i < regs.length; i += 1) {
          text = text.replace(regs[i][0], regs[i][1]);
      }

      return text;
    };

    Editor.prototype.insertTextAtCaretPosition = function (textToInsert, haveMoreNodes) {
      if (document.getSelection && document.getSelection().getRangeAt) {
        var sel = document.getSelection();
        var range = sel.getRangeAt(0);
        var ca = range.commonAncestorContainer;
        var caption = ca.closest('figcaption');
        var getBlockContainer = (node) => {
          while (node) {
            if (node.nodeType == 1 && node.nodeName == 'FIGCAPTION') {
              return node;
            }
            node = node.parentNode;
          }
        }
        var generateRightParts = (node) => {
          if (sel.rangeCount > 0) {
           var blockEl = getBlockContainer(range.endContainer);
            if (blockEl) {
              var ran = range.cloneRange();
              ran.selectNodeContents(blockEl);
              ran.setStart(range.endContainer, range.endOffset);
              return ran.extractContents();
            }
          }
        };

        var generateLeftParts = (node) => {
          if (sel.rangeCount > 0) {
            var blockEl = getBlockContainer(range.startContainer);
            if (blockEl) {
              var ran = range.cloneRange();
              ran.selectNodeContents(blockEl);
              ran.setEnd(range.startContainer, range.startOffset);
              return ran.extractContents();
            }
          }
        };

        if (sel.type == 'Caret') {
          off = range.endOffset;
          var rest = '';
          rest = generateRightParts();

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
          var left = '';
          var right = '';
          left = generateLeftParts();
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
        const pei = document.querySelector(this.paste_element_id);
        if(pei != null) {
          document.querySelector(this.paste_element_id).parentNode.removeChild(pei);
        }

        document.body.appendChild(u.generateElement(`<div id='${this.paste_element_id.replace('#', '')}' style='display:none;'></div>`));
        if(pei != null) {
          pei.innerHTML = `<span>${pastedText}</span>`;
        }

        // fix span with related tags 
        this.handleSpanReplacements(pei);

        this.pastingContent = true;
        let _this = this;

        this.setupElementsClasses(pei, () => {
            let last_node, new_node, nodes, num, top;
            nodes = u.generateElement( document.querySelector(this.paste_element_id).innerHTML ).insertAfter(this.aa );

            var aa = this.aa;
            var caption;

            if (aa.hasClass('item-figure')) {
              if (aa.hasClass('figure-in-row')) {
                var grid = aa.closest('.block-grid');
                if(grid != null) {
                  caption = grid.querySelector('.block-grid-caption');
                }
              } else {
                caption = aa.querySelector('figcaption');
              }
            } else if(aa.hasClass('block-grid-caption')) {
              caption = aa;
            }

            if (caption && caption.length) {
              var first = nodes;
              var firstText = first.textContent;
              var leftOver = '';
              if (aa.hasClass('item-text-default')) {
                caption.innerHTML = firstText;
              } else {
                leftOver = this.insertTextAtCaretPosition(firstText, nodes.length - 1); // don't count the current node
              }
              aa.removeClass('item-text-default');
              nodes.splice(0, 1);
              first.parentNode.removeChild(first);
              if (leftOver != '') {
                var o = document.createElement('p');
                o.appendChild(u.generateElement(leftOver));
                o.insertAfter(nodes.lastElementChild);
              }
            }

            if (!nodes.length) {
              return;
            }
            if (aa.textContent == '') {
              aa.parentNode.removeChild(aa);
            }

            var pt = document.querySelector(this.paste_element_id).querySelector('figure');

            if(pt != null) {
              const pei = document.querySelector(this.paste_element_id);
              pei.parentNode.removeChild(pei);
            }

            last_node = nodes[nodes.length - 1];
            if (last_node && last_node.length) {
              last_node = last_node[0];
            }
            num = last_node.childNodes.length;
            this.setRangeAt(last_node, num);
            new_node = this.getNode();
            top = new_node.offsetTop;
            this.markAsSelected(new_node);

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

            var figs = this.elNode.querySelectorAll('figure');
            figs.forEach( (ite) => {
              let it = ite;
              if (it.querySelectorAll('img').length == 0) {
                it.parentNode.removeChild($it);
              }
            });

            var captions = this.elNode.querySelectorAll('figcaption');
            captions.forEach((ite) => {
              let it = ite.closest('.item');
              if (it != null && it.querySelectorAll('img').length == 0) {
                it.parentNode.removeChild(it);
              }
            });

            return u.scrollToTop(top);
            
            /* 
            return $('html, body').animate({
              scrollTop: top
            }, 200); 
            */
          }
        );
        return false;
      } else {
        //its plain text
        var $node = this.aa;
        if ($node.hasClass('item-figure') ) {
          var caption;
          if ($node.hasClass('figure-in-row')) {
            var grid = $node.closest('.block-grid');
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
      var cbd, pastedText;
      this.aa = this.getNode();
      pastedText = void 0;

      if (window.clipboardData && window.clipboardData.getData) {
        pastedText = window.clipboardData.getData('Text');
      } else if (ev.clipboardData && ev.clipboardData.getData) {
        cbd = ev.clipboardData;
        pastedText = cbd.getData('text/html').isEmpty() ? cbd.getData('text/plain') : cbd.getData('text/html');
      }
      return this.doPaste(pastedText);
    };


    Editor.prototype.handleDblclick = function(e) {
      var node;
      var tg = e.target.closest('.main-controls');
      if (tg != null) {
        return false;
      }
      node = this.getNode();
      if (!node) {
        this.setRangeAt(this.prev_current_node);
      }
      return false;
    };

    Editor.prototype.handleMouseDown = function (e) {
      var node, anchor_node,
        el = e.toElement;

      if (el.hasClass('placeholder-text') || el.querySelectorAll('.placeholder-text').length) {
        node = el.closest('.figure-caption');
        if(node != null) {
          e.preventDefault();
          u.setCaretAtPosition(node, 0);
        }else {
          node =  el.closest('.item');
          if(node != null) {
            e.preventDefault();
            u.setCaretAtPosition(node, 0);
          }  
        }
      }else if(el.hasClass('block-background') || el.hasClass('table-view') || el.hasClass('table-cell-view')) {
        var section = el.closest('section');
        if(section != null) {
          this.selectFigure(section);
        }
      } else if(el.hasClass('block-grid-caption')) {
        let bg = el.closest('.block-grid');
        if(bg != null) {
          bg.addClass('grid-focused');
        }
      }

    };

    // NOTE don't use the event, as its just dummy, function gets called from selection change also
    Editor.prototype.handleMouseUp = function () {

      var anchor_node,
          selection = this.selection();
      
      if (!selection && selection.anchorNode.hasClass('main-divider')) {
        var new_anchor = selection.anchorNode,
            focusTo = new_anchor.nextElementSibling.querySelector('.block-content-inner:first-child .item:first-child');
          if (focusTo != null) {
            this.setRangeAt(focusTo);
            u.setCaretAtPosition(focusTo);
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
      var current_node;
      current_node = this.getNode();
      if (current_node != null) {
        this.markAsSelected(current_node);
        return this.displayTooltipAt(current_node);
      }
    };


    Editor.prototype.handleTab = function(anchor_node, event) {
      var nextTabable = function (node) {
        var next = node.next('.item');
        if (next != null) {
          return next;
        }
        var cont = node.closest('.block-content-inner');
        next = cont != null ? cont.nextElementSibling : null;
        if (next != null) {
          return next;
        }
        var sec = node.closest('.block-content');
        next = sec != null ? sec.next() : null;
        if (next != null) {
          var block = next.querySelector('.block-content-inner:last-child');
          if (block != null) {
            var item = block.querySelector('.item:last-child');
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

      var prevTabable = function (node) {
        var prev = node.prev('.item');
        if (prev != null) {
          return prev;
        }
        var cont = node.closest('.block-content-inner');
        cont = cont != null ? cont.previousElementSibling : null;

        if (cont != null && (cont.hasClass('block-grid') || cont.hasClass('full-width-column')) ) {
          return cont;
        } else if(cont.length && cont.hasClass('center-column')) {
          var i = cont.querySelector('.item:last-child');
          if (i != null) {
            return i;
          }
        }

        var sec = node.closest('.block-content');
        prev = sec.previousElementSibling;
        if (prev != null) {
          var last = prev.querySelector('.block-content-inner:last-child');
          if (last != null && last.hasClass('block-grid')) {
            return last;
          } else if(last != null && last.hasClass('center-column')) {
            var i = last.querySelector('.item:last-child');
            if (i != null) {
              return i;
            }
          }
        }
        return false;
      };
      var next;
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
          var cap = next.querySelector('.block-grid-caption');
          if (cap != null) {
            this.setRangeAt(cap);
          }
          next.addClass('grid-focused');
        } else if(next.hasClass('full-width-column')) {
          var fig = next.querySelector('.item-figure');
          if (fig != null) {
            var cap = fig.querySelector('figcaption');
            if (cap.length) {
              this.setRangeAt(cap);
            }
            this.selectFigure(fig);
          }
        } else if(next.hasClass('item-figure')) {
          var cap = next.querySelector('figcaption');
          if (cap != null) {
            this.setRangeAt(cap);
          }
          this.selectFigure(next);
        } else if(next.hasClass('with-background')) {
          var items = next.querySelector('.item:first-child');
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
            u.stopEvent(ev);
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
              var cont = current_node.closest('.block-content-inner');
              if (cont != null) {
                var last = cont.querySelector('.item-figure:last-child');
                if (last != null && last.attr('name') == current_node.attr('name')) {
                  next_node = cont.closest('.block-grid').querySelector('.block-grid-caption');
                }
              }
            } else if (!next_node || !current_node.hasClass('figure-in-row')) {
               next_node = current_node.querySelector('.figure-caption');
            }
          } else if (current_node.hasClass('item-figure') && $(ev.target).hasClass('figure-caption')) {
            if (current_node.hasClass('figure-in-row')) {
              current_node.closest('.block-content-inner').removeClass('figure-focused');
            } 
            if(!next_node.length) { // we don't have a next node
              var cont = current_node.closest('.block-content-inner').nextElementSibling;
              if (cont != null) {
                next_node = cont.querySelector('.item:first-child');
              }
            } 
          }
          cn = current_node;

          if (!cn.hasClass("item") && cn.nodeName != 'FIGCAPTION') {
            return;
          }

          if (cn.hasClass('item-last') && u.editableCaretOnLastLine(current_node)) {
            return;
          }

          if (!next_node) {
            return;
          }

          if (next_node.hasClass('figure-caption') || next_node.hasClass('block-grid-caption')) {
            var figure = next_node.closest('.item-figure');
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
              u.setCaretAtPosition(next_node);
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
              u.setCaretAtPosition(next_node,0);
              ev.preventDefault();
              return false;
            }else {
              this.markAsSelected(next_node);
              this.setRangeAt(next_node);  
              ev.preventDefault();
              return false;
            }
          }

          if (next_node.hasClass('item-last') && next_node.querySelector('.placeholder-text') != null) {
            u.stopEvent(ev);
            u.setCaretAtPosition(next_node, 0);
            return false;
          }

          if(next_node.querySelectorAll('.placeholder-text').length) {
            u.setCaretAtPosition(next_node, 0);
            return false; 
          }

          if (crossing_section) {
            ev.preventDefault();
            this.setRangeAt(next_node);
            u.setCaretAtPosition(next_node, 0);
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
            var lastRow = current_node.closest('.block-grid').querySelector('.block-grid-row');
            if (lastRow != null) {
              prev_node = lastRow.querySelector('.item-figure:last-child');
            }
            
          } else if (current_node.hasClass('block-grid-row') && ev.target.hasClass('figure-caption')) {
              prev_node = current_node.querySelector('.figure-in-row:last-child');
          } else if(current_node.hasClass('block-grid-row')) {

          } else {
            if (prev_node.hasClass('item-figure') && !ev.target.hasClass('figure-caption')) {
              if (prev_node.hasClass('figure-in-row')) {
                var cont = prev_node.closest('.block-content-inner'),
                lastGraf = cont ? cont.querySelector('.item-figure:last-child') : null;
                if (cont != null && lastGraf != null && lastGraf.attr('name') == prev_node.attr('name')) {
                  prev_node = prev_node.querySelector('.figure-caption');
                }
              }else {
                var caption = prev_node.querySelector('.figure-caption');
                prev_node = caption;
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
            var grid = prev_node.closest('.block-grid');
            grid.addClass('grid-focused');
          }

          if (prev_node.hasClass('figure-caption')) {
            var figure = prev_node.closest('.item-figure');
            this.hideImageToolbar();
            this.markAsSelected(figure);
            this.setRangeAt(prev_node);
            this.scrollTo(prev_node);
            if (figure.hasClass('figure-in-row')) {
              figure.closest('.block-content-inner').addClass('figure-focused');
            }
            u.setCaretAtPosition(prev_node);
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
            u.setCaretAtPosition(prev_node);
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
              u.stopEvent(ev);
              u.setCaretAtPosition(prev_node, 0);
            }

            return false;
          }

          if (crossing_section) {
            ev.preventDefault();
            this.setRangeAt(prev_node);
            u.setCaretAtPosition(prev_node, 0);
            this.markAsSelected(prev_node);
            return false
          }
      }
    };

    Editor.prototype.insertFancyChar = function (event, text) {
      u.stopEvent(event);
      var node = this.getNode(),
          textVal,
          range = this.selection().getRangeAt(0);

        range.deleteContents();
      if(text == 'single' || text == 'double') {
        textVal = node.textContent;
        var leftQuote = false, rightQuote = false;

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
      }else if(text == 'dash') {
        text = DASH_UNICODE;
      }

      var appended = false;
      if (node.hasClass('pullquote') && !node.hasClass('with-cite') && (text == DOUBLEQUOTE_RIGHT_UNICODE || text == DASH_UNICODE)) {
        if (u.editableCaretAtEnd(node)) {
          let cite = ('<cite class="item-cite">' + DASH_UNICODE + ' </cite>');
          node.appendChild(u.generateElement(cite));
          u.setCaretAtPosition(cite,2);
          node.addClass('with-cite');
          appended = true;
        }
      } 

      if (!appended) {
        var textNode, range, sel, doc = document;
        textNode = doc.createTextNode(text);
        range.insertNode(textNode);

        range = doc.createRange();
        sel = this.selection();

        range.setStart(textNode, 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
    };

    // TODO for special chars insertion, keydown code is not differentiable
    Editor.prototype.handleKeyPress = function(e) { 
      var which = e.which;

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
      var which = e.which;
      
      this.current_node = this.getNode();
      var node = this.current_node;

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
      var tg = e.target;
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

      var anchor_node,
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
          var range = document.createRange();
          var figure = document.querySelector('.figure-focused .item-image');
          this.skip_keyup = true;
          if (figure != null) {
            var sel = this.selection();
            sel.removeAllRanges();
            range.selectNode(figure);
            sel.addRange(range);  
          }
        }
      }

      if (e.which == DELETE) {

        if (this.reachedTop && this.isFirstChar() && anchor_node.next('.item') == null) {
          var sec = anchor_node.closest('.block-content');

          if (sec != null && sec.next('.block-content') != null) {
            this.content_options.forEach( w => {
              if (w && w.contentId && w.contentId == 'SECTION') {
                w.handleDeleteKey(e, anchor_node);
              }
            });
          }

          var df = anchor_node.querySelector('.placeholder-text');
          const intt = anchor_node.next('.item');
          if (df != null && intt != null && intt.querySelectorAll('.placeholder-text').length)  {
            intt.parentNode.removeChild(intt);
            anchor_node.addClass('item-last');
            anchor_node.innerHTML = '<br />';
          } else {
            anchor_node.addClass('item-empty');
            anchor_node.innerHTML = '<br />';
          }
          u.setCaretAtPosition(anchor_node);
          return false;
        } else {
          if (anchor_node.querySelectorAll('.placeholder-text').length) {
            anchor_node.addClass('item-empty');
            anchor_node.innerHTML = '<br />';
            u.setCaretAtPosition(anchor_node);
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
        var sel = this.elNode.querySelector('.item-selected'),
            placeholderText = sel != null ? sel.querySelector('.placeholder-text') : null;

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
          // $(".item-selected").trigger("mouseup");
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
        let _this = this;
        setTimeout(function() {
          var node = _this.getNode();

          if ( !node ) {
            return;
          }
          
          node.removeAttribute('name');

          _this.setElementName(node);

          if (node.nodeName.toLowerCase() === "div") {
            node = _this.replaceWith("p", node);
          }
          let pctAll = node && node.nodeType == 1 ? node.children : null;
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

        var sel_anchor = this.selection().anchorNode;

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

        utils_anchor_node = u.getNode();  

        this.content_options.forEach( w => {
          var handled;
          if (w.handleBackspaceKey && !handled) {
            return handled = w.handleBackspaceKey(e, anchor_node);
          }
        });

        if (eventHandled) {
          e.preventDefault();
          return false;
        }

        // Undo to normal quotes and dash if user immediately pressed backspace
        var existingText = this.getCharacterPrecedingCaret(), 
            existingTextLength = existingText.length;
            charAtEnd = existingText.charAt(existingText.length - 1);

        if ( UNICODE_SPECIAL_CHARS.indexOf(charAtEnd) != -1) {
          this.handleSpecialCharsBackspace(charAtEnd);
          return false;
        }

        if (parent.hasClass("item-li") && this.getCharacterPrecedingCaret().length === 0) {
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

        var _this = this;
        setTimeout(function () {
          var backspacedTo = window.getSelection();
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
      var anchor_node = '';
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.type != 'Caret') { return; }
        var range = sel.getRangeAt(0);
        var commonAn = range.commonAncestorContainer;
        if (commonAn.nodeType == 3) { // its a text node
          var nv = commonAn.nodeValue;
          var toReplaceWith = '';
          if (charAtEnd == QUOTE_LEFT_UNICODE || charAtEnd == QUOTE_RIGHT_UNICODE) {
            toReplaceWith = "'";
          } else if (charAtEnd == DOUBLEQUOTE_LEFT_UNICODE || charAtEnd == DOUBLEQUOTE_RIGHT_UNICODE) {
            toReplaceWith = '"';
          } else if(charAtEnd == DASH_UNICODE) {
            toReplaceWith = "-";
          }
          var position = range.startOffset;
          if (nv.length == 1) {
            commonAn.nodeValue = toReplaceWith;
            var nrange = document.createRange();
            var sele = sel;
            
            nrange.setStart(commonAn, 1);
            nrange.collapse(true);
            sele.removeAllRanges();
            sele.addRange(nrange);  
          } else {
            var newNodeValue = nv.substr(0, position - 1) + toReplaceWith + nv.substr(position);
            commonAn.nodeValue = newNodeValue;
            var nrange = document.createRange();
            var sele = sel;

            nrange.setStart(commonAn, position);
            nrange.collapse(true);
            sele.removeAllRanges();
            sele.addRange(nrange);  
          }
        }
      }

    };

    Editor.prototype.handleKeyUp = function(e, node) {
      var anchor_node, next_item, utils_anchor_node, $utils_anchor_node;
      if (this.skip_keyup) {
        this.skip_keyup = null;
        return false;
      }

      this.toolbar.hide();
      this.reachedTop = false;
      anchor_node = this.getNode();
      
      utils_anchor_node = u.getNode();

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
              var cont = utils_anchor_node.closest('.with-background');
              if (cont != null && cont.next('.block-content') != null) {
                var nxtSection = cont.next('.block-content');
                var item = nxtSection != null ? nxtSection.querySelector('.item') : null;
                if (item != null) {
                  this.setRangeAt(item);
                }
                cont.parentNode.removeChild(cont);
                this.fixSectionClasses();
                this.setupFirstAndLast();
              } else if(cont != null && cont.next('.block-content') != null) {
                var havePrev = cont.prev('.block-content');
                if (havePrev != null) {
                  var items = nxtSection.querySelectorAll('.item');
                  if (items.length) {
                    var item = items[items.length - 1];
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
              u.stopEvent(e);
              anchor_node.innerHTML = this.subtitle_placeholder;
              return false;
            }
          }
        }

        if (anchor_node.hasClass("item-first")) {
          if(anchor_node.textContent.isEmpty() && anchor_node.closest('.block-first') != null) { 
      
            if(anchor_node.nextElementSibling && anchor_node.nextElementSibling.hasClass('item-last')) {
              u.stopEvent(e);
              anchor_node.innerHTML = this.title_placeholder;
              return false;
            }
          }
        }
      }
      
      var $tg = e.target;
      if ($tg.nodeName && $tg.nodeName.toLowerCase() == 'figcaption') {
        if ( $tg.textContent.isEmpty() ) {
          if ($tg.hasClass('block-grid-caption')) {
            if($tg.closest('.block-grid') != null) {
              $tg.closest('.block-grid').addClass('item-text-default');
            }
          } else {
            if($tg.closest('.item-figure') != null) {
              $tg.closest('.item-figure').addClass('item-text-default');
            }
          }
        } else {
          if ($tg.hasClass('block-grid-caption')) {
            if($tg.closest('.block-grid') != null) {
              $tg.closest('.block-grid').removeClass('item-text-default');
            }
          } else {
            if($tg.closest('.item-figure') != null) {
            $tg.closest('.item-figure').removeClass('item-text-default');
            }
          }
        }
      }

      if (e.which == BACKSPACE && $tg.hasClass('figure-caption')) {
        var caption = e.target, text = caption.textContent;
        if( text.killWhiteSpace().isEmpty() || (text.length == 1 && text == " ")) {
          if (!caption.attr('data-placeholder-value')) {
            caption.attr('data-placeholder-value', 'Type caption for image(Optional)');
          }
          caption.appendChild(u.generateElement('<span class="placeholder-text">' + caption.attr('data-placeholder-value') + '</span>'));
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
        var nodes = this.elNode.querySelectorAll('.item');
        var cache = [];
        for (var i = 0; i < nodes.length; i = i + 1) {
          var it = nodes[i];
          var o = it.getBoundingClientRect();
          cache.push([it.attr('name') ,o.top + it.height, o.left]);
        }
        cache.sort(function(a, b) {return a[1] - b[1]})
        this.__positionsCache = cache;
      }
    };

    Editor.prototype.generatePlaceholderForDrop = function(position) {
      var i = 0, cache = this.__positionsCache, len = cache.length;
      for (; i < len; i = i + 1) {
        if (cache[i][1] > position) {
          break;
        }
      }
      var item = i > 0 ? cache[i - 1] : cache[0];
      if(item) {
        var already = document.querySelector('#drag_pc_' + item);
        if (!already) {
          const dp = document.querySelector('.drop-placeholder');
          dp.parentNode.remove(dp);
          var o = `<div class="drop-placeholder" id="drag_pc_${item}"></div>`;
          u.generateElement(o).insertAfter( document.querySelector('[name="' + item + '"]'));
        }  
      }
    };


    Editor.prototype.handleDragEnter = function (e) {
      e.stopPropagation();
      this.createElementPositionsCache();
    };

    Editor.prototype.handleDragEnd = function (e) {
      e.stopPropagation();
      this.__positionsCache = {};
    };

    Editor.prototype.handleDrag = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var o = e.pageY;
      this.generatePlaceholderForDrop(o);
    };

    Editor.prototype.handleDrop = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var dragItem = e.dataTransfer;
      var files = dragItem.files;
      var haveUploads = false;
      if (!files || files.length == 0) {
        this.image_uploader.uploadFiles(files, true);
        haveUploads = true;
      } else {
        var html = dragItem.getData('text/html');
        if (html != '') {
          var placeholder = this.elNode.querySelector('.drop-placeholder');
          var m = placeholder.next('.item');
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
        document.querySelector('.drop-placeholder').hide();  
      } else {
        document.querySelector('.drop-placeholder').remove();
      }
      
      return false;
    };

    Editor.prototype.handleLineBreakWith = function(element_type, from_element) {
      var new_paragraph;
      new_paragraph = u.generateElement("<" + element_type + " class='item item-" + element_type + " item-empty item-selected'><br/></" + element_type + ">");

      if (from_element.hasClass('block-grid-caption')) {
        var cont = from_element.closest('.block-grid');
        if(cont != null) {
          new_paragraph.insertAfter(cont);
        }
      } else if (from_element.parentNode.matches('[class^="item-"]')) {
        new_paragraph.insertAfter(from_element.parentNode);
      } else {
        new_paragraph.insertAfter( from_element);
      }
      this.setRangeAt(new_paragraph);
      return this.scrollTo(new_paragraph);
    };

    Editor.prototype.replaceWith = function(element_type, from_element) {
      var new_paragraph;
      new_paragraph = u.generateElement("<" + element_type + " class='item item-" + element_type + " item-empty item-selected'><br/></" + element_type + ">");
      from_element.replaceWith(new_paragraph);
      this.setRangeAt(new_paragraph);
      this.scrollTo(new_paragraph);
      return new_paragraph;
    };
    
    // EVENT LISTENERS END //

    Editor.prototype.findNextFocusableElement = function (current_node) {
      var inner, cont, crossing_section = false,
        next_node;
      
      if (current_node.hasClass('item-li')) {
        var list = current_node.closest('.postList');
        if (list.nextElementSibling != null) {
          next_node = list.nextElementSibling;
        }
      }

      if (!next_node) {
        if (current_node.hasClass('figure-in-row')) {
           var row = current_node.closest('.block-grid-row');
           var nextRow = row != null ? row.nextElementSibling : null;

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
          }else { // probably a new section below then
            var section = inner.closest('section'),
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
        var cr = current_node.closest('.block-grid');
        var first = cr != null ? cr.querySelector('.block-grid-row:first-child .figure-in-row:first-child') : null;

        if (first != null && first == current_node) {
          var pr = cr.previousElementSibling;
          if (pr != null && !pr.hasClass('block-grid')) {
            prev_node = pr.querySelector('> .item:last-child');
          } else if(pr && pr.hasClass('block-grid')) {
            var lastCap = pr.querySelector('.block-grid-caption');
            prev_node = lastCap;
          }
        }
      }

      if (!prev_node) {
        if (cont.length && cont.hasClass('block-grid')) {
          var caption = cont.querySelector('.block-grid-caption');
          prev_node = caption;
        } else {
          if (cont != null) {
            prev_node = cont.querySelector('.item:last-child');
          } else {
            var section = current_node.closest('section'), 
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
      var prev = figure.previousElementSibling;
      var toGrid = false;

      if (prev != null) {
        if (prev.hasClass('item')) {
          figure.insertBefore(prev);
        }
      } else if(figure.hasClass('figure-full-width')) {

      } else {
        var column = figure.closest('.block-content-inner');
        var prevColumn = column.prev('.block-content-inner');
        if (prevColumn != null) {
          if (prevColumn.hasClass('block-grid')) {
            this.moveFigureInsideGrid(figure, nextColumn, false);
            toGrid = true;
          } else if (prevColumn.hasClass('center-column')) {
            prevColumn.appendChild(figure);
          } else if (prevColumn.hasClass('full-width-column')) {
            var prevBeforeFW = prevColumn.previousElementSibling;
            if (prevBeforeFW != null) {
              if (prevBeforeFW.hasClass('center-column')) {
                prevBeforeFW.appendChild(figure);
              } else if(prevBeforeFW.hasClass('full-width-column') || prevBeforeFW.hasClass('block-grid')) {
                var centerColumn = this.pushCenterColumn(prevBeforeFW, false);
                centerColumn.appendChild(figure);
              }
            }
          }
        }
      }

      if (!toGrid) {
        const fc = figure.classList;
        fc.remove('figure-in-row can-go-right can-go-down can-go-left');
      }
    };


    Editor.prototype.moveFigureDown = function (figure) {
      var next = figure.nextElementSibling, toGrid = false;
      figure.removeClass('figure-in-row');

      if (next != null) {
        if (next.hasClass('item')) {
          figure.insertAfter(next);
        }
      } else if (figure.hasClass('figure-full-width')) { // full width image.. find next container
        
      } else { // figure is first item in the column
        var column = figure.closest('.block-content-inner');
        var nextColumn = column != null ? column.next('.block-content-inner') : null;
        if (nextColumn != null) {
          if (nextColumn.hasClass('block-grid')) { // next item is grid, add image to the grid
            this.moveFigureInsideGrid(figure, nextColumn, true);
            toGrid = true;
          } else if (nextColumn.hasClass('center-column')) {  // next is text based center clumn.. prepend item there..
            u.prependNode(figure, nextColumn);

          } else if (nextColumn.hasClass('full-width-column')) { //next is full width image..move image to next column after that..
            var nextAfterFW = nextColumn.nextElementSibling;
            if (nextAfterFW != null) { // we have something after next column
              if (nextAfterFW.hasClass('center-column')) { // its centered column
                u.prependNode(figure, nextAfterFW);

              } else if (nextAfterFW.hasClass('full-width-column') || nextAfterFW.hasClass('block-grid')) { // anotehr full width here..or block grid put a center column inbetween and put figure there
                var centerColumn = this.pushCenterColumn(nextAfterFW, true);
                centerColumn.appendChild(figure);
              } 
            }
          }
        }
      }

      if (!toGrid) {
        const fcl = figure.classList;
        fcl.remove('can-go-left can-go-right can-go-down figure-in-row');
      }
    };


    Editor.prototype.moveFigureInsideGrid = function (figure, grid, firstItem) {
      if (firstItem) {
        var row = grid.querySelector('.block-grid-row:first-child');

        figure.addClass('figure-in-row');
        u.prependNode(figure, row);

        var figures = row.querySelectorAll('.item-figure');

        const evnt = new CustomEvent('Katana.Images.Restructure', {
          type: 'Katana.Images.Restructure',
          container: row,
          count: figures.length,
          figures: figures
        });

        this.elNode.dispatchEvent(evnt);
      } else {
        var row = grid.querySelector('.block-grid-row:last-child');
        figure.addClass('figure-in-row');
        row.appendChild(figure);

        var figures = row.querySelectorAll('.item-figure');

        const evnt = new CustomEvent('Katana.Images.Restructure', {
          type: 'Katana.Images.Restructure',
          container: row,
          count: figures.length,
          figures: figures
        });

        this.elNode.dispatchEvent(evnt);
      }
    };

    Editor.prototype.pushCenterColumn = function (place, before) {
      var div = u.generateElement(`<div class="center-column block-content-inner"></div>`);
      if(before) {
        div.insertBefore(place);
      } else {
        div.insertAfter( place);
      }
      return div;
    }

    Editor.prototype.addClassesToElement = function(element, forceKlass) {
      var n, name, new_el;
      n = element;

      let fK = typeof forceKlass != 'undefined' ? forceKlass : false;

      name = n.nodeName.toLowerCase();

      if (name == 'blockquote') {
        n.removeClass('text-center');
      } else {
        n.removeClass('text-center');
        n.removeClass('pullquote');
      }

      var hasEmpty = false;
      if (n.hasClass('item-empty')) {
        hasEmpty = true;
      }

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
            new_el = u.generateElement(`<h2 class='item item-h2'>${n.textContent}</h2>`);
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
        case "a":
        case 'strong':
        case 'em':
        case 'br':
        case 'b':
        case 'u':
        case 'i':
          n.removeAttribute('class');
          n.addClass('markup-' + name);
          n.wrap(`<p class='item item-p'></p>`);
          n = n.parentNode;
          break;  
        case "blockquote":
          n.removeAttribute('class');
          if (n.hasClass('pullquote')) {
            n.addClass('pullquote');
          };
          if (n.hasClass('with-cite')) {
            n.addClass('with-cite');
          }
          n.addClass('item item-' + name);
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
        /*var n = n;
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
        this.element = element;
      }
      let _this = this;
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
          if (Object.toString.call(cb) === '[object Function]') {
            return cb();
          }
      }, 20);

    };

    Editor.prototype.cleanContents = function(element) {

      var s;
      if (!element) {
        this.element = this.elNode.querySelectorAll('.block-content-inner');
      } else {
        this.element = element;
      }
 
      s = new Sanitize({
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
              var src = input.node.attr('src');
              if (u.urlIsFromDomain(src, 'youtube.com') || u.urlIsFromDomain(src, 'vimeo.com')) {
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

      if (this.element.length) {
        for (var i = 0; i < this.element.length; i = i + 1) {
          var el = this.element[i];
          let cleanNode = s.clean_node( el );
          el.innerHTML = '';
          el.appendChild(cleanNode);
        }
      }

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

      u.arrayToNodelist(ecw).wrap("<p class='item grap--p'></p>");
    };

    Editor.prototype.setElementName = function(element) {
      let el = element;
      if (el.tagName == 'LI') {
        return el.attr('name', u.generateId());
      }
      if (!el.matches('[name]')) {
        if(el.tagName == 'UL') {
          let lis = el.querySelectorAll(' > li');
          lis.forEach( item => {
            var li = item;
            if(!li.matches('[name]')) {
              li.attr('name', u.generateId());
            }
          });
        }
        return el.attr("name", u.generateId());
      }
    };


    Editor.prototype.handleSmartList = function(item, e) {
      var li, chars, match, regex;

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
      var list, paragraph, content;
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
      var type = match[0].charAt(0);
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
        if(li.children != null) {
          li.children.wrap(list);
        }
        if (li.querySelectorAll("br").length === 0) {
          li.appendChild(document.createElement("br"));
        }
        this.setRangeAt(li);
      }
      return li;
    };


    Editor.prototype.handleListBackspace = function(li, e) {
      var list, paragraph, content;
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
      var new_node;
      this.inmediateDeletion = false;
      new_node = u.generateElement(this.baseParagraphTmpl()).insertBefore(element);
      new_node.addClass("item-selected");
      this.setRangeAt( element.previousElementSibling );
      return element.parentNode.removeChild(element);
    };

    Editor.prototype.handleUnwrappedNode = function(element) {
      var new_node, tmpl;
      tmpl = u.generateElement(this.baseParagraphTmpl());
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
      var node, num, prev, range, sel, span;
      sel = this.selection();

      if (sel.isCollapsed && sel.rangeCount > 0) {
        if ( sel.anchorNode.hasClass('block-background') ) {
          return;
        }
        range = sel.getRangeAt(0);
        span = u.generateElement(this.baseParagraphTmpl());
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
          var pos = u.getImageSelectionDimension();  
          this.image_toolbar.render();
          this.image_toolbar.show();
          this.relocateImageToolbar(pos);
      }, 16);

    };

    Editor.prototype.relocateImageToolbar = function (position) {
      if(position == null) {
        return;
      }
      var height, left, padd, top, scrollTop;
      const ebr = this.image_toolbar.elNode.getBoundingClientRect();

      height = ebr.height;      
      padd = ebr.width / 2;
      top = position.top - height;
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
        var item = figure.querySelector('.item');
        if (item != null) {
          u.setCaretAtPosition(item, 0);
          item.focus();
          return;
        }
      }else {
        this.markAsSelected(figure.querySelector('.padding-cont'));
        figure.addClass('figure-focused item-selected');
        const bg = figure.closest(".block-grid");
        if(bg != null) {
          bg.addClass('figure-focused');
        }
        this.selection().removeAllRanges();
        this.displayImageToolbar();  
      }

      if (figure.hasClass('figure-in-row')) {
        const bci = figure.closest('.block-content-inner');
        if(bci != null) {
          bci.addClass('figure-focused grid-focused');
        }
      }

      figure.focus();
    };

    Editor.prototype.handleGrafFigureSelectImg = function (ev, matched) {
      var element;
      var text = this.getSelectedText();
      if (text && text.killWhiteSpace().length > 0) {
        return false;
      }
      element = matched ? matched : ev.currentTarget;
      var sec = element.closest('.with-background');
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
      var element = ev.currentTarget,
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

    Editor.prototype.handleFigureAnchorClick = function (ev) {
      
    };

    Editor.prototype.handleKeyDownOnFigure = function (ev, figure) {
      var keyCode = ev.keyCode;
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
      var tg = matched ? matched : ev.currentTarget,
        action = tg.attr('data-action'),
        figure = tg.closest('figure');
      
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
          var row = figure.closest('.block-grid-row');
          if (row != null) {
            const aEvent = new CustomEvent('Katana.Images.Add', {type: 'Katana.Images.Add', row: row});
            this.elNode.dispatchEvent(aEvent);
          } else {
            const fEvent = new CustomEvent('Katana.Images.Add', {type: 'Katana.Images.Add', figure: figure});
            this.elNode.dispatchEvent(fEvent);
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
      var elem = ev.target,
          frameContainer = elem.closest('.iframeContainer'),
          image = null;
      if(frameContainer != null) {  
        image = frameContainer.querySelector('[data-frame-url]');
      }
      if (image != null) {
        var frameUrl = image.attr('data-frame-url') + '&autoplay=1';
        var iframe = u.generateElement('<iframe src="' + frameUrl + '"></iframe>');
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
        var inners = section.querySelectorAll('.block-content-inner');
        if(inners.length) {
          for(var i = 0; i < inners.length; i = i + 1) {
            var curr = inners[i],
                k = i + 1,
                next = typeof inners[k] != 'undefined' ? inners[k] : false;
            if (next) {
              if(next.querySelectorAll('.item').length == 0) {
                next.parentNode.removeChild(next);
                return merge();
              }
              if (!curr.hasClass('block-grid') && u.elementsHaveSameClasses(curr, next)) {
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
      var inners = this.elNode.querySelectorAll('.block-content-inner');
      for( var i = 0; i < inners.length; i = i + 1) {
        var curr = inners[i];
        if (curr.querySelectorAll('.item').length == 0) {
          curr.parentNode.removeChild(curr);
        }
      }
      var blockGrid = this.elNode.querySelectorAll('.block-grid');
      for (var i = 0; i < blockGrid.length; i = i + 1) {
        var curr = blockGrid[i];
        if (curr.querySelectorAll('.item-figure').length == 0 ) {
          curr.parentNode.removeChild(curr);
        }
      }

      var blockRows = this.elNode.querySelectorAll('.block-grid-row');
      for (var i = 0; i < blockRows.length; i = i + 1) {
        var curr = blockRows[i];
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
      var toAdd = null;
      if (val == 'featured') {
        var menu = this.menuOpts[0];
        toAdd = document.createElement('option');
        toAdd.value = menu[0];
        toAdd.text = menu[1];
      } else if(val == 'latest') {
        var menu = this.menuOpts[1];
        toAdd = document.createElement('option');
        toAdd.value = menu[0];
        toAdd.text = menu[1];
      }

      var stfors = this.elNode.querySelectorAll('.block-stories [data-for="storytype"]');
      if (stfors.length) {
        for (var i = 0; i < stfors.length; i = i + 1) {
          var stf = stfors[i];
          if(toAdd != null) {
            stf.appendChild(toAdd);
          }
        }
      }
    };


    Editor.prototype.removeUnnecessarySections = function () {
      var sects = this.elNode.querySelectorAll('section');
      for (var i = 0; i < sects.length; i = i + 1) {
        var sec = sects[i];
        if (sec.querySelectorAll('.item').length == 0) {
          sec.parentNode.removeChild(sec);
        }
      }
      this.parallaxCandidateChanged();
    };


    Editor.prototype.mergeWithUpperSection = function (curr) {
      let upper = curr.prev('.block-content');
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
          insertSection = typeof insrtSection == 'undefined' || insrtSection == null ? u.generateElement(this.getSingleSectionTemplate()) : insrtSection,
          carryContainer = false;

      if (!carry) {
        newContainer = insertSection;
        newContainer.insertAfter(currContainer);
        carryContainer = u.generateElement(this.getSingleSectionTemplate());
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

      var splittedLayout = u.generateElement(this.getSingleLayoutTempalte());
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
      const sec = u.generateElement(this.getSingleSectionTemplate());
      const mb = sec.querySelector('.main-body');
      if(mb != null) {
        const mbs = '<div class="block-content-inner center-column"><p class="item item-p item-empty" name="'+u.generateId()+'"><br /></p></div>';
        mb.appendChild(u.generateElement(mbs));
      }
      this.elNode.appendChild(sec);
    };

    Editor.prototype.parallaxImages = [];

    // canvas scrolling related stuff
    Editor.prototype.parallaxCandidateChanged = function () {

      var sects = this.elNode.querySelectorAll('.image-in-background'),
          scrolling,
          _this = this,
          parallaxRect = this.parallax.getBoundingClientRect();
  
      if (this.parallaxContext && sects.length) {
        sects.forEach(se => {
          se.addClass('talking-to-canvas');
          se.removeClass('talk-to-canvas');
        });
      }

      this.parallaxImages = [];
      this.sectionsForParallax = sects;

      for (var i = 0; i < sects.length;i = i + 1) {
        var item = sects[i];
        var bg = item.querySelector('.block-background-image');
        if(bg != null) {
          // const styles = getComputedStyle(bg);
          let path = u.getStyle(bg, 'backgroundImage'); // styles.getPropertyValue('background-image');
          path = /^url\((['"]?)(.*)\1\)$/.exec(path);
          path = path ? path[2] : '';
          if (path != '') {
            var img = new Image();
            img.src = path;
            this.parallaxImages.push(img);  
          }
        }
      }

      scrolling = function() {
        _this.checkViewPortForCanvas();
      };

      if (sects != null && sects.length) {
        u.unregisterFromScroll('katana', scrolling);
        u.registerForScroll('katana', scrolling);
        this.checkViewPortForCanvas();
      }else if(!sects.length) {
        this.parallaxContext.clearRect(0, 0, parallaxRect.width, parallaxRect.height);
        u.unregisterFromScroll('katana', scrolling);
      }
    };

    Editor.prototype.calculatePosition = function (img, sect) {
      var iratio = img.naturalWidth / img.naturalHeight,
          sectionRect = sect.getBoundingClientRect(),
          sectionWidth = sectionRect.width,
          sectionHeight = sectionRect.height,
          sectionBottom = sectionRect.bottom,
          parallaxRect = this.parallax.getBoundingClientRect(),
          canvasHeight = parallaxRect.height,
          scaledImageWidth = sectionWidth,
          scaledImageHeight = scaledImageWidth / iratio;

      var padding = 50, singlePad = padding / 2;

      var iX, iY, iWidth, iHeight, cX, cY, cWidth, cHeight;
      
      if (sectionHeight > (scaledImageHeight - padding)) {
        var delta = sectionHeight - canvasHeight,
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
        }else {
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
      var i = 0,
          sect,
          sections = this.sectionsForParallax,
          isVisible = false
          draf = [],
          videos = [];

      for (; i < sections.length; i = i + 1) {
        sect = sections[i];
        isVisible = sect.isElementVerticallyInViewPort();

        if (isVisible) {
          if (this.mode == 'read' && sect.hasClass('video-in-background')) {
            videos.push(sect);
          } else {
            var img = this.parallaxImages[i],
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
          Katana.Player.cameInView(videos);  
        } else {
          Katana.Player.notInView();
        }
      }
      
    };

    Editor.prototype.addImageToCanvas = function (draf, image, pos) {
      for (var i = 0; i < draf.length;i = i + 1) {
        var image = draf[i][0];
        var pos = draf[i][1];
        this.parallaxContext.drawImage(
          image,
          pos.ix, pos.iy, 
          pos.iw, pos.ih, 
          pos.cx, pos.cy, 
          pos.cw, pos.ch);
      }
    };

    /** notes related **/
    Editor.prototype.showNoteIcon = function (ev) {
      if (this.notesManager) {
        this.notesManager.showNote(ev);
      }
    };
    /** notes related ends **/


    /** mobile touch handling **/
    var _pressWatch = null,
    _pressHappened = false;
    Editor.prototype.handleTap = function (ev) {
      if (_pressHappened) {
        setTimeout( () => {
          var txt = this.getSelectedText();
          if (txt == '' && _pressWatch) {
            clearInterval(_pressWatch);
            _pressHappened = false;
          }
        }, 100); // force wait
      }
    };

    Editor.prototype.handlePress = function (ev) {
      let _pressHappened = true, prev, _this = this;

      _pressWatch = setInterval( function() {
        var txt = _this.getSelectedText();
        if (prev && txt != prev && txt != '') {
          u.animationFrame.call(window, function() {
            _this.handleMouseUp(false);
          });
        } else if (!prev && txt != ''){
          u.animationFrame.call(window, function() {
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
      u.simpleStop(ev);
      return;
    };

    Editor.prototype.handleSectionToolbarItemMouseDown = function (ev) {
      u.simpleStop(ev);
      return;
    };

    Editor.prototype.handleSectionToolbarItemDblclick = function (ev) {
      u.simpleStop(ev);
      return;
    };

    Editor.prototype.handleSelectionStoryTypeChange = function (ev) {
      var ctg = ev.currentTarget,
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
      var ctg = ev.currentTarget;
      var section = ctg.closest('.block-stories');
      var val = parseInt(ctg.value);
      if (!isNaN(val) && section != null) {
        section.attr('data-story-count', val);
        var bd = section.querySelector('.main-body');
        this.fillStoryPreview(bd, val);
      }
    };

    return Editor;
  })(Katana.Base);

}).call(this);