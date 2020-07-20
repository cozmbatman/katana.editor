import Utils from './utils';
import boot from './boot';

function Tooltip(opts) {
  this.opts = opts;
  boot.it(this, opts);
}

Tooltip.prototype.events = {
  "mouseover .popover": "cancelHide",
  "mouseout  .popover": "hide"
};

Tooltip.prototype.initialize = function() {
  console.log('Tooltip : initialize');
  this.editor = this.opts.editor;
  this.hideTimeout;
  return this.settings = {
    timeout: 300
  };
};

Tooltip.prototype.template = function() {
  return `<div class='popover popover-tooltip popover-bottom active'> 
      <div class='popover-inner'>
        <a href='#' target='_blank'> Link </a>
      </div> 
      <div class='popover-arrow'> </div> </div>`;
};

Tooltip.prototype.positionAt = function(ev, matched) {
  var left_value, popover_width, 
    target, target_height, target_offset, target_positions, 
    target_width, top_value, target_is_figure;

  target = matched ? matched : ev.currentTarget;

  var o = this.resolveTargetPosition(target);
  target_positions = o.position;
  target = o.target;
  target_is_figure = o.figure;
  
  target_offset = target.offset();
  target_width = target.outerWidth();
  target_height = target.outerHeight();

  var popover = this.elNode.querySelector('.popover');

  popover_width = popover.outerWidth();

  if (target_is_figure) {
    popover.addClass('pop-for-figure');
    top_value = target_offset.top;
    left_value = (target_offset.left + target_width) - popover_width - 15;
    popover.style.top = top_value + 'px';
    popover.style.left = left_value + 'px';
    popover.show();
  } else {
    popover.removeClass('pop-for-figure');
    top_value = target_offset.top + target_height;
    left_value = target_offset.left + (target_width / 2) - (popover_width / 2);
    popover.style.top = top_value + 'px';
    popover.style.left = left_value + 'px';
    popover.show();
  }
  return;
};

Tooltip.prototype.displayAt = function(ev, matched) {
  var target;
  this.cancelHide();
  if(matched) {
    target = matched;
  } else {
    target = ev.currentTarget;
  }
  const $el = this.elNode;
  const an = $el.querySelector(".popover-inner a");
  if(an != null) {
    an.innerHTML = target.attr('href');
    an.attr('href', target.attr("href"));
  }
  this.positionAt(ev, matched);

  const elNT = $el.querySelector(".popover-tooltip");
  if(elNT != null) {
    elNT.style.pointerEvents = 'auto';
  }
  return $el.show();
};

Tooltip.prototype.cancelHide = function() {
  return clearTimeout(this.hideTimeout);
};

Tooltip.prototype.hide = function(ev) {
  this.cancelHide();
  const $el = this.elNode;
  this.hideTimeout = setTimeout(() => {
    const pp = $el.querySelector('.popover');
    if(pp != null) {
      pp.hide();
    }
  }, this.settings.timeout);
};

Tooltip.prototype.resolveTargetPosition = function(target) {
  if (target.parents(".item-figure").exists()) {
    var tg = target.parents(".item-figure");
    return {position: tg.position(), target: tg, figure: true};
  } else {
    return {position: target.position(), target: target, figure: false};
  }
};

Tooltip.prototype.render = function() {
  if (document.querySelector('.popover.popover-tooltip') == null) {
    Utils.generateElement(this.template()).insertAfter(this.editor.elNode);
  }
  return document.querySelector('.popover.popover-tooltip');
};

export default Tooltip;