import Utils from './utils';

const Player = {};

function YouTubePlayer(url, editor) {
  this.url$ = url;
  this.current_editor = editor;
  this.init(url);
}

YouTubePlayer.prototype.init = function init() {
  this.onYoutubePlayerReady = this.onYoutubePlayerReady.bind(this);
  this.parse();
  this.createContainers();
  return this;
};

YouTubePlayer.prototype.parse = function parse() {
  const a = document.createElement('a');
  a.href = this.url$;
  this.videoId = a.pathname.replace('/embed/', '');
  return this;
};

YouTubePlayer.prototype.locateContainer = function locateContainer() {
  const nodes = document.querySelectorAll(`.block-background-image[data-frame-url="${this.url$}"]`);
  if (nodes.length > 0) {
    return nodes;
  }
  return false;
};

YouTubePlayer.prototype.createContainers = function createContainers() {
  // in case we have multiple video embeds in background , but video is same.
  const nodes = this.locateContainer();
  if (nodes) {
    const tpl = this.current_editor.templates.videoBackgroundContainerTemplate();
    for (let i = 0; i < nodes.length; i += 1) {
      this.initPlayer(this.addContainer$(nodes[i], tpl));
    }
  }
};

YouTubePlayer.prototype.addContainer$ = (node, tpl) => {
  if (node.hasClass('block-background-image')) {
    const sec = node.closest('.video-in-background');
    if (!sec) {
      return null;
    }
    const alreadyAdded = sec.querySelector('.video-container');
    if (alreadyAdded) {
      const tmpl = Utils.generateElement(tpl);
      const aspect = node.attr('data-frame-aspect');

      if (aspect && aspect.substring(0, 4) === '1.77') {
        tmpl.addClass('video16by9');
      } else if (!aspect) {
        tmpl.addClass('video16by9');
      }
      tmpl.hide();
      node.parentNode.insertBefore(tmpl, node);
      return tmpl;
    }
    return alreadyAdded;
  }
  return null;
};

YouTubePlayer.prototype.initPlayer = function initPlayer(container) {
  if (typeof container === 'undefined') {
    return;
  }
  let containerWrapper = container.querySelector('.actual-wrapper');
  if (!containerWrapper) {
    return;
  }
  const containerId = containerWrapper.attr('id');
  const playerOptions = {
    autohide: true,
    autoplay: false,
    controls: 0,
    disablekb: 1,
    iv_load_policy: 3,
    loop: 0,
    modestbranding: 1,
    showinfo: 0,
    rel: 0,
  };

  containerWrapper = container.closest('.block-background');

  if (!containerWrapper) {
    playerOptions.controls = 1;
  }

  new YT.Player(containerId, { // eslint-disable-line no-new
    videoId: this.videoId,
    playerVars: playerOptions,
    events: {
      onReady: this.onYoutubePlayerReady,
    },
  });
  // this.players[containerId] = player;
};

YouTubePlayer.prototype.onYoutubePlayerReady = function onYoutubePlayerReady(event) {
  const { target } = event;
  const frame = target.getIframe();
  const frameWrap = frame.closest('.video-container');
  const sectionBackground = frame.closest('.block-background');
  const containerSection = frame.closest('.video-in-background');

  if (frameWrap && containerSection) {
    const wh = Utils.getWindowHeight();
    const ww = Utils.getWindowWidth();
    const buttonsCont = Utils.generateElement('<div class="button-controls"><div class="container"><div class="row"><div class="col-lg-12 columns"></div></div></div></div>');
    const playButton = Utils.generateElement('<span class="play-button" stat="play"><i class="mfi-action"></i></span>');
    const muteButton = Utils.generateElement('<span class="mute-button" stat="unmute"><b><i class="mfi-action"></i></b></span>');
    const asp = frameWrap.hasClass('video16by9') ? 1.77 : 1.33;
    const frameHeight = ww / asp;

    frame.attr('height', frameHeight);
    frame.removeAttribute('width');

    const neg = -1 * ((frameHeight - wh) / 2);

    const fsty = frameWrap.style;
    fsty.position = 'absolute';
    fsty.zIndex = 0;
    fsty.top = `${neg}px`;

    const columns = buttonsCont.querySelector('.columns');
    if (columns != null) {
      columns.append(playButton);
      columns.append(muteButton);
    }

    sectionBackground.insertAdjacentElement('afterend', buttonsCont);

    sectionBackground.style.height = `${wh}px`;
    sectionBackground.style.overflow = 'hidden';

    containerSection.addClass('video-frame-loaded player-youtube');

    containerSection.style.position = 'relative';
    containerSection.querySelector('.container-fixed')?.show();

    playButton.addEventListener('click', () => {
      const ths = playButton;
      if (ths.attr('stat') === 'pause') {
        containerSection.toggleClass('video-playing').toggleClass('video-paused');
        target.pauseVideo();
        ths.attr('stat', 'play');
      } else {
        containerSection.toggleClass('video-playing');
        containerSection.addClass('hide-preview');
        target.playVideo();
        ths.attr('stat', 'pause');
      }
    });

    muteButton.addEventListener('click', () => {
      const ths = muteButton;
      if (ths.attr('stat') === 'unmute') {
        target.unMute();
        ths.attr('stat', 'mute');
      } else {
        target.mute();
        ths.attr('stat', 'unmute');
      }
    });
  }

  // target.playVideo();
  // target.mute();
};

Player.manage = function manage({ videos, editor }) {
  if (!videos) {
    return;
  }
  let youtubeLoadTimer;
  const self = this;
  if (videos.youtube) {
    if (YoutubeScriptLoaded) {
      self.addYoutubePlayers(videos.youtube, editor);
    } else {
      youtubeLoadTimer = setInterval(() => {
        if (YoutubeScriptLoaded) {
          clearInterval(youtubeLoadTimer);
          self.addYoutubePlayers(videos.youtube, editor);
        }
      }, 1000);
    }
  }
};

Player.addYoutubePlayers = function addYoutubePlayers(urls, editor) {
  for (let i = 0; i < urls.length; i += 1) {
    new YouTubePlayer(urls[i], editor); // eslint-disable-line no-new
  }
};

Player.notInView = function notInView() {

};

Player.cameInView = function cameInView() {

};

export default Player;
