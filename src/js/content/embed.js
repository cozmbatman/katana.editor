import boot from "../boot";

function Embed(opts) {
  this.opts = opts;
  this.handleClick = this.handleClick.bind(this);
  this.initialize = this.initialize.bind(this);
  boot.it(this, opts);
}

Embed.prototype.initialize = function () {
  const opts = this.opts;
  this.icon = 'mfi-embed';
  this.title = 'embed';
  this.action = 'embed';
};

Embed.prototype.handleClick = function (ev, matched) {
  console.log('embed click');
};

export default Embed;