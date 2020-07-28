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

Manager.prototype.initialize = function () {
  const { opts } = this;
  this.widgets = opts.widgets || [];
  this.current_editor = opts.editor;
};

Manager.prototype.template = function () {
  let menu = '';

  this.widgets.forEach((b) => {
    const data_action_value = b.action ? `data-action-value='${b.action}'` : '';
    if (b.template) {
      menu += b.template();
    } else {
      menu += this.current_editor.templates.contentBasicButton(b, data_action_value);
    }
    return menu;
  });

  return this.current_editor.templates.contentBasicButtonsWrap(menu);
};

Manager.prototype.render = function () {
  this.elNode.innerHTML = this.template();
  return this;
};

Manager.prototype.getView = function () {
  return 'html'; //
};

Manager.prototype.hide = function () {
  this.elNode.removeClass('is-active is-scaled').addClass('hide');
};

Manager.prototype.show = function (showedAgainst) {
  document.querySelector('.hide-placeholder')?.removeClass('hide-placeholder');

  this.showedAgainst = showedAgainst;
  this.elNode.addClass('is-active');
  this.elNode.removeClass('hide');
};

Manager.prototype.move = function (coords) {
  let control_spacing; let control_width; let coord_left; let coord_top; let pull_size; let
    tooltip;

  tooltip = this.elNode;
  control_width = tooltip.querySelector('.control')?.getBoundingClientRect().width;

  control_spacing = Utils.getStyle(tooltip.querySelector('.inlineTooltip-menu'), 'paddingLeft');
  pull_size = parseInt(control_width) + parseInt(control_spacing.replace(/px/, ''));
  if (isNaN(pull_size)) {
    pull_size = 0;
  }
  coord_left = coords.left - pull_size;
  coord_top = coords.top;
  if (Utils.getWindowWidth() <= 768) {
    coord_left = 5;
  }
  const { style } = this.elNode;
  style.top = `${coord_top}px`;
  style.left = `${coord_left}px`;
};

Manager.prototype.toggleOptions = function () {
  this.elNode.removeClass('choose-section');
  if (this.elNode.hasClass('is-scaled')) {
    this.elNode.removeClass('is-scaled');
    if (this.showedAgainst && this.showedAgainst.querySelector('.placeholder-text') != null) {
      this.showedAgainst.removeClass('hide-placeholder');
    }
  } else {
    this.elNode.addClass('is-scaled');
    if (this.showedAgainst && this.showedAgainst.querySelector('.placeholder-text') != null) {
      this.showedAgainst.addClass('hide-placeholder');
    }
  }
  return false;
};

Manager.prototype.findWidgetByAction = function (name) {
  return this.widgets.filter((e) => e.action === name || name.indexOf(e.action) != -1);
};

Manager.prototype.handleClick = function (ev, matched) {
  const name = matched ? matched.attr('data-action') : ev.currentTarget.attr('data-action');
  const sub_name = name.replace('inline-menu-', '');
  const detected_widget = this.findWidgetByAction(sub_name);

  if (detected_widget != null && detected_widget.length > 0) {
    detected_widget[0].handleClick(ev, matched);
  }
  return false;
};
export default Manager;
