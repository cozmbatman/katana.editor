import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

function ImageToolbar(opts) {
  this.opts = opts;
  this.stream = Stream;

  this.handleClick = this.handleClick.bind(this);
  this.initialize = this.initialize.bind(this);
  this.removeFigure = this.removeFigure.bind(this);
  this.commandPositionSwitch = this.commandPositionSwitch.bind(this);

  this.createlink = this.createlink.bind(this);
  this.handleInputEnter = this.handleInputEnter.bind(this);
  this.handleKeyDown = this.handleKeyDown.bind(this);
  this.shortCutKey = this.shortCutKey.bind(this);

  this.show = this.show.bind(this);
  this.hide = this.hide.bind(this);
  boot.it(this, opts);
}

ImageToolbar.prototype.el = '#mfImageToolbarBase';

ImageToolbar.prototype.events = {
  'mousedown .mf-menu-button': 'handleClick',
  'click .mf-menu-linkinput .mf-menu-button': 'closeInput',
  'keypress input': 'handleInputEnter',
  'keydown input': 'handleKeyDown',
};

ImageToolbar.prototype.menuGridMode = false;

ImageToolbar.prototype.hide = function hide() {
  this.elNode.removeClass('mf-menu--linkmode');
  this.elNode.addClass('hide');
};

ImageToolbar.prototype.initialize = function initialize() {
  const { opts } = this;
  this.current_editor = opts.editor;
  this.mode = opts.mode;
  this.config = opts.imageToolbarConfig || this.defaultConfig();
  this.controller = null;

  this.strReg = {
    whiteSpace: /(^\s+)|(\s+$)/g,
    mailTo: /^(?!mailto:|.+\/|.+#|.+\?)(.*@.*\..+)$/,
    http: /^(?!\w+?:\/\/|mailto:|\/|\.\/|\?|#)(.*)$/,
  };
};

ImageToolbar.prototype.setController = function setController(controller) {
  this.controller = controller;
};

ImageToolbar.prototype.defaultConfig = function defaultConfig() {
  if (this.mode === 'write') {
    return {
      buttons: [
        { a: 'sideleft', i: 'image-left-buldge' },
        { a: 'defaultsize', i: 'image-default' },
        { a: 'fullwidth', i: 'image-full-width' },
        { a: 'background', i: 'image-background' },
        { a: 'createlink', i: 'link' },
      ],
    };
  }
  return { buttons: [] };
};

ImageToolbar.prototype.template = function template() {
  if (this.config.buttons.length > 0) {
    return this.current_editor.templates.toolbarTemplate(this.config.buttons);
  }
  return '';
};

ImageToolbar.prototype.built = false;

ImageToolbar.prototype.render = function render() {
  if (!this.built) {
    this.elNode.innerHTML = this.template();
    this.built = true;
  }
  return this;
};

ImageToolbar.prototype.refresh = function refresh() {
  this.elNode.querySelectorAll('.mf-menu-button').forEach((el) => {
    el.removeClass('hide');
  });
};

ImageToolbar.prototype.show = function show() {
  if (this.mode === 'write') {
    this.elNode.addClass('mf-menu--active');
    this.displayHighlights();
    this.elNode.removeClass('hide');
  }
};

ImageToolbar.prototype.handleClick = function handleClick(ev, matched) {
  const element = matched ? matched.querySelector('.mf-icon') : ev.currentTarget.querySelector('.mf-icon');
  if (element) {
    let action = element.attr('data-action');
    if (action) { action = action.trim(); }
    if (/(?:createlink)/.test(action)) {
      this.actionIsLink(element, ev);
    } else {
      this.menuApply(action);
    }
    this.displayHighlights();
  }
  return false;
};

ImageToolbar.prototype.shortCutKey = function shortCutKey(key) {
  let handled = false;
  switch (key) {
    case 49: // left budge
      this.commandSideLeft();
      handled = true;
      break;
    case 50: // default
      this.commandDefaultSize();
      handled = true;
      break;
    case 51: // full width
      this.commandFullWidth();
      handled = true;
      break;
    case 52: // background image
      this.commandBackground();
      handled = true;
      break;
  }
  if (handled) {
    /* const _this = this;
    setTimeout(function () {
      // _this.current_editor.image_toolbar.show();
    }, 50); */
  }
};

ImageToolbar.prototype.actionIsLink = function actionIsLink(target, event) {
  if (target.hasClass('active')) {
    this.removeLink();
  } else {
    this.elNode.addClass('mf-menu--linkmode');
    if (typeof event !== 'undefined') {
      event.preventDefault();
    }

    setTimeout(() => {
      this.elNode.querySelector('input.mf-menu-input')?.focus();
    }, 30);
  }
};

ImageToolbar.prototype.removeLink = function removeLink() {
  const sel = document.querySelector('.item-figure.item-selected');
  sel?.querySelector('img')?.unwrap();
  this.elNode.querySelector('.mf-menu-input').value = '';
};

ImageToolbar.prototype.closeInput = function closeInput() {
  this.elNode.removeClass('mf-menu--linkmode');
  return false;
};

ImageToolbar.prototype.handleInputEnter = function handleInputEnter(e, matched) {
  if (e.which === 13) {
    if (matched) {
      this.createlink(matched);
      return;
    }
    this.createlink(e.target);
  }
};

ImageToolbar.prototype.handleKeyDown = function handleKeyDown(e) {
  if (e.which === 27) {
    this.hide();
  }
};

ImageToolbar.prototype.createlink = function createlink(input) {
  this.elNode.removeClass('mf-menu--linkmode');
  if (input.value !== '') {
    const inputValue = input.value.replace(this.strReg.whiteSpace, '').replace(this.strReg.mailTo, 'mailto:$1').replace(this.strReg.http, 'http://$1');
    const a = this.current_editor.templates.anchorMarkup(inputValue, 'markup-figure-anchor');
    document.querySelector('.item-figure.item-selected')?.querySelector('img')?.wrap(a);
    this.displayHighlights();
  }
};

ImageToolbar.prototype.addLink = function addLink(e) {
  if (this.mode === 'write') {
    const sel = this.current_editor.elNode.querySelector('.item-figure.item-selected');
    if (sel !== null) {
      this.actionIsLink(this.elNode.querySelector('[data-action="createlink"]')?.closest('li'), e);
    }
  }
};

ImageToolbar.prototype.menuApply = function menuApply(action) {
  if (this.menuGridMode) {
    if (action === 'defaultsize') {
      this.commandGridDefault();
    } else if (action === 'fullwidth') {
      this.commandGridFullWidth();
    }
  } else if (action === 'sideleft') {
    this.commandSideLeft();
  } else if (action === 'fullwidth') {
    this.commandFullWidth();
  } else if (action === 'defaultsize') {
    this.commandDefaultSize();
  } else if (action === 'background') {
    this.commandBackground();
  }
};

ImageToolbar.prototype.commandGridDefault = function commandGridDefault() {
  const grid = document.querySelector('.grid-focused');
  if (grid !== null) {
    grid.removeClass('block-grid-full');
    const rows = grid.querySelectorAll('.block-grid-row');
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const figures = row.querySelectorAll('.item-figure');
      this.stream.notifySubscribers('Katana.Images.Restructure', {
        container: row,
        count: figures.length,
        figures,
      });
    }
  }
};

ImageToolbar.prototype.commandGridFullWidth = function commandGridFullWidth() {
  const grid = document.querySelector('.grid-focused');
  if (grid !== null) {
    grid.addClass('block-grid-full');
    const rows = grid.querySelectorAll('.block-grid-row');
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const figures = row.querySelectorAll('.item-figure');
      this.stream.notifySubscribers('Katana.Images.Restructure', {
        container: row,
        count: figures.length,
        figures,
      });
    }
  }
};

ImageToolbar.prototype.pullFullWidthContainer = function pullFullWidthContainer() {
  const sel = document.querySelector('.item-figure.item-selected');
  if (sel && sel.closest('.full-width-column') !== null) {
    const curr = sel.closest('.full-width-column');
    if (curr == null) {
      return;
    }

    let prevContainer = curr.prev('.block-content-inner');
    const nextContainer = curr.next('.block-content-inner');
    const aspect = sel.querySelector('.padding-cont');

    aspect.attr('style', aspect.attr('data-style'));
    aspect.removeAttribute('data-style');

    if (curr.querySelectorAll('.item-figure').length === 1) { // we have not merged two full width containers together
      if (prevContainer) {
        prevContainer.appendChild(sel);
      } else {
        const ct = Utils.generateElement(this.current_editor.templates.getSingleLayoutTemplate());
        curr.parentNode.insertBefore(ct, curr);
        ct.appendChild(sel);
        prevContainer = ct;
      }
      if (prevContainer) {
        const aPChilds = prevContainer.children;
        const validPChilds = Array.prototype.filter.call(aPChilds, (el) => el.classList.contains('item'));
        if (validPChilds.length === 0) {
          prevContainer.parentNode.removeChild(prevContainer);
        }
      }

      if (nextContainer && !nextContainer.hasClass('full-width-column')) {
        const aNChilds = nextContainer.children;
        const vNChilds = Array.prototype.filter.call(aNChilds, (el) => el.classList.contains('item'));
        if (vNChilds.length > 0) {
          vNChilds.forEach((el) => {
            prevContainer.appendChild(el);
          });
        }

        nextContainer.parentNode.removeChild(nextContainer);
      }
      curr.parentNode.removeChild(curr);
    } else { // we have merged two full width containers together
      const firstGraf = curr.querySelector('.item-figure:first-child');
      const lastGraf = curr.querySelector('.item-figure:last-child');

      if (firstGraf && firstGraf === sel) { // add in upper container or create one
        if (prevContainer) {
          prevContainer.append(sel);
        } else {
          const singleTemplate = this.current_editor.templates.getSingleLayoutTemplate();
          const newCont = Utils.generateElement(singleTemplate);
          newCont.appendChild(sel);
          newCont.insertBefore(curr);
        }
      } else if (lastGraf && lastGraf === sel) { // add in lower container or create one
        if (nextContainer) {
          sel.insertBefore(nextContainer.querySelector('.item:first-child'));
        } else {
          const singleTemplate = this.current_editor.templates.getSingleLayoutTemplate();
          const newCont = Utils.generateElement(singleTemplate);
          newCont.appendChild(sel);
          newCont.insertAfter(curr);
        }
      } else { // create a layout single inbetween
        const newBottomContainer = Utils.generateElement('<div class="block-content-inner full-width-column"></div>');
        while (sel.nextElementSibling) {
          newBottomContainer.appendChild(sel.nextElementSibling);
        }
        const singleTemplate = this.current_editor.templates.getSingleLayoutTemplate();
        const newFigureContainer = Utils.generateElement(singleTemplate);
        newFigureContainer.appendChild(sel);
        newFigureContainer.insertAfter(curr);
        newBottomContainer.insertAfter(newFigureContainer);
      }
    }
  }
};

ImageToolbar.prototype.pushFullWidthContainer = function pushFullWidthContainer() {
  const sel = document.querySelector('.item-figure.item-selected');
  if (!sel || sel?.closest('.full-width-column') !== null) {
    return;
  }

  const singleTemplate = this.current_editor.templates.getSingleLayoutTemplate();
  const bottomContainer = Utils.generateElement(singleTemplate);
  const currentContainer = sel.closest('.block-content-inner');

  const singleFullTemplate = this.current_editor.templates.getSingleLayoutTemplate('full-width-column');
  const figureContainer = Utils.generateElement(singleFullTemplate);

  while (sel.nextElementSibling) {
    bottomContainer.appendChild(sel.nextElementSibling);
  }

  if (currentContainer.querySelectorAll('.item').length === 1) {
    const qitem = currentContainer.querySelector('.item');
    if (qitem === sel) {
      currentContainer.attr('class', '');
      currentContainer.addClass('block-content-inner full-width-column');
      bottomContainer.insertAfter(currentContainer);
    }
  } else {
    figureContainer.appendChild(sel);
    figureContainer.insertAfter(currentContainer);
    bottomContainer.insertAfter(figureContainer);
  }
};

ImageToolbar.prototype.removeFigureClasses = (figure) => {
  figure.removeClass('figure-full-width figure-to-left');
};

