(function () {
  var u = Katana.utils;

  Katana.Toolbar.ImageToolbar = (function (_super) {
    u.__extends(ImageToolbar, _super);

    function ImageToolbar() {
      this.handleClick = u.__bind(this.handleClick, this);
      this.initialize = u.__bind(this.initialize, this);
      this.removeFigure = u.__bind(this.removeFigure, this);
      this.commandPositionSwitch = u.__bind(this.commandPositionSwitch, this);

      this.createlink = u.__bind(this.createlink, this);
      this.handleInputEnter = u.__bind(this.handleInputEnter, this);
      this.handleKeyDown = u.__bind(this.handleKeyDown, this);
      this.shortCutKey = u.__bind(this.shortCutKey, this);

      this.show = u.__bind(this.show, this);
      this.hide = u.__bind(this.hide, this);
      return ImageToolbar.__super__.constructor.apply(this, arguments);
    }

    ImageToolbar.prototype.el = '#mfImageToolbarBase';

    ImageToolbar.prototype.events = {
      "mousedown .mf-menu-button": "handleClick",
      "click .mf-menu-linkinput .mf-menu-button": "closeInput",
      "keypress input": "handleInputEnter",
      "keydown input": "handleKeyDown"
    };

    ImageToolbar.prototype.menuGridMode = false;

    ImageToolbar.prototype.hide = function () {
      this.elNode.removeClass('mf-menu--linkmode');
      this.elNode.addClass('hide');
    };

    ImageToolbar.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.current_editor = opts.editor;
      this.mode = opts.mode;
      this.config = opts.imageToolbarConfig || this.defaultConfig();
      this.controller = null;

      this.strReg = {
        whiteSpace: /(^\s+)|(\s+$)/g,
        mailTo: /^(?!mailto:|.+\/|.+#|.+\?)(.*@.*\..+)$/,
        http: /^(?!\w+?:\/\/|mailto:|\/|\.\/|\?|#)(.*)$/
      };
    };

    ImageToolbar.prototype.setController = function (controller) {
      this.controller = controller;
    };

    ImageToolbar.prototype.defaultConfig = function () {
      if(this.mode == 'write') {
        return {
          buttons: [
          {a:'sideleft',i: 'image-left-buldge'},
          {a:'defaultsize',i: 'image-default'},
          {a:'fullwidth', i: 'image-full-width'},
          {a:'background',i:'image-background'},
          {a:'createlink',i:'link'}
          ]
        }; 
      }
      return {buttons: []};
    };

    ImageToolbar.prototype.template = function () {
      if(this.config.buttons.length > 0) {
        let html = `<div class="mf-menu-linkinput">
              <input class="mf-menu-input" placeholder="http://">
              <div class="mf-menu-button mf-link-close">&#215;</div>
            </div>
            <ul class='mf-menu-buttons'>`;

        this.config.buttons.forEach((item) => {
          html += `<li class='mf-menu-button'><i class="mf-icon mfi-${item.i}" data-action=" ${item.a}"></i></li>`;
        });
        html += `</ul>`;
        return html;  
      }
      return '';
    };

    ImageToolbar.prototype.built = false;

    ImageToolbar.prototype.render = function () {
      if(!this.built) {
        var html = this.template();
        this.elNode.innerHTML = html;
        this.built = true;  
      }      
      return this;
    };

    ImageToolbar.prototype.refresh = function() {
      this.elNode.querySelectorAll('.mf-menu-button').forEach(el => {
        el.removeClass('hide');
      })
    };

    ImageToolbar.prototype.show = function () {
      if(this.mode == 'write') {
        this.current_editor.image_toolbar._show();  
      }
    };

    ImageToolbar.prototype._show = function () {
      this.elNode.addClass("mf-menu--active");
      this.displayHighlights();
      this.elNode.removeClass('hide');
    };

    ImageToolbar.prototype.handleClick = function (ev, matched) {
      var action, element, input;
      if(matched) {
        element = matched.querySelector('.mf-icon');
      } else {
        element = ev.currentTarget.querySelector('.mf-icon');
      }
      if(element != null) {

        action = element.attr("data-action");
        if (/(?:createlink)/.test(action)) {
          this.actionIsLink(ev.currentTarget);
        } else {
          this.menuApply(action);
        }
  
        this.displayHighlights();
      }
      return false;
    };

    ImageToolbar.prototype.shortCutKey = function (key, event) {
      var didSomething = false;
      switch(key) {
        case 49: // left budge
          this.commandSideLeft();
          didSomething = true;
        break;
        case 50: // default
          this.commandDefaultSize();
          didSomething = true;
        break;
        case 51: // full width
          this.commandFullWidth();
          didSomething = true;
        break;
        case 52: // background image
          this.commandBackground();
          didSomething = true;
        break;
      }
      if (didSomething) {
        var _this = this;
        setTimeout(function () {
          // _this.current_editor.image_toolbar.show();  
        }, 50);
      }
    };

    ImageToolbar.prototype.actionIsLink = function (target, event) {
      if (target.hasClass("active")) {
        this.removeLink();
      } else {
        this.elNode.addClass("mf-menu--linkmode");
        if(this.elNode.querySelector("input.mf-menu-input") != null) {
          this.elNode.querySelector("input.mf-menu-input").focus();
        }
        if (typeof event != 'undefined') {
          event.preventDefault();
        }
      }
    };

    ImageToolbar.prototype.removeLink = function () {
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel != null) {
        sel.querySelector('img').unwrap();
      }
      this.elNode.querySelector('.mf-menu-input').value = '';
    };

    ImageToolbar.prototype.closeInput = function(e) {
      this.elNode.removeClass("mf-menu--linkmode");
      return false;
    };

    ImageToolbar.prototype.handleInputEnter = function(e, matched) {
      if (e.which === 13) {
        if(matched) {
          return this.createlink(matched);
        } else {
          return this.createlink(e.target);
        }
      }
    };

    ImageToolbar.prototype.handleKeyDown = function (e) {
      var which = e.which,
        bd,
        overLay;
      if (which == 27) { 
        this.hide();
      }
    };

    ImageToolbar.prototype.createlink = function(input) {
      var action, 
          inputValue;
          this.elNode.removeClass("mf-menu--linkmode");
      if (input.value != '') {
        inputValue = input.value.replace(this.strReg.whiteSpace, "").replace(this.strReg.mailTo, "mailto:$1").replace(this.strReg.http, "http://$1");
        var a = `<a href="${inputValue}" data-href="${inputValue}" class="markup-anchor markup-figure-anchor"></a>`;
        var sel = document.querySelector('.item-figure.item-selected');
        if (sel != null) {
          sel.querySelector('img').wrap(a);
        }
        this.displayHighlights();
      }
    };

    ImageToolbar.prototype.addLink = function (e) {
      if (this.mode == 'write') {
        var sel = this.current_editor.elNode.querySelector('.item-figure.item-selected');
        if (sel != null) {
          this.actionIsLink(this.elNode.querySelector('[data-action="createlink"]').closest('li'), e);
          return false;
        }
      }
    };

    ImageToolbar.prototype.menuApply = function (action) {
      if (this.menuGridMode) {
        if (action == 'defaultsize') {
          this.commandGridDefault();
        } else if(action == 'fullwidth') {
          this.commandGridFullWidth();
        }
      } else {
        if(action == 'sideleft') {
          this.commandSideLeft();
        }else if(action == 'fullwidth') {
          this.commandFullWidth();
        }else if(action == 'defaultsize') {
          this.commandDefaultSize();
        }else if(action == 'background') {
          this.commandBackground();
        }  
      }
    };

    ImageToolbar.prototype.commandGridDefault = function () {
      var grid = document.querySelector('.grid-focused');
      if(grid != null) {
        grid.removeClass('block-grid-full');
  
        var rows = grid.querySelectorAll('.block-grid-row');
        for (var i = 0; i < rows.length; i = i + 1) {
          var row = rows[i];
          var figures = row.querySelectorAll('.item-figure');
          const evnt = new CustomEvent('Katana.Images.Restructure', {
            type: 'Katana.Images.Restructure',
            container: row,
            count: figures.length,
            figures: figures
          });

          this.current_editor.elNode.dispatchEvent(evnt);
        }
      }
    };
    
    ImageToolbar.prototype.commandGridFullWidth = function () {
      var grid = document.querySelector('.grid-focused');
      if(grid != null) {
        grid.addClass('block-grid-full');
        var rows = grid.querySelectorAll('.block-grid-row');
        for (var i = 0; i < rows.length; i = i + 1) {
          var row = rows[i];
          var figures = row.querySelectorAll('.item-figure');
          const evnt = new CustomEvent('Katana.Images.Restructure', {
            type: 'Katana.Images.Restructure',
            container: row,
            count: figures.length,
            figures: figures
          });
          this.current_editor.elNode.dispatchEvent(evnt);
        }
      }
    }    

    ImageToolbar.prototype.pullFullWidthContainer = function () {
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel != null && sel.closest('.full-width-column') != null) {
        var curr = sel.closest('.full-width-column');
        if(curr == null) {
          return;
        }

        var prevContainer = curr.prev('.block-content-inner'),
          nextContainer = curr.next('.block-content-inner'),
          aspect = sel.querySelector('.padding-cont');

          aspect.attr('style', aspect.attr('data-style'));
          aspect.removeAttribute('data-style');

        if(curr.querySelectorAll('.item-figure').length == 1) { // we have not merged two full width containers together
          if (prevContainer != null) {
            prevContainer.appendChild(sel);
          }else {
            var ct = u.generateElement(this.current_editor.getSingleLayoutTempalte());
            ct.insertBefore(curr);
            ct.appendChild(sel);
            prevContainer = ct;
          }
          if(!prevContainer.querySelectorAll(' > .item').length) {
            prevContainer.parentNode.removeChild(prevContainer);
          }

          if(!nextContainer.hasClass('full-width-column')) {
            prevContainer.appendChild(nextContainer.querySelector(' > .item'));
            nextContainer.parentNode.removeChild(nextContainer);
          }
          curr.parentNode.removeChild(curr);
        }else { // we have merged two full width containers together
          var firstGraf = curr.querySelector('.item-figure:first-child'),
          lastGraf = curr.querySelector('.item-figure:last-child');

          if (firstGraf != null && firstGraf == sel) { // add in upper container or create one
            if (prevContainer != null) {
              prevContainer.appendChild(sel);
            } else {
              var newCont = u.generateElement(this.current_editor.getSingleLayoutTempalte());
              newCont.appendChild(sel);
              newCont.insertBefore(curr);
            }
          }else if(lastGraf != null && lastGraf == sel) { // add in lower container or create one
            if (nextContainer != null) {
              sel.insertBefore(nextContainer.querySelector('.item:first-child'));
            } else {
              var newCont = u.generateElement(this.current_editor.getSingleLayoutTempalte());
              newCont.appendChild(sel);
              newCont.insertAfter(curr);
            }
          }else { // create a layout single inbetween
            var newBottomContainer = u.generateElement('<div class="block-content-inner full-width-column"></div>');
            while(sel.nextElementSibling != null){
              newBottomContainer.appendChild(sel.nextElementSibling);
            }
            var newFigureContainer = u.generateElement(this.current_editor.getSingleLayoutTempalte());
            newFigureContainer.appendChild(sel);
            newFigureContainer.insertAfter(curr);
            newBottomContainer.insertAfter(newFigureContainer);
          }          
        }
      }
    };

    ImageToolbar.prototype.pushFullWidthContainer = function () {
      var sel = document.querySelector('.item-figure.item-selected');
      if (sel == null || sel.closest('.full-width-column') != null) {
        return;
      }
      var bottomContainer = u.createElement('<div class="block-content-inner center-column"></div>'),
      currentContainer = sel.closest('.block-content-inner'),
      figureContainer = u.createElement('<div class="block-content-inner full-width-column"></div>');

      while(sel.nextElementSibling != null) {
        bottomContainer.appendChild(sel.nextElementSibling);
      }

      if (currentContainer.querySelectorAll('.item').length == 1) {
        const qitem = currentContainer.querySelector('.item');
        if(qitem == sel) {
          currentContainer.attr('class','');
          currentContainer.addClass('block-content-inner');
          currentContainer.addClass('full-width-column');
          bottomContainer.insertAfter(currentContainer);
        }
      }else {
        figureContainer.appendChild(sel);
        figureContainer.insertAfter(currentContainer);
        bottomContainer.insertAfter(figureContainer);  
      }
    };

    ImageToolbar.prototype.removeFigureClasses = function (figure) {
      figure.removeClass('figure-full-width');
      figure.removeClass('figure-to-left');
    };

    ImageToolbar.prototype._commandStretchImageInGrid = function(figure) {
      var nxtFigures = figure.next('.figure-in-row'),
          currentRow = figure != null ? figure.closest('.block-grid-row') : null,
          nextRow = currentRow != null ? currentRow.next('.block-grid-row') : null;

      if (nxtFigures != null) {
        if(nextRow == null) {
          var tmpl = `<div class="block-grid-row" data-name="${u.generateId()}"></div>`;
          tmpl = u.createElement(tmpl);
          tmpl.insertAfter(currentRow);
          nextRow = tmpl;
        }
        u.prependNode(nxtFigures, nextRow);
      }

      var stretchRow = `<div class="block-grid-row" data-name="${u.generateId()}" data-paragraph-count="1"></div>`;
      stretchRow = u.createElement(stretchRow);
      stretchRow.appendChild(figure);
      stretchRow.insertAfter(currentRow);

      const reEvnt = new CustomEvent('Katana.Images.Restructure', {
        type: 'Katana.Images.Restructure',
        container: stretchRow,
        count: 1,
        figures: [figure]
      });
      this.current_editor.elNode.dispatchEvent(reEvnt);

      // format figure in row just below stretch
      if (nextRow != null) {
        var nextRowFigures = nextRow.querySelectorAll('.item-figure');
        if(nextRowFigures.length) {
          nextRowFigures.forEach(el => {
            el.attr('data-paragraph-count', nextRowFigures.length);
          });
          const rEvnt = new CustomEvent('Katana.Images.Restructure', {
            type: 'Katana.Images.Restructure',
            container: nextRow,
            count: nextRowFigures.length,
            figures: nextRowFigures
          });
          this.current_editor.elNode.dispatchEvent(rEvnt);
        } else {
          nextRow.parentNode.removeChild(nextRow);
        }
      }

      var currentRowFigures = currentRow.querySelectorAll('.item-figure');
      if (currentRowFigures.length) {
        currentRowFigures.forEach(el => {
          el.attr('data-paragraph-count', currentRowFigures.length);
        });
        const cEvnt = new CustomEvent( 'Katana.Images.Restructure', {
          type: 'Katana.Images.Restructure',
          container: currentRow,
          count: currentRowFigures.length,
          figures: currentRowFigures
        });
        this.current_editor.elNode.dispatchEvent(cEvnt);
      } else {
        currentRow.parentNode.removeChild(currentRow);
      }
    };

    ImageToolbar.prototype._commandGoDownInGrid = function (sel) {
      var row = sel.closest('.block-grid-row'),
        nextRow = row != null ? row.next('.block-grid-row') : null;

      if(row != null) {
        var figs = row.querySelectorAll('.item-figure');
        if (figs.length == 1) {
          // we are the only item.. should breakout from the grid now
          this.current_editor.moveFigureDown(sel);
          return;
        }
      }
      if (nextRow == null) {
        var tmpl = `<div class="block-grid-row" data-name="${u.generateId()}"></div>`;
        tmpl = u.generateElement(tmpl);
        tmpl.insertAfter(row);
        nextRow = tmpl;
      }

      nextRow.prepend(sel);

      var newFigs = nextRow.querySelectorAll('.item-figure');
      nextRow.attr('data-paragraph-count', newFigs.length);

      this.current_editor.$el.trigger({
        type: 'Katana.Images.Restructure',
        container: nextRow,
        count: newFigs.length,
        figures: newFigs
      });

      if (row.querySelectorAll('.item-figure').length == 0) {
        row.remove();
      } else {
        var figs = row.querySelectorAll('.item-figure');
        row.attr('data-paragraph-count', figs.length);
        this.current_editor.$el.trigger({
          type: 'Katana.Images.Restructure',
          container: row,
          count: figs.length,
          figures: figs
        });
      }
    };

    ImageToolbar.prototype._commandGoUpInGrid = function (figure) {
      var currRow = figure.closest('.block-grid-row'),
          prevRow = currRow.prev('.block-grid-row');

      if (prevRow.length == 0 && currRow.querySelectorAll('.item-figure').length == 1) {
        this.current_editor.moveFigureUp(figure);
        return;
      }

      if (prevRow.length == 0) {
        var tmpl = `<div class="block-grid-row" data-name="${u.generateId()}"></div>`;
        tmpl = u.createElement(tmpl);
        tmpl.insertBefore(currRow);
        prevRow = tmpl;
      }

      if (prevRow.length) {
        prevRow.append(figure);
        var prevFigures = prevRow.querySelectorAll('.item-figure');
        prevRow.attr('data-paragraph-count', prevFigures.length);

        this.current_editor.$el.trigger({
          type: 'Katana.Images.Restructure',
          container: prevRow,
          count: prevFigures.length,
          figures: prevFigures
        });

        var currFigures = currRow.querySelectorAll('.item-figure');
        if (currFigures.length) {
          currRow.attr('data-paragraph-count', currFigures.length);
          this.current_editor.$el.trigger({
            type: 'Katana.Images.Restructure',
            container: currRow,
            count: currFigures.length,
            figures: currFigures
          });
        } else {
          currRow.remove();
        }
      } else { // break out of grid 

      }
    };

    /** commands **/
    ImageToolbar.prototype.commandPositionSwitch = function (direction, figure) {
      var sel = document.querySelector('.item-figure.item-selected'), toSwitchWith;
      if (typeof figure != 'undefined') {
        sel = figure;
      }
      if(sel == null) {
        return;
      }
      if (sel.hasClass('figure-in-row')) {
        if (direction == 'left') {
          toSwitchWith = sel.prev('.figure-in-row');
          if(toSwitchWith != null) {
            sel.insertBefore(toSwitchWith);
          }
        } else if(direction == 'right') { 
          toSwitchWith = sel.next('.figure-in-row');
          if(toSwitchWith != null) {
            toSwitchWith.insertBefore(sel);
          }
        } else if(direction == 'down') {
          this._commandGoDownInGrid(sel);
        } else if(direction == 'stretch') {
          this._commandStretchImageInGrid(sel);
        } else if(direction == 'up') {
          this._commandGoUpInGrid(sel);
        }
      } else if (sel.hasClass('item-figure')) {
        if (direction == 'up') {
          this._commandMoveImageUp(sel);
        } else if(direction == 'down') {
          this._commandMoveImageDown(sel);
        }
      }

      sel.addClass('figure-focused');
      sel.focus();
      this.displayHighlights();
    };

    ImageToolbar.prototype.commandSideLeft = function () {
      this.pullBackgroundContainer();
      this.pullFullWidthContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {
        return;
      }
      this.removeFigureClasses(sel);
      sel.addClass('figure-to-left');

      // merge the sections
      this.current_editor.mergeInnerSections(sel.closest('section'));

      //activate the node
      sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) { return; }
      this.current_editor.selectFigure(sel);
    };

    ImageToolbar.prototype.commandDefaultSize = function () {
      this.pullBackgroundContainer();
      this.pullFullWidthContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.removeFigureClasses(sel); 

      // merge the sections
      this.current_editor.mergeInnerSections(sel.closest('section'));     
      sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.current_editor.selectFigure(sel);
    };

    ImageToolbar.prototype.commandFullWidth = function () {
      this.pullBackgroundContainer();
      this.pushFullWidthContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.removeFigureClasses(sel);
      sel.addClass('figure-full-width');
      var padC = sel.querySelector('.padding-cont');
      if(padC != null) {
        var style = padC.attr('style');
        padC.attr('data-style', style);
        padC.removeAttr('style');
      }
      

      // merge the sections
      this.current_editor.mergeInnerSections(sel.closest('section'));
      sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.current_editor.selectFigure(sel);
    };

    ImageToolbar.prototype.commandBackground = function () {
      var section = this.pushBackgroundContainer();
      var sel = document.querySelector('.item-figure.item-selected');
      if(sel == null) {return;}
      this.removeFigureClasses(sel);
      this.current_editor.selectFigure(section);
    };

    ImageToolbar.prototype._commandMoveImageUp = function (figure) {
      this.current_editor.moveFigureUp(figure);
    };

    ImageToolbar.prototype._commandMoveImageDown = function (figure) {
      this.current_editor.moveFigureDown(figure);
    };
    /** commands ends **/

    ImageToolbar.prototype.displayHighlights = function () {
      var sel = document.querySelector('.item-figure.figure-focused'), tag = '';
      this.refresh();
      var ac = this.$el.querySelector('.active');
      if(ac != null) {
        ac.removeClass('active');
      }
      this.menuGridMode = false;
      if (sel == null) {
        sel = document.querySelector('.block-content.figure-focused');
      }
      if(sel == null) {
        return;
      }

      if (sel.hasClass('figure-in-row')) {
        this.menuGridMode = true;
        sel.removeClass('can-go-right can-show-add');

        var bgE = this.$el.querySelector('[data-action="background"]');
        if(bgE != null) {
          bgE.parent('li').addClass('hide');
        }

        var grid = sel.closest('.block-grid');
        if (grid.hasClass('block-grid-full')) {
          tag = 'fullwidth';
        } else {
          tag = 'defaultsize';
        }
        
        this.hideAction('sideleft');
        
        var nxt = sel.next('.figure-in-row');
        
        if (nxt != null) {
          sel.addClass('can-go-right');
        }

        if(nxt == null) {
          sel.addClass('can-show-add');
        }

        sel.addClass('can-go-down');

      } else {
        this.hideAction('goleft', 'goright');
      }

      if (!this.menuGridMode) {
        if(!sel.hasClass('figure-in-row')) {
          if (sel.hasClass('figure-to-left')) {
            tag = 'sideleft';
          }else if(sel.hasClass('figure-full-width')) {
            tag = 'fullwidth';
          }else if(sel.hasClass('block-content')) {
            tag = 'background';
          }else {
            tag = 'defaultsize';
          }
        }

      
        // no position change for iframe embeds
        if (sel.hasClass('item-iframe')) {
          this.hideAction('goleft', 'goright');
          
          if (!sel.hasClass('can-go-background')) {
            this.hideAction('background');
          }
        }

        if (sel.closest('.with-background') != null && !sel.hasClass('with-background')) {
          this.hideAction('fullwidth', 'background');
        }

        // no fullsize form small photos 
        if (sel.hasClass('n-fullSize')) {
          this.hideAction('fullwidth', 'background');
        }

        let simg = sel.querySelector('img');
        if(simg != null) {
          let sprnt = simg.parentElement;
          if (sprnt != null && sprnt.hasClass('markup-anchor')) {
            this.highlight('createlink');
          } 
        }
      }

      if (sel.hasClass('item-iframe')) {
        this.hideAction('createlink');
      } else {
        this.showAction('createlink');
      }

      let gfocused = document.querySelectorAll('.grid-focused');
      let gfigureFoucsed = document.querySelectorAll('.figure-focused');

      if (gfocused.length && gfigureFoucsed.length == 0) {
        this.hideAction('goleft', 'sideleft', 'goright', 'background');
      }

      if(tag != '') {
        this.highlight(tag);  
      }
    };

    ImageToolbar.prototype.hideAction = function(...names) {
      for(const name of names) {
        let go = this.$el.querySelector('[data-action="' + name + '"]');
        if(go != null) {
          let pl = go.parent('li');
          if(pl != null) {
            pl.hide();
          }
        }
      }
    }

    ImageToolbar.prototype.showAction = function(...names) {
      for(const name of names) {
        let go = this.$el.querySelector('[data-action="' + name + '"]');
        if(go != null) {
          let pl = go.parent('li');
          if(pl != null) {
            pl.show();
          }
        }
      }
    }

    ImageToolbar.prototype.highlight = function (tag) {
      const tg = this.$el.querySelector('[data-action="' + tag + '"]');
      if(tg != null) {
        let tgp = tg.parent("li");
        if(tgp != null) {
          tgp.addClass('active');
        }
      }
    };

    /** layout related modifications **/
    ImageToolbar.prototype.removeFigure = function (figure) {
      var container = figure.closest('.block-grid-row');
      if (container != null) {
        figure.remove();
        var remaining = container.querySelectorAll('.item-figure');
        if (remaining.length) {
          container.attr('data-paragraph-count', remaining.length);
          this.current_editor.$el.trigger({
            type: 'Katana.Images.Restructure',
            container: container,
            count: remaining.length,
            figures: remaining
          });
        }

        var grid = container.closest('.block-grid');
        if (remaining.length == 0) { // row is empty now, remove it
          container.remove();
        }
        // check if we grid has any image left inside
        var gridImages = grid.querySelectorAll('.item-image');
        if (gridImages.length) {
          var len = gridImages.length;
          if (len > 1) { // more than one image remaining, just update para count for the grid
            grid.attr('data-paragraph-count', len);
          } else {
            // one image remains, unwrap this baby
            this.unwrapSingleFigure(grid);
          }
        } else { // don't have any image left in grid remove it.. // should never happen, we should just unwrap at last figure remaining in grid
          grid.remove();
        }
        

      } else {
        this.current_editor.replaceWith("p", figure);
        this.current_editor.setRangeAt(document.querySelector(".item-selected"));
      }
    };

    ImageToolbar.prototype.unwrapSingleFigure = function (container) {
      var figures = container.querySelectorAll('.item-figure'),
          moveIn,
          firstGraf;

      if (figures.length == 1) {
        // try to move content in the upper section if we have one..
        moveIn = container.prev('.block-content-inner');
        if (moveIn != null) {
          const itemFigures = container.querySelectorAll('.item-figure');
          itemFigures.forEach( ll => {
            moveIn.appendChild(ll);
          });
          container.remove();
          figures.removeClass('figure-in-row can-go-right can-go-down');
          figures.removeAttr('style');
        } else {
          moveIn = container.next('.block-content-inner');
          if (moveIn != null) {
            firstGraf = moveIn.querySelector(' > .item');
            if(firstGraf != null) {
              let itf = container.querySelector('.item-figure');
              if(itf != null) {
                itf.insertBefore(firstGraf);
              }
            }else {
              moveIn.append(container.querySelectorAll('.item-figure'));
            }
            container.remove();
            figures.removeClass('figure-in-row can-go-right can-go-down');
            figures.removeAttr('style');
          } else {
            container.removeClass('block-grid figure-focused can-go-right can-go-down').removeAttr('data-paragraph-count').addClass('center-column');
            figures.removeClass('figure-in-row');
            figures.removeAttr('style');
            figures.unwrap();
          }
        }

        var ig = figures.querySelectorAll('.item-image');
        if (ig.length) {
          ig = ig[0];
          this._setAspectRatio(figures, ig.naturalWidth, ig.naturalHeight);
        }
      }

      this.current_editor.cleanUpInnerSections();
    };

    ImageToolbar.prototype._setAspectRatio = function (figure, w, h) {
      var fill_ratio, height, maxHeight, maxWidth, ratio, result, width;
      maxWidth = 760;
      maxHeight = 700;
      ratio = 0;
      width = w;
      height = h;

      if (figure.hasClass('figure-in-row')) {
        maxWidth = figure.closest('.block-grid-row').width();
      }
      
      if (width > maxWidth) {
        ratio = maxWidth / width;
        height = height * ratio;
        width = width * ratio;
      } else if (height > maxHeight) {
        ratio = maxHeight / height;
        width = width * ratio;
        height = height * ratio;
      }

      fill_ratio = height / width * 100;

      var figP = figure.querySelector(".padding-cont");
      if(figP != null) {
        figP.style.maxWidth = width;
        figP.style.maxHeight = height;
      }
      
      var figPB = figure.querySelector(".padding-box");
      if(figPB != null) {
        figPB.style.paddingBottom = fill_ratio + "%";
      }

    }

    // background image related
    ImageToolbar.prototype.pushBackgroundContainer = function () {
      var figure = document.querySelector('.item-figure.item-selected'),
          isIFrame = figure != null ? figure.hasClass('item-iframe') : false;

      if (figure == null) {
        return;
      }

      var img = figure.querySelector('img'),
          tmpl = isIFrame ? u.generateElement(this.current_editor.templateBackgroundSectionForVideo()) : u.generateElement(this.current_editor.templateBackgroundSectionForImage()),
          bgImg = tmpl.querySelector('.block-background-image').attr('style', 'background-image:url(' + img.attr('src') + ')'),
          aspectLock = tmpl.querySelector('.block-background'),
          bottomSection,
          currentSection,
          isFirst = false;

      aspectLock.attr('data-height', img.attr('data-height'));
      aspectLock.attr('data-width', img.attr('data-width'));
      aspectLock.attr('data-image-id', img.attr('data-image-id'));
      aspectLock.attr('data-aspect', figure.querySelector('.padding-box').attr('style'));

      if (figure.hasClass('figure-full-width')) {
        aspectLock.attr('data-style', figure.querySelector('.padding-cont').attr('data-style'));  
      }else {
        aspectLock.attr('data-style', figure.querySelector('.padding-cont').attr('style'));  
      }

      if (!figure.hasClass('item-text-default')) {
        var caption = tmpl.querySelector('.item-sectionCaption');
        caption.innerHTML = figure.querySelector('.figure-caption').innerHTML;
        caption.removeClass('item-text-default');
      }

      if (figure.hasClass('item-iframe')) {
        bgImg.attr('data-frame-url', img.attr('data-frame-url'));
        bgImg.attr('data-frame-aspect', img.attr('data-frame-aspect'));
      }

      this.current_editor.splitContainer(figure, tmpl, false);

      figure.parentNode.removeChild(figure);

      // if we are the only section left after mergin we create one at the bottom of the image container
      if (tmpl.hasClass('block-first block-last')) {
        var sectionTmpl = u.generateElement(this.current_editor.getSingleSectionTemplate());
            sectionTmpl.querySelector('.main-body').appendChild(u.generateElement(this.current_editor.getSingleLayoutTempalte()));
            sectionTmpl.querySelector('.main-body .center-column').appendChild(u.generateElement(this.current_editor.baseParagraphTmpl()));
        sectionTmpl.insertAfter(tmpl);
        this.current_editor.fixSectionClasses();
      }
      tmpl.addClass('figure-focused');

      if (!isIFrame) {
        tmpl.addClass('talk-to-canvas');
      }

      this.current_editor.parallaxCandidateChanged()
      return tmpl;
    };

    ImageToolbar.prototype.pullBackgroundContainer = function () {
      var section = document.querySelector('.figure-focused'),
          isIFrame = section != null ? section.hasClass('section--video') : false,
          figure,
          currentContent,
          backgrounded,
          backgroundedImage,

          path,
          appendInSection,
          onlyOneSection = false,
          caption,
          ig;

      if (section == null || !section.hasClass('block-content')) {
        return;
      }

      figure = isIFrame ? u.generateElement(this.current_editor.getFrameTemplate()) : u.generateElement(this.current_editor.getFigureTemplate());
      backgrounded = section.querySelector('.block-background');
      backgroundedImage = section.querySelector('.block-background-image');
      path = backgroundedImage != null ? u.getStyle(backgroundedImage , 'backgroundImage') : null;
      captionCurrent = section.querySelector('.item-sectionCaption');
      currentContent = section.querySelector('.main-body').querySelector('.block-content-inner');

      var figureName = figure.attr('name');
      
      path = path.replace('url(','').replace(')','');
      path = path.replace('"','').replace('"','');

      ig = figure.querySelector('img');

      ig.attr('src', path);
      ig.attr('data-width', backgrounded.attr('data-width'));
      ig.attr('data-height', backgrounded.attr('data-height'));
      ig.attr('data-image-id', backgrounded.attr('data-image-id'));

      if (isIFrame) {
        ig.attr('data-frame-url', backgroundedImage.attr('data-frame-url'));
        ig.attr('data-frame-aspect', backgroundedImage.attr('data-frame-aspect'));  
        figure.addClass('can-go-background');
      }
    
      figure.querySelector('.padding-box').attr('style', backgrounded.attr('data-aspect'));
      figure.querySelector('.padding-cont').attr('style', backgrounded.attr('data-style'));

      //remove the continue writing 
      section.querySelector('.placeholder-text').closest('.item').remove();

      caption = figure.querySelector('.figure-caption');

      if (captionCurrent != null && !captionCurrent.hasClass('item-text-default')) {
        caption.innerHTML = captionCurrent.innerHTML;
        figure.removeClass('item-text-default');
      }

      figure.wrap(u.generateElement(this.current_editor.getSingleLayoutTempalte()));

      figure = figure.closest('.center-column');

      if (section.nextElementSibling != null) {
        var sect = section.nextElementSibling,
            inner = sect.querySelector('.main-body');
        if(inner != null) {
          u.prependNode(inner, currentContent);
          u.prependNode(inner, figure);
          this.current_editor.mergeInnerSections(sect);
        }
        section.parentNode.removeChild(section);
      } else if (section.previousElementSibling != null) {
        var sect = section.previousElementSibling,
            inner = sect.querySelector('.main-body');
        if(inner != null) {
          inner.appendChild(figure);
          inner.appendChild(currentContent);
          this.current_editor.mergeInnerSections(sect);
        }
        section.parentNode.removeChild(section);
      }else {
        onlyOneSection = true;
        var newSection = u.generateElement(this.current_editor.getSingleSectionTemplate()),
            innerSection =  newSection.querySelector('.main-body');

        innerSection.appendChild(figure);
        innerSection.appendChild(currentContent);
        innerSection.insertAfter(section);
        section.parentNode.removeChild(section);
      }

      this.current_editor.removeUnnecessarySections();
      this.current_editor.fixSectionClasses();

      figure = figure.querySelector('[name="'+figureName+'"]');

      if(figure != null) {
        this.current_editor.markAsSelected(figure);
        figure.addClass('figure-focused').removeClass('uploading');
        let fpct = figure.querySelector('.padding-cont');
        if(fpct != null) {
          fpct.addClass('selected');
        }
      }
      
      this.current_editor.setupFirstAndLast();

      this.current_editor.parallaxCandidateChanged()
    };
    // backgronnd image related ends 

    return ImageToolbar;

  })(Katana.Toolbar);
}).call(this);