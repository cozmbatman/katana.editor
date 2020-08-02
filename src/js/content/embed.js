import boot from '../boot';

function Embed(opts) {
  this.opts = opts;
  this.handleClick = this.handleClick.bind(this);
  this.initialize = this.initialize.bind(this);
  boot.it(this, opts);
}

Embed.prototype.initialize = function initialize() {
  this.icon = 'mfi-embed';
  this.title = 'embed';
  this.action = 'embed';
};

Embed.prototype.handleClick = function handleClick() {

};

export default Embed;