ImageToolbar.prototype.commandStretchImageInGrid = function commandStretchImageInGrid(figure) {
  let nxtFigures = figure.next('.figure-in-row');
  const currentRow = figure?.closest('.block-grid-row');
  let nextRow = currentRow?.next('.block-grid-row');

  if (nxtFigures != null) {
    if (nextRow == null) {
      const tmpl = Utils.generateElement(this.current_editor.templates.gridRowTemplate());
      currentRow.insertAdjacentElement('afterend', tmpl);
      nextRow = tmpl;
    }
    if (typeof nxtFigures.length === 'undefined') {
      nxtFigures = [nxtFigures];
    }
    nxtFigures.forEach((n) => {
      nextRow.insertBefore(n, nextRow.firstChild);
    });
  }

  const stretchRow = Utils.generateElement(this.current_editor.templates.gridRowTemplate('1'));
  stretchRow.appendChild(figure);
  currentRow.insertAdjacentElement('afterend', stretchRow);

  this.stream.notifySubscribers('Katana.Images.Restructure', {
    container: stretchRow,
    count: 1,
    figures: [figure],
  });

  // format figure in row just below stretch
  if (nextRow != null) {
    const nextRowFigures = nextRow.querySelectorAll('.item-figure');
    if (nextRowFigures.length) {
      nextRowFigures.forEach((el) => {
        el.attr('data-paragraph-count', nextRowFigures.length);
      });
      this.stream.notifySubscribers('Katana.Images.Restructure', {
        container: nextRow,
        count: nextRowFigures.length,
        figures: nextRowFigures,
      });
    } else {
      nextRow.parentNode.removeChild(nextRow);
    }
  }

  const currentRowFigures = currentRow.querySelectorAll('.item-figure');
  if (currentRowFigures.length) {
    currentRowFigures.forEach((el) => {
      el.attr('data-paragraph-count', currentRowFigures.length);
    });
    this.stream.notifySubscribers('Katana.Images.Restructure', {
      container: currentRow,
      count: currentRowFigures.length,
      figures: currentRowFigures,
    });
  } else {
    currentRow.parentNode.removeChild(currentRow);
  }
};

ImageToolbar.prototype.commandGoDownInGrid = function commandGoDownInGrid(sel) {
  const row = sel.closest('.block-grid-row');
  let nextRow = row?.next('.block-grid-row');

  if (row != null) {
    const figs = row.querySelectorAll('.item-figure');
    if (figs.length === 1) {
      // we are the only item.. should breakout from the grid now
      this.current_editor.moveFigureDown(sel);
      const grid = row.closest('.block-content-inner');
      const allFig = grid.querySelectorAll('.item-figure');
      grid.attr('data-paragraph-count', allFig.length);
      row.parentNode.removeChild(row);

      if (allFig.length === 1) {
        this.commandGoDownInGrid(allFig[0]);
      }
      if (allFig.length === 0) {
        const section = grid.closest('.block-content');
        grid.parentNode.removeChild(grid);
        if (section) {
          this.current_editor.mergeInnerSections(section);
        }
      }
      return;
    }
  }

  if (nextRow) {
    const tmpl = Utils.generateElement(this.current_editor.templates.gridRowTemplate());
    row.insertAdjacentElement('afterend', tmpl);
    nextRow = tmpl;
  }

  nextRow.prepend(sel);

  const newFigs = nextRow.querySelectorAll('.item-figure');
  nextRow.attr('data-paragraph-count', newFigs.length);

  this.stream.notifySubscribers('Katana.Images.Restructure', {
    container: nextRow,
    count: newFigs.length,
    figures: newFigs,
  });

  if (row.querySelectorAll('.item-figure').length === 0) {
    row.remove();
  } else {
    const figs = row.querySelectorAll('.item-figure');
    row.attr('data-paragraph-count', figs.length);
    this.stream.notifySubscribers('Katana.Images.Restructure', {
      container: row,
      count: figs.length,
      figures: figs,
    });
  }
};

ImageToolbar.prototype.commandGoUpInGrid = function commandGoUpInGrid(figure) {
  const currRow = figure.closest('.block-grid-row');
  let prevRow = currRow.prev('.block-grid-row');

  if (!prevRow && currRow.querySelectorAll('.item-figure').length === 1) {
    this.current_editor.moveFigureUp(figure);
    return;
  }

  if (!prevRow) {
    const tmpl = Utils.generateElement(this.current_editor.templates.gridRowTemplate());
    tmpl.insertBefore(currRow);
    prevRow = tmpl;
  }

  if (typeof prevRow.length !== 'undefined' && prevRow.length) {
    [prevRow] = prevRow;
  }

  if (prevRow !== null) {
    prevRow.append(figure);
    const prevFigures = prevRow.querySelectorAll('.item-figure');
    prevRow.attr('data-paragraph-count', prevFigures.length);

    this.stream.notifySubscribers('Katana.Images.Restructure', {
      container: prevRow,
      count: prevFigures.length,
      figures: prevFigures,
    });

    const currFigures = currRow.querySelectorAll('.item-figure');
    if (currFigures.length) {
      currRow.attr('data-paragraph-count', currFigures.length);
      this.stream.notifySubscribers('Katana.Images.Restructure', {
        container: currRow,
        count: currFigures.length,
        figures: currFigures,
      });
    } else {
      currRow.remove();
    }
  } else { // break out of grid

  }
};

/** commands * */
ImageToolbar.prototype.commandPositionSwitch = function commandPositionSwitch(direction, figure) {
  let sel = document.querySelector('.item-figure.item-selected');
  if (typeof figure !== 'undefined') {
    sel = figure;
  }
  if (!sel) {
    return;
  }
  let toSwitchWith = null;
  if (sel.hasClass('figure-in-row')) {
    if (direction === 'left') {
      toSwitchWith = sel.prev('.figure-in-row');
      if (toSwitchWith !== null) {
        sel.insertAdjacentElement('afterend', toSwitchWith);
      }
    } else if (direction === 'right') {
      toSwitchWith = sel.next('.figure-in-row');
      if (toSwitchWith !== null) {
        toSwitchWith.insertAdjacentElement('afterend', sel);
      }
    } else if (direction === 'down') {
      this.commandGoDownInGrid(sel);
    } else if (direction === 'stretch') {
      this.commandStretchImageInGrid(sel);
    } else if (direction === 'up') {
      this.commandGoUpInGrid(sel);
    }
  } else if (sel.hasClass('item-figure')) {
    if (direction === 'up') {
      this.commandMoveImageUp(sel);
    } else if (direction === 'down') {
      this.commandMoveImageDown(sel);
    }
  }

  sel.addClass('figure-focused');
  sel.focus();
  this.displayHighlights();
};

ImageToolbar.prototype.commandSideLeft = function commandSideLeft() {
  this.pullBackgroundContainer();
  this.pullFullWidthContainer();
  let sel = document.querySelector('.item-figure.item-selected');
  if (sel == null) {
    return;
  }
  this.removeFigureClasses(sel);
  sel.addClass('figure-to-left');

  // merge the sections
  this.current_editor.mergeInnerSections(sel.closest('section'));

  // activate the node
  sel = document.querySelector('.item-figure.item-selected');
  if (sel == null) { return; }
  this.current_editor.selectFigure(sel);
};

ImageToolbar.prototype.commandDefaultSize = function commandDefaultSize() {
  this.pullBackgroundContainer();
  this.pullFullWidthContainer();
  let sel = document.querySelector('.item-figure.item-selected');
  if (sel == null) { return; }
  this.removeFigureClasses(sel);

  // merge the sections
  this.current_editor.mergeInnerSections(sel.closest('section'));
  sel = document.querySelector('.item-figure.item-selected');
  if (sel == null) { return; }
  this.current_editor.selectFigure(sel);
};

ImageToolbar.prototype.commandFullWidth = function commandFullWidth() {
  this.pullBackgroundContainer();
  this.pushFullWidthContainer();
  let sel = document.querySelector('.item-figure.item-selected');
  if (sel == null) { return; }

  this.removeFigureClasses(sel);
  sel.addClass('figure-full-width');
  const padC = sel.querySelector('.padding-cont');
  if (padC != null) {
    const style = padC.attr('style');
    padC.attr('data-style', style);
    padC.removeAttribute('style');
  }

  // merge the sections
  this.current_editor.mergeInnerSections(sel.closest('section'));
  sel = document.querySelector('.item-figure.item-selected');

  if (sel == null) { return; }
  this.current_editor.selectFigure(sel);
};

ImageToolbar.prototype.commandBackground = function commandBackground() {
  const section = this.pushBackgroundContainer();
  const sel = document.querySelector('.item-figure.item-selected');
  if (sel == null) { return; }
  this.removeFigureClasses(sel);
  this.current_editor.selectFigure(section);
};

ImageToolbar.prototype.commandMoveImageUp = function commandMoveImageUp(figure) {
  this.current_editor.moveFigureUp(figure);
};

ImageToolbar.prototype.commandMoveImageDown = function commandMoveImageDown(figure) {
  this.current_editor.moveFigureDown(figure);
};
/** commands ends * */

ImageToolbar.prototype.displayHighlights = function displayHighlights() {
  let sel = document.querySelector('.item-figure.figure-focused'); let
    tag = '';
  this.refresh();

  const ac = this.elNode.querySelector('.active');
  if (ac != null) {
    ac.removeClass('active');
  }
  this.menuGridMode = false;
  if (sel == null) {
    sel = document.querySelector('.block-content.figure-focused');
  }
  if (sel == null) {
    return;
  }

  if (sel.hasClass('figure-in-row')) {
    this.menuGridMode = true;
    sel.removeClass('can-go-right can-show-add');

    this.elNode.querySelector('[data-action="background"]')?.closest('li')?.addClass('hide');

    const grid = sel.closest('.block-grid');
    if (grid.hasClass('block-grid-full')) {
      tag = 'fullwidth';
    } else {
      tag = 'defaultsize';
    }

    this.hideAction('sideleft');

    const nxt = sel.next('.figure-in-row');

    if (nxt != null) {
      sel.addClass('can-go-right');
    } else {
      sel.addClass('can-show-add');
    }

    sel.addClass('can-go-down');
  } else {
    this.hideAction('goleft', 'goright');
  }

  if (!this.menuGridMode) {
    if (!sel.hasClass('figure-in-row')) {
      if (sel.hasClass('figure-to-left')) {
        tag = 'sideleft';
      } else if (sel.hasClass('figure-full-width')) {
        tag = 'fullwidth';
      } else if (sel.hasClass('block-content')) {
        tag = 'background';
      } else {
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

    const simg = sel.querySelector('img');
    if (simg != null) {
      const sprnt = simg.parentElement;
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

  const gfocused = document.querySelectorAll('.grid-focused');
  const gfigureFoucsed = document.querySelectorAll('.figure-focused');

  if (gfocused.length && gfigureFoucsed.length === 0) {
    this.hideAction('goleft', 'sideleft', 'goright', 'background');
  }

  if (tag) {
    this.highlight(tag);
  }
};

ImageToolbar.prototype.hideAction = function hideAction(...names) {
  for (let i = 0; i < names.length; i += 1) {
    this.elNode.querySelector(`[data-action="${names[i]}"]`)?.closest('li')?.hide();
  }
};

ImageToolbar.prototype.showAction = function showAction(...names) {
  for (let i = 0; i < names.length; i += 1) {
    this.elNode.querySelector(`[data-action="${names[i]}"]`)?.closest('li')?.show();
  }
};

ImageToolbar.prototype.highlight = function highlight(tag) {
  this.elNode.querySelector(`[data-action="${tag}"]`)?.closest('li')?.addClass('active');
};

/** layout related modifications * */
ImageToolbar.prototype.removeFigure = function removeFigure(figure) {
  const container = figure.closest('.block-grid-row');
  if (container !== null) {
    figure.remove();
    const remaining = container.querySelectorAll('.item-figure');
    if (remaining.length) {
      container.attr('data-paragraph-count', remaining.length);
      this.stream.notifySubscribers('Katana.Images.Restructure', {
        container,
        count: remaining.length,
        figures: remaining,
      });
    }

    const grid = container.closest('.block-grid');
    if (remaining.length === 0) { // row is empty now, remove it
      container.remove();
    }
    // check if we grid has any image left inside
    const gridImages = grid.querySelectorAll('.item-image');
    if (gridImages.length) {
      const len = gridImages.length;
      if (len > 1) { // more than one image remaining, just update para count for the grid
        grid.attr('data-paragraph-count', len);
      } else {
        // one image remains, unwrap this baby
        this.unwrapSingleFigure(grid);
      }
    } else {
      // don't have any image left in grid remove it..
      // should never happen, we should just unwrap at last figure remaining in grid
      grid.remove();
    }
  } else {
    const itemSelected = this.current_editor.replaceWith('p', figure);
    const nextItem = itemSelected.next('.item');
    if (nextItem) {
      itemSelected.parentNode.removeChild(itemSelected);
      nextItem.addClass('item-selected');
      this.current_editor.setRangeAt(nextItem);
    } else {
      this.current_editor.setRangeAt(document.querySelector('.item-selected'));
    }
  }
  this.hide();
};

ImageToolbar.prototype.unwrapSingleFigure = function unwrapSingleFigure(container) {
  const figures = container.querySelectorAll('.item-figure');
  let moveIn;
  let firstGraf;

  if (figures.length === 1) {
    // try to move content in the upper section if we have one..
    moveIn = container.prev('.block-content-inner');
    if (moveIn) {
      const itemFigures = container.querySelectorAll('.item-figure');
      itemFigures.forEach((ll) => {
        moveIn.appendChild(ll);
      });
      container.remove();
      figures.removeClass('figure-in-row can-go-right can-go-down');
      figures.removeAttribute('style');
    } else {
      moveIn = container.next('.block-content-inner');
      if (moveIn) {
        const allFirst = moveIn.children;
        const vAlLFirst = Array.prototype.filter.call(allFirst, (el) => el.classList.contains('item'));
        firstGraf = vAlLFirst.length > 0 ? vAlLFirst[0] : null;

        if (firstGraf) {
          const itf = container.querySelector('.item-figure');
          if (itf) {
            itf.insertBefore(firstGraf);
          }
        } else {
          container.querySelectorAll('.item-figure').forEach((el) => {
            moveIn.appendChild(el);
          });
        }
        container.remove();
        figures.removeClass('figure-in-row can-go-right can-go-down');
        figures.removeAttribute('style');
      } else {
        container.removeClass('block-grid figure-focused can-go-right can-go-down')
          .addClass('center-column')
          .removeAttribute('data-paragraph-count');
        figures.removeClass('figure-in-row');
        figures.removeAttribute('style');
        figures.unwrap();
      }
    }

    let ig = figures.querySelectorAll('.item-image');
    if (ig.length) {
      [ig] = ig;
      this.setAspectRatio(figures, ig.naturalWidth, ig.naturalHeight);
    }
  }

  this.current_editor.cleanUpInnerSections();
};

ImageToolbar.prototype.setAspectRatio = function setAspectRatio(figure, w, h) {
  let height; let maxWidth; let ratio; let
    width;
  maxWidth = 760;
  ratio = 0;
  width = w;
  height = h;
  const maxHeight = 700;

  if (figure.hasClass('figure-in-row')) {
    const brg = figure.closest('.block-grid-row');
    if (brg != null) {
      maxWidth = brg.getBoundingClientRect().width;
    }
  }

  if (width > maxWidth) {
    ratio = maxWidth / width;
    height *= ratio;
    width *= ratio;
  } else if (height > maxHeight) {
    ratio = maxHeight / height;
    width *= ratio;
    height *= ratio;
  }

  const fillRatio = (height / width) * 100;

  const figP = figure.querySelector('.padding-cont');
  if (figP != null) {
    figP.style.maxWidth = width;
    figP.style.maxHeight = height;
  }

  const figPB = figure.querySelector('.padding-box');
  if (figPB != null) {
    figPB.style.paddingBottom = `${fillRatio}%`;
  }
};

// background image related
ImageToolbar.prototype.pushBackgroundContainer = function pushBackgroundContainer() {
  const figure = document.querySelector('.item-figure.item-selected');
  const isIFrame = figure?.hasClass('item-iframe');

  if (figure == null) {
    return null;
  }

  const img = figure.querySelector('img');
  const tmplSecVideo = this.current_editor.templates.templateBackgroundSectionForVideo();
  const tmplSecImage = this.current_editor.templates.templateBackgroundSectionForImage();

  const tmpl = isIFrame ? Utils.generateElement(tmplSecVideo) : Utils.generateElement(tmplSecImage);
  const bgImg = tmpl.querySelector('.block-background-image');
  bgImg?.attr('style', `background-image:url(${img.attr('src')})`);
  const aspectLock = tmpl.querySelector('.block-background');

  aspectLock.attr('data-height', img.attr('data-height'));
  aspectLock.attr('data-width', img.attr('data-width'));
  aspectLock.attr('data-image-id', img.attr('data-image-id'));
  aspectLock.attr('data-aspect', figure.querySelector('.padding-box').attr('style'));

  if (figure.hasClass('figure-full-width')) {
    aspectLock.attr('data-style', figure.querySelector('.padding-cont').attr('data-style'));
  } else {
    aspectLock.attr('data-style', figure.querySelector('.padding-cont').attr('style'));
  }

  if (!figure.hasClass('item-text-default')) {
    const caption = tmpl.querySelector('.item-caption');
    caption.innerHTML = figure.querySelector('.figure-caption')?.innerHTML;
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
    const sctTmpl = Utils.generateElement(this.current_editor.templates.getSingleSectionTemplate());

    sctTmpl.querySelector('.main-body')?.appendChild(Utils.generateElement(this.current_editor.templates.getSingleLayoutTemplate()));
    sctTmpl.querySelector('.main-body .center-column')?.appendChild(Utils.generateElement(this.current_editor.templates.baseParagraphTmpl()));
    sctTmpl.insertAfter(tmpl);
    this.current_editor.fixSectionClasses();
  }
  tmpl.addClass('figure-focused');

  if (!isIFrame) {
    tmpl.addClass('talk-to-canvas');
  }

  this.current_editor.parallaxCandidateChanged();
  return tmpl;
};

ImageToolbar.prototype.pullBackgroundContainer = function pullBackgroundContainer() {
  const section = document.querySelector('.figure-focused');
  const isIFrame = section?.hasClass('section--video');
  let figure;
  let path;

  if (section == null || !section.hasClass('block-content')) {
    return;
  }

  const frameTemplate = this.current_editor.templates.getFrameTemplate();
  const figureTemplate = this.current_editor.templates.getFigureTemplate();
  figure = isIFrame ? Utils.generateElement(frameTemplate) : Utils.generateElement(figureTemplate);
  const backgrounded = section.querySelector('.block-background');
  const backgroundedImage = section.querySelector('.block-background-image');
  path = backgroundedImage != null ? Utils.getStyle(backgroundedImage, 'backgroundImage') : null;
  const captionCurrent = section.querySelector('.item-sectionCaption');
  const currentContent = section.querySelector('.main-body').querySelector('.block-content-inner');

  const figureName = figure.attr('name');

  path = path.replace('url(', '').replace(')', '');
  path = path.replace('"', '').replace('"', '');

  const ig = figure.querySelector('img');

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

  // remove the continue writing
  section.querySelector('.placeholder-text')?.closest('.item')?.remove();

  const caption = figure.querySelector('.figure-caption');

  if (captionCurrent != null && !captionCurrent.hasClass('item-text-default')) {
    caption.innerHTML = captionCurrent.innerHTML;
    figure.removeClass('item-text-default');
  }

  figure.wrap(this.current_editor.getSingleLayoutTemplate());

  figure = figure.closest('.center-column');

  if (section.nextElementSibling != null) {
    const sect = section.nextElementSibling;
    const inner = sect?.querySelector('.main-body');
    if (inner != null) {
      inner.insertBefore(currentContent, inner.firstChild);
      inner.insertBefore(figure, inner.firstChild);
      this.current_editor.mergeInnerSections(sect);
    }
    section.parentNode.removeChild(section);
  } else if (section.previousElementSibling != null) {
    const sect = section.previousElementSibling;
    const inner = sect?.querySelector('.main-body');
    if (inner != null) {
      inner.appendChild(figure);
      inner.appendChild(currentContent);
      this.current_editor.mergeInnerSections(sect);
    }
    section.parentNode.removeChild(section);
  } else {
    const newSect = Utils.generateElement(this.current_editor.templates.getSingleSectionTemplate());
    const innerSection = newSect.querySelector('.main-body');

    innerSection.appendChild(figure);
    innerSection.appendChild(currentContent);
    innerSection.insertAfter(section);
    section.parentNode.removeChild(section);
  }

  this.current_editor.removeUnnecessarySections();
  this.current_editor.fixSectionClasses();

  figure = figure.querySelector(`[name="${figureName}"]`);

  if (figure != null) {
    this.current_editor.markAsSelected(figure);
    figure.addClass('figure-focused').removeClass('uploading');
    figure.querySelector('.padding-cont')?.addClass('selected');
  }

  this.current_editor.setupFirstAndLast();
  this.current_editor.parallaxCandidateChanged();
};
// backgronnd image related ends

export default ImageToolbar;
