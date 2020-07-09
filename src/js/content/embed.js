(function () {
  var u = Katana.utils;

  Katana.Content.Embed = (function (_super) {
    u.__extends(Embed, _super);

    function Embed() {
      this.handleClick = u.__bind(this.handleClick, this);
      this.initialize = u.__bind(this.initialize, this);
      return Embed.__super__.constructor.apply(this, arguments);
    }

    Embed.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }
      this.icon = 'mfi-embed';
      this.title = 'embed';
      this.action = 'embed';
    };

    Embed.prototype.handleClick = function (ev) {
      console.log('embed click');
    };

    return Embed;
  })(Katana.Content);
}).call(this);