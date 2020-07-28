import Utils from './utils';
import boot from './boot';

function Tooltip(opts) {
  this.opts = opts;
  this.cancelHide = this.cancelHide.bind(this);
  this.hide = this.hide.bind(this);
  boot.it(this, opts);
}

Tooltip.prototype.events = {
  'mouseover .popover': 'cancelHide',
  'mouseout  .popover': 'hide',
};

Tooltip.prototype.initialize = function () {
  this.editor = this.opts.editor;
  this.hideTimeout;
  return this.settings = {
    timeout: 300,
  };
};

Tooltip.prototype.template = function () {
  return `<div class='popover popover-tooltip popover-bottom active'> 
      <div class='popover-inner'>
        <a href='#' target='_blank'> Link </a>
      </div> 
      <div class='popover-arrow'> </div> </div>`;
};

Tooltip.prototype.positionAt = function (ev, matched) {
  let left_value; let popover_width;
  let target; let target_height; let target_offset;
  let target_width; let top_value; let
    target_is_figure;

  target = matched || ev.currentTarget;

  const o = this.resolveTargetPosition(target);
  target = o.target;
  target_is_figure = o.figure;

  target_offset = target.getBoundingClientRect();
  target_width = target_offset.width;
  target_height = target_offset.height;

  const popover = this.elNode.querySelector('.popover');

  popover.show();
  popover_width = popover.getBoundingClientRect().width;
  popover_width /= 2;

  if (target_is_figure) {
    popover.addClass('pop-for-figure');
    top_value = target_offset.top + document.body.scrollTop;
    left_value = (target_offset.left + (target_width / 2)) - popover_width - 15;
    popover.style.top = `${top_value}px`;
    popover.style.left = `${left_value}px`;
  } else {
    popover.removeClass('pop-for-figure');
    top_value = target_offset.top + target_height + document.body.scrollTop;
    left_value = target_offset.left + (target_width / 2) - popover_width;
    popover.style.top = `${top_value}px`;
    popover.style.left = `${left_value}px`;
  }
};

Tooltip.prototype.displayAt = function (ev, matched) {
  this.cancelHide();
  const target = matched || ev.currentTarget;
  const el = this.elNode;
  const an = el.querySelector('.popover-inner a');
  if (an != null) {
    an.innerHTML = target.attr('href');
    an.attr('href', target.attr('href'));
  }
  this.positionAt(ev, matched);

  const elNT = el.querySelector('.popover-tooltip');
  if (elNT != null) {
    elNT.style.pointerEvents = 'auto';
  }
  return elNT.show();
};

Tooltip.prototype.cancelHide = function () {
  return clearTimeout(this.hideTimeout);
};

Tooltip.prototype.hide = function () {
  this.cancelHide();
  const el = this.elNode;
  this.hideTimeout = setTimeout(() => {
    const pp = el.querySelector('.popover');
    if (pp != null) {
      pp.hide();
    }
  }, this.settings.timeout);
};

Tooltip.prototype.resolveTargetPosition = function (target) {
  if (target.closest('.item-figure') != null) {
    const tg = target.closest('.item-figure');
    return { position: { top: tg.offsetTop, left: tg.offsetLeft }, target: tg, figure: true };
  }
  return { position: { top: target.offsetTop, left: target.offsetLeft }, target, figure: false };
};

Tooltip.prototype.render = function () {
  if (document.querySelector('.popover.popover-tooltip') == null) {
    Utils.generateElement(this.template()).insertAfter(this.editor.elNode);
  }
  return document.querySelector('.popover.popover-tooltip');
};

export default Tooltip;
