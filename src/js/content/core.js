(function () {
  var u = Katana.utils;

  Katana.Content = (function(_super) {
    u.__extends(Content, _super);

    function Content() {
      this.initialize = u.__bind(this.initialize, this);
      return Content.__super__.constructor.apply(this, arguments);
    }

    Content.prototype.contentId = '';

    Content.prototype.initialize = function(opts) {
      if(opts == null) {
        opts = {};
      }
      this.icon = opts.icon;
      this.title = opts.title;
      return this.action = this.title;
    };

    return Content;

  })(Katana.Base);
}).call(this);

// ################################################## //
(function() {

  var u = Katana.utils;
  Katana.ContentBar = (function(_super) {
    u.__extends(Manager, _super);
    function Manager() {
      this.initialize = u.__bind(this.initialize, this);
      this.move = u.__bind(this.move, this);

      this.toggleOptions = u.__bind(this.toggleOptions, this);
      this.handleClick = u.__bind(this.handleClick, this);
      Manager.__super__.constructor.apply(this, arguments);
    }

    Manager.prototype.el = '#mfContentBase';
    Manager.prototype.showedAgainst = null;

    Manager.prototype.events = {
      'click .inlineTooltip-button.control': 'toggleOptions',
      'click .inlineTooltip-menu button': 'handleClick'
    };

    Manager.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.widgets = opts.widgets || [];
      this.current_editor = opts.editor;
    };

    Manager.prototype.template = function () {
      var menu;
      menu = "";
      this.widgets.forEach( b => {
        var data_action_value;
        data_action_value = b.action ? "data-action-value='" + b.action + "'" : "";
        if (b.template) {
          menu += b.template();
        } else {
          menu += `<button class="inlineTooltip-button scale" title="${b.title}" data-action="inline-menu-${b.action}" ${data_action_value}"> <span class="tooltip-icon ${b.icon}"></span> </button>`;
        }
        return menu;
      });

      return `<button class='inlineTooltip-button control' data-action='inline-menu' title='Content Options'> <span class='tooltip-icon mfi-plus'></span> </button> <div class='inlineTooltip-menu'>${menu}</div>`;
    };

    Manager.prototype.render = function () {
      var template = this.template();
      this.elNode.innerHTML = template;
      return this;
    };

    Manager.prototype.getView = function () {
      return 'html'; // 
    };

    Manager.prototype.hide = function () {
      this.elNode.removeClass('is-active');
      this.elNode.removeClass('is-scaled');
      this.elNode.addClass('hide');
    };

    Manager.prototype.show = function (showedAgainst) {
      var hidden = document.querySelector('.hide-placeholder');

      if (hidden != null) {
        hidden.removeClass('hide-placeholder');
      }

      this.showedAgainst = showedAgainst;
      this.elNode.addClass('is-active');
      this.elNode.removeClass('hide');
    };

    Manager.prototype.move = function (coords) {
      let control_spacing, control_width, coord_left, coord_top, pull_size, tooltip;

      tooltip = this.elNode;
      control_width = tooltip.querySelector(".control").getBoundingClientRect().width;
      
      control_spacing = u.getStyle(tooltip.querySelector(".inlineTooltip-menu"), 'paddingLeft');
      pull_size = parseInt(control_width) + parseInt(control_spacing.replace(/px/, ""));
      if(isNaN(pull_size)) {
        pull_size = 0;
      }
      coord_left = coords.left - pull_size;
      coord_top = coords.top;
      if ( u.getWindowWidth() <= 768 ) {
        coord_left = 5;
      }
      this.elNode.style.top = coord_top + 'px';
      this.elNode.style.left = coord_left + 'px';
      return;
    };

    Manager.prototype.toggleOptions = function (ev) {
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

    Manager.prototype.findWidgetByAction = function(name) {
      return this.widgets.filter( (e) => {
        return e.action === name || name.indexOf(e.action) != -1;
      });
    };

    Manager.prototype.handleClick = function (ev, matched) {
      var detected_widget, name, sub_name;
      if(matched) {
        name = matched.attr('data-action');
      } else {
        name = ev.currentTarget.attr('data-action');
      }
      sub_name = name.replace("inline-menu-", "");
      detected_widget = this.findWidgetByAction(sub_name);
      if (detected_widget != null && detected_widget.length > 0) {
        detected_widget[0].handleClick(ev);
      }
      return false;
    };
    return Manager;

  })(Katana.Base);

}).call(this);