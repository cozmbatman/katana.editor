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

Tooltip.prototype.initialize = function initialize() {
  this.editor = this.opts.editor;
  this.hideTimeout = null;
  this.settings = {
    timeout: 300,
  };
};

Tooltip.prototype.positionAt = function positionAt(ev, matched) {
  let leftValue; let popoverWidth;
  let target; let topValue;

  target = matched || ev.currentTarget;

  const o = this.resolveTargetPosition(target);
  target = o.target;
  const targetIsFigure = o.figure;

  const targetOffset = target.getBoundingClientRect();
  const targetWidth = targetOffset.width;
  const targetHeight = targetOffset.height;

  const popover = this.elNode.querySelector('.popover');

  popover.show();
  popoverWidth = popover.getBoundingClientRect().width;
  popoverWidth /= 2;

  if (targetIsFigure) {
    popover.addClass('pop-for-figure');
    topValue = targetOffset.top + document.body.scrollTop;
    leftValue = (targetOffset.left + (targetWidth / 2)) - popoverWidth - 15;
    popover.style.top = `${topValue}px`;
    popover.style.left = `${leftValue}px`;
  } else {
    popover.removeClass('pop-for-figure');
    topValue = targetOffset.top + targetHeight + document.body.scrollTop;
    leftValue = targetOffset.left + (targetWidth / 2) - popoverWidth;
    popover.style.top = `${topValue}px`;
    popover.style.left = `${leftValue}px`;
  }
};

Tooltip.prototype.displayAt = function displayAt(ev, matched) {
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

Tooltip.prototype.cancelHide = function cancelHide() {
  return clearTimeout(this.hideTimeout);
};

Tooltip.prototype.hide = function hide() {
  this.cancelHide();
  const el = this.elNode;
  this.hideTimeout = setTimeout(() => {
    const pp = el.querySelector('.popover');
    if (pp != null) {
      pp.hide();
    }
  }, this.settings.timeout);
};

Tooltip.prototype.resolveTargetPosition = function resolveTargetPosition(target) {
  if (target.closest('.item-figure') != null) {
    const tg = target.closest('.item-figure');
    return { position: { top: tg.offsetTop, left: tg.offsetLeft }, target: tg, figure: true };
  }
  return { position: { top: target.offsetTop, left: target.offsetLeft }, target, figure: false };
};

Tooltip.prototype.render = function render() {
  if (document.querySelector('.popover.popover-tooltip') == null) {
    const tmpl = this.editor.templates.getTooltipTemplate();
    Utils.generateElement(tmpl).insertAfter(this.editor.elNode);
  }
  return document.querySelector('.popover.popover-tooltip');
};

export default Tooltip;
