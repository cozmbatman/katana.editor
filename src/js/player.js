(function () {
  var Player = {},
  u = Katana.utils;

  window.Katana.Player = Player;

  function YouTubePlayer(url) {
    this._url = url;
    this.init(url);
  };

  YouTubePlayer.prototype.init = function() {
    this.parse();
    this.createContainers();

    this.onYoutubePlayerReady = u.__bind(this.onYoutubePlayerReady, this);
    return this;
  };

  YouTubePlayer.prototype.parse = function () {
    var a = document.createElement('a');
    a.href = this._url;
    var path = a.pathname;
    var videoId = path.replace('/embed/','');
    this.videoId = videoId;
    return this;
  };

  YouTubePlayer.prototype.locateContainer = function (){
    var nodes = $('.block-background-image[data-frame-url="' + this._url + '"]');
    if (nodes.length) {
      return nodes;
    }
    return false;
  };

  YouTubePlayer.prototype.createContainers = function () {
    var nodes = this.locateContainer(); // in case we have multiple video embeds in background , but video is same.
    if (nodes) {
      for (var i = 0; i < nodes.length; i = i + 1) {
        var playerContainer = this._addContainer(nodes[i]);
        this.initPlayer(playerContainer);
      }
    }
  };

  YouTubePlayer.prototype.backgroundContainerTemplate = function () {
    var ht = '';
    ht += '<div class="video-container container-fixed in-background" name="' + u.generateId() + '">';
    ht += '<div class="actual-wrapper" id="' + u.generateId() + '"></div>'
    ht += '</div>';
    return ht;
  };

  YouTubePlayer.prototype._addContainer = function (node) {
    var $node = $(node);
    if ($node.hasClass('block-background-image')) {
      var sec = $node.closest('.video-in-background');
      var alreadyAdded = sec.find('.video-container');
      if (alreadyAdded.length == 0) {
        var tmpl = $(this.backgroundContainerTemplate());
        var aspect = $node.attr('data-frame-aspect');

        if (aspect && aspect.substring(0,4) == '1.77') {
          tmpl.addClass('video16by9');
        } else if (!aspect) {
          tmpl.addClass('video16by9');
        }
        tmpl.hide();
        tmpl.insertBefore($node);
        return tmpl;  
      } else {
        return alreadyAdded;
      }
    }
  };

  YouTubePlayer.prototype.initPlayer = function (container) {
    if (typeof container == 'undefined') {
      return;
    }
    var containerId = container.find('.actual-wrapper').attr('id'),
        containerWrapper = container.closest('.block-background'),
        width,
        height;

    var playerOptions = {
      autohide: true,
      autoplay: false,
      controls: 0,
      disablekb: 1,
      iv_load_policy: 3,
      loop: 0,
      modestbranding:1,
      showinfo:0,
      rel:0
    };

    if (containerWrapper.length) {
      width = containerWrapper.width();
      height = containerWrapper.height() < $(window).height() ? containerWrapper.height() : $(window).height();
    }else {
      playerOptions.controls = 1;
    }
    
    var player = new YT.Player(containerId, {
      videoId: this.videoId,
      playerVars: playerOptions,
      events: {
        'onReady': this.onYoutubePlayerReady
      }
    });
    // this.players[containerId] = player;
  };

  YouTubePlayer.prototype.onYoutubePlayerReady = function (event){
    var target = event.target;
    var frame = target.getIframe(),
        frameWrap = frame.closest('.video-container'),
        sectionBackground = frame.closest('.block-background'),
        containerSection = $(frame.closest('.video-in-background'));

    if (containerSection.length) {
      var wh = $(window).height(),
          ww = $(window).width(),
          $frameWrap = $(frameWrap),
          buttonsCont = $('<div class="button-controls"><div class="container"><div class="row"><div class="col-lg-12 columns"></div></div></div></div>');
          playButton = $('<span class="play-button" stat="play"><i class="mfi-action"></i></span>'),
          muteButton = $('<span class="mute-button" stat="unmute"><b><i class="mfi-action"></i></b></span>')
          asp = $frameWrap.hasClass('video16by9') ? 1.77 : 1.33;

      var frameHeight = ww / asp;

      var $frame = $(frame);
      $frame.attr('height', frameHeight);
      $frame.removeAttr('width');
      var neg = -1 * (frameHeight - wh) / 2 ;
      
      $frameWrap.css({position:'absolute', 'z-index': '0', top: neg + 'px'});
      
      buttonsCont.find('.columns').append(playButton);
      buttonsCont.find('.columns').append(muteButton);
      buttonsCont.insertAfter(sectionBackground);
      $(sectionBackground).css({height:wh + 'px', overflow:'hidden'});
      
      containerSection.addClass('video-frame-loaded player-youtube');

      containerSection.css({position:'relative'});
      containerSection.find('.container-fixed').show();
      playButton.addEventListener('click', function () {
        var $ths = $(this);
        if ($ths.attr('stat') == 'pause') {
          containerSection.toggleClass('video-playing').toggleClass('video-paused');
          target.pauseVideo();
          $ths.attr('stat', 'play');
        }else {
          containerSection.toggleClass('video-playing');
          containerSection.addClass('hide-preview');
          target.playVideo();
          $ths.attr('stat', 'pause');
        }
      });

      muteButton.addEventListener('click', function () {
        var $ths = $(this);
        if ($ths.attr('stat') == 'unmute') {
          target.unMute();
          $ths.attr('stat', 'mute');
        } else {
          target.mute();
          $ths.attr('stat', 'unmute');
        }
      });
    }

    //target.playVideo();
    // target.mute();
  };

  Player.manage = function (videos) {
    if (!videos) {
      return;
    }
    var youtubeLoadTimer,
        _this = this;
    if (videos.youtube) {
      if (YoutubeScriptLoaded) {
        _this.addYoutubePlayers(videos.youtube);
      }else {
        youtubeLoadTimer = setInterval(function () {
          if (YoutubeScriptLoaded) {
            clearInterval(youtubeLoadTimer);
            _this.addYoutubePlayers(videos.youtube);
          }
        }, 1000);
      }
    }
  };

  Player.addYoutubePlayers = function (urls) {
    for (var i = 0; i < urls.length; i = i + 1) {
      var url = urls[i];
      new YouTubePlayer(url);
    }
  };

  Player.notInView = function() {

  };

  Player.cameInView = function (sects) {

  };

}).call(this);