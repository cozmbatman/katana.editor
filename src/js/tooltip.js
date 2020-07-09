(function () {
  var u = Katana.utils;

  Katana.Tooltip = (function(_super) {
    u.__extends(Tooltip, _super);

    function Tooltip() {
      return Tooltip.__super__.constructor.apply(this, arguments);
    }

    Tooltip.prototype.el = "body";

    Tooltip.prototype.events = {
      "mouseover .popover": "cancelHide",
      "mouseout  .popover": "hide"
    };

    Tooltip.prototype.initialize = function(opts) {
      if (opts == null) {
        opts = {};
      }
      this.editor = opts.editor;
      this.hideTimeout;
      return this.settings = {
        timeout: 300
      };
    };

    Tooltip.prototype.template = function() {
      return `<div class='popover popover-tooltip popover-bottom active'> <div class='popover-inner'> <a href='#' target='_blank'> Link </a> </div> <div class='popover-arrow'> </div> </div>`;
    };

    Tooltip.prototype.positionAt = function(ev) {
      var left_value, popover_width, target, target_height, target_offset, target_positions, target_width, top_value, target_is_figure;

      target = ev.currentTarget;

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
        popover.css({"top" : top_value ,"left" : left_value}).show();
      } else {
        popover.removeClass('pop-for-figure');
        top_value = target_offset.top + target_height;
        left_value = target_offset.left + (target_width / 2) - (popover_width / 2);
        popover.css({"top" : top_value ,"left" : left_value}).show();
      }
      return;
    };

    Tooltip.prototype.displayAt = function(ev) {
      var target;
      this.cancelHide();
      target = $(ev.currentTarget);
      $(this.el).find(".popover-inner a").text(target.attr('href')).attr('href', target.attr("href"));
      this.positionAt(ev);
      $(this.el).find(".popover-tooltip").css("pointer-events", "auto");
      return $(this.el).show();
    };

    Tooltip.prototype.cancelHide = function() {
      return clearTimeout(this.hideTimeout);
    };

    Tooltip.prototype.hide = function(ev) {
      this.cancelHide();
      return this.hideTimeout = setTimeout((function(_this) {
        return function() {
          return $(_this.el).find(".popover").hide();
        };
      })(this), this.settings.timeout);
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
        u.generateElement(this.template()).insertAfter(this.editor.elNode);
      }
      return document.querySelector('.popover.popover-tooltip');
    };


    return Tooltip;
  })(Katana.Base);  
}).call(this);