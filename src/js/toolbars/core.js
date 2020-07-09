(function () {
  var u = Katana.utils;
  Katana.Toolbar = (function(_super) {
    u.__extends(Toolbar, _super);

    function Toolbar() {
      this.hide = u.__bind(this.hide, this);
      return Toolbar.__super__.constructor.apply(this, arguments);
    }

    Toolbar.prototype.el = "#mfToolbarBase";

    Toolbar.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
    };

    return Toolbar;
  })(Katana.Base);
  
}).call(this);