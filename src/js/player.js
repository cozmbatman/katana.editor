import Utils from './utils';

const Player = {};

function YouTubePlayer(url) {
  this._url = url;
  this.init(url);
}

YouTubePlayer.prototype.init = function () {
  this.onYoutubePlayerReady = this.onYoutubePlayerReady.bind(this);
  this.parse();
  this.createContainers();
  return this;
};

YouTubePlayer.prototype.parse = function () {
  const a = document.createElement('a');
  a.href = this._url;
  this.videoId = a.pathname.replace('/embed/', '');
  return this;
};

YouTubePlayer.prototype.locateContainer = function () {
  const nodes = document.querySelectorAll(`.block-background-image[data-frame-url="${this._url}"]`);
  if (nodes.length > 0) {
    return nodes;
  }
  return false;
};

YouTubePlayer.prototype.createContainers = function () {
  const nodes = this.locateContainer(); // in case we have multiple video embeds in background , but video is same.
  if (nodes) {
    for (let i = 0; i < nodes.length; i += 1) {
      this.initPlayer(this._addContainer(nodes[i]));
    }
  }
};

YouTubePlayer.prototype.backgroundContainerTemplate = function () {
  return `<div class="video-container container-fixed in-background" name="${Utils.generateId()}">
  <div class="actual-wrapper" id="${Utils.generateId()}"></div>
  </div>`;
};

YouTubePlayer.prototype._addContainer = function (node) {
  if (node.hasClass('block-background-image')) {
    const sec = node.closest('.video-in-background');
    if (sec == null) {
      return;
    }
    const alreadyAdded = sec.querySelector('.video-container');
    if (alreadyAdded != null) {
      const tmpl = Utils.generateElement(this.backgroundContainerTemplate());
      const aspect = node.attr('data-frame-aspect');

      if (aspect && aspect.substring(0, 4) == '1.77') {
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
};

YouTubePlayer.prototype.initPlayer = function (container) {
  if (typeof container === 'undefined') {
    return;
  }
  let containerWrapper = container.querySelector('.actual-wrapper');
  if (containerWrapper == null) {
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

  if (containerWrapper == null) {
    playerOptions.controls = 1;
  }

  new YT.Player(containerId, {
    videoId: this.videoId,
    playerVars: playerOptions,
    events: {
      onReady: this.onYoutubePlayerReady,
    },
  });
  // this.players[containerId] = player;
};

YouTubePlayer.prototype.onYoutubePlayerReady = function (event) {
  const { target } = event;
  const frame = target.getIframe();
  const frameWrap = frame.closest('.video-container');
  const sectionBackground = frame.closest('.block-background');
  const containerSection = frame.closest('.video-in-background');

  if (frameWrap != null && containerSection != null) {
    const wh = Utils.getWindowHeight();
    const ww = Utils.getWindowWidth();
    const buttonsCont = Utils.generateElement('<div class="button-controls"><div class="container"><div class="row"><div class="col-lg-12 columns"></div></div></div></div>');
    const playButton = Utils.generateElement('<span class="play-button" stat="play"><i class="mfi-action"></i></span>');
    const muteButton = Utils.generateElement('<span class="mute-button" stat="unmute"><b><i class="mfi-action"></i></b></span>');
    const asp = frameWrap.hasClass('video16by9') ? 1.77 : 1.33;
    const frameHeight = ww / asp;

    frame.attr('height', frameHeight);
    frame.removeAttribute('width');

    const neg = -1 * (frameHeight - wh) / 2;

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
    const cf = containerSection.querySelector('.container-fixed');
    if (cf != null) {
      cf.show();
    }

    playButton.addEventListener('click', () => {
      const ths = playButton;
      if (ths.attr('stat') == 'pause') {
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
      if (ths.attr('stat') == 'unmute') {
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

Player.manage = function (videos) {
  if (!videos) {
    return;
  }
  let youtubeLoadTimer;
  const _this = this;
  if (videos.youtube) {
    if (YoutubeScriptLoaded) {
      _this.addYoutubePlayers(videos.youtube);
    } else {
      youtubeLoadTimer = setInterval(() => {
        if (YoutubeScriptLoaded) {
          clearInterval(youtubeLoadTimer);
          _this.addYoutubePlayers(videos.youtube);
        }
      }, 1000);
    }
  }
};

Player.addYoutubePlayers = function (urls) {
  for (let i = 0; i < urls.length; i += 1) {
    new YouTubePlayer(urls[i]);
  }
};

Player.notInView = function () {

};

Player.cameInView = function () {

};

export default Player;
