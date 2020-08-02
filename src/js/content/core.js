import boot from '../boot';
import Utils from '../utils';

function Manager(opts) {
  this.opts = opts;

  this.initialize = this.initialize.bind(this);
  this.move = this.move.bind(this);

  this.toggleOptions = this.toggleOptions.bind(this);
  this.handleClick = this.handleClick.bind(this);
  boot.it(this, opts);
}

Manager.prototype.showedAgainst = null;

Manager.prototype.events = {
  'click .inlineTooltip-button.control': 'toggleOptions',
  'click .inlineTooltip-menu button': 'handleClick',
};

Manager.prototype.initialize = function initialize() {
  const { opts } = this;
  this.widgets = opts.widgets || [];
  this.current_editor = opts.editor;
};

Manager.prototype.template = function template() {
  let menu = '';

  this.widgets.forEach((b) => {
    const dataActionValue = b.action ? `data-action-value='${b.action}'` : '';
    if (b.template) {
      menu += b.template();
    } else {
      menu += this.current_editor.templates.contentBasicButton(b, dataActionValue);
    }
    return menu;
  });

  return this.current_editor.templates.contentBasicButtonsWrap(menu);
};

Manager.prototype.render = function render() {
  this.elNode.innerHTML = this.template();
  return this;
};

Manager.prototype.getView = function getView() {
  return 'html'; //
};

Manager.prototype.hide = function hide() {
  this.elNode.removeClass('is-active is-scaled').addClass('hide');
};

Manager.prototype.show = function show(showedAgainst) {
  document.querySelector('.hide-placeholder')?.removeClass('hide-placeholder');

  this.showedAgainst = showedAgainst;
  this.elNode.addClass('is-active');
  this.elNode.removeClass('hide');
};

Manager.prototype.move = function move(coords) {
  let coordLeft; let pullSize;

  const tooltip = this.elNode;
  const controlWidth = tooltip.querySelector('.control')?.getBoundingClientRect().width;

  const controlSpacing = Utils.getStyle(tooltip.querySelector('.inlineTooltip-menu'), 'paddingLeft');
  // eslint-disable-next-line radix
  pullSize = parseInt(controlWidth) + parseInt(controlSpacing.replace(/px/, ''));
  if (Number.isNaN(pullSize)) {
    pullSize = 0;
  }
  coordLeft = coords.left - pullSize;
  const coordTop = coords.top;
  if (Utils.getWindowWidth() <= 768) {
    coordLeft = 5;
  }
  const { style } = this.elNode;
  style.top = `${coordTop}px`;
  style.left = `${coordLeft}px`;
};

Manager.prototype.toggleOptions = function toggleOptions() {
  this.elNode.removeClass('choose-section');
  if (this.elNode.hasClass('is-scaled')) {
    this.elNode.removeClass('is-scaled');
    if (this.showedAgainst && this.showedAgainst.querySelector('.placeholder-text')) {
      this.showedAgainst.removeClass('hide-placeholder');
    }
  } else {
    this.elNode.addClass('is-scaled');
    if (this.showedAgainst && this.showedAgainst.querySelector('.placeholder-text')) {
      this.showedAgainst.addClass('hide-placeholder');
    }
  }
  return false;
};

Manager.prototype.findWidgetByAction = function findWidgetByAction(name) {
  return this.widgets.filter((e) => e.action === name || name.indexOf(e.action) !== -1);
};

Manager.prototype.handleClick = function handleClick(ev, matched) {
  const name = matched ? matched.attr('data-action') : ev.currentTarget.attr('data-action');
  const subName = name.replace('inline-menu-', '');
  const detectedWidget = this.findWidgetByAction(subName);

  if (detectedWidget && detectedWidget.length > 0) {
    detectedWidget[0].handleClick(ev, matched);
  }
  return false;
};
export default Manager;
