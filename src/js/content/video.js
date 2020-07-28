import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

function Video(opts) {
  this.opts = opts;
  this.streamer = Stream;

  this.handleClick = this.handleClick.bind(this);
  this.initialize = this.initialize.bind(this);
  this.getEmbedFromNode = this.getEmbedFromNode.bind(this);

  boot.it(this, opts);
}

Video.prototype.initialize = function () {
  const { opts } = this;
  this.icon = opts.icon || 'mfi-video';
  this.title = opts.title || 'Add a video';
  this.action = opts.action || 'video';
  this.current_editor = opts.editor;
};

Video.prototype.contentId = 'VIDEO';

Video.prototype.handleClick = function (ev) {
  return this.displayEmbedPlaceHolder(ev);
};

Video.prototype.isYoutubeLink = function (url) {
  const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const m = url.match(p);
  if (url.match(p)) {
    return m[0];
  }
  return false;
};

Video.prototype.handleEnterKey = function (ev, node) {
  if (node.hasClass('is-embedable')) {
    return this.getEmbedFromNode(node);
  }
  const text = node.textContent;
  const texts = text.split(' ');
  if (texts.length == 1) {
    const validLink = this.isYoutubeLink(texts[0]);
    if (validLink) {
      return this.getEmbedFromNode(node, validLink);
    }
  }
};

Video.prototype.hide = function () {
  this.current_editor.content_bar.hide();
};

Video.prototype.uploadExistentIframe = function (iframe) {
  const src = iframe.attr('src');

  if (src) {
    if (Utils.urlIsFromDomain(src, 'youtube.com') || Utils.urlIsFromDomain(src, 'vimeo.com')) {
      this.loadEmbedDetailsFromServer(src, iframe, (node) => {
        while (!(node.parentNode != null && node.parentNode.hasClass('block-content-inner'))) {
          node.unwrap();
        }
      });
    }
  }
};

Video.prototype.displayEmbedPlaceHolder = function () {
  const ph = this.current_editor.embed_placeholder;
  this.node = this.current_editor.getNode();
  this.node.innerHTML = ph;
  this.node.addClass('is-embedable');
  this.current_editor.setRangeAt(this.node);
  this.hide();
  return false;
};

Video.prototype.loadEmbedDetailsFromServer = function (url, current_node, callback) {
  if (!this.current_editor.video_options || !this.current_editor.video_options.upload) {
    return;
  }
  const urll = `${encodeURIComponent(url)}&luxe=1`;

  this.current_editor.currentRequestCount++;
  const xhr = new XMLHttpRequest();
  xhr.open('POST', this.current_editor.video_options.url, true);
  xhr.onload = () => {
    if (xhr.status == '200' && xhr.readyState == 4) {
      this.current_editor.currentRequestCount--;
      try {
        const resp = JSON.parse(xhr.responseText);
        if (resp && resp.success) {
          const dt = resp.data;
          if (dt.video) {
            this.embedFramePlaceholder(dt, current_node, callback);
          }
        }
      } catch (e) {
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    }
  };
  xhr.onerror = () => {
    this.current_editor.currentRequestCount--;
  };
  xhr.send({ url: urll });
};

Video.prototype.embedFramePlaceholder = function (ob, current_node, callback) {
  const thumb = ob.thumbUrl;
  const { frameUrl } = ob;
  const { captionHref } = ob;
  const aspectRatio = ob.aspect;
  const canGoBackground = ob.fs;
  let { captionTitle } = ob;

  if (thumb != '') {
    const figure = Utils.generateElement(this.current_editor.templates.getFrameTemplate());
    const _this = this;
    const src = thumb;
    const img = new Image();

    img.src = src;

    img.onload = function () {
      const ar = _this.getAspectRatio(this.width, this.height);
      const pdc = figure.querySelector('.padding-cont');
      const fim = figure.querySelector('.item-image');
      const fpb = figure.querySelector('.padding-box');

      if (pdc != null) {
        const pdcStyle = pdc.style;
        pdcStyle.maxWidth = `${ar.width}px`;
        pdcStyle.maxHeight = `${ar.height}px`;
      }

      if (fim != null) {
        fim.attr('data-height', this.height);
        fim.attr('data-width', this.width);
      }

      if (fpb != null) {
        fpb.style.paddingBotom = `${ar.ratio}%`;
      }

      if (this.width < 700) {
        figure.addClass('n-fullSize');
      }

      const ig = figure.querySelector('img');
      if (ig != null) {
        ig.attr('src', src);
        ig.attr('data-frame-url', frameUrl);
        ig.attr('data-frame-aspect', aspectRatio);
        ig.attr('data-image-id', ob.embedId);
      }

      if (canGoBackground) {
        figure.addClass('can-go-background');
      }

      figure.insertBefore(current_node);
      current_node.parentNode.removeChild(current_node);
      // current_node.replaceWith(figure);

      const caption = figure.querySelector('figcaption');
      if (caption != null) {
        let capth = this.current_editor.templates.anchorMarkup(captionHref, 'markup-figure-anchor', true, 'Watch Video here'); let
          lastChar;
        if (captionTitle) {
          captionTitle = captionTitle.trim();
          lastChar = captionTitle.charAt(captionTitle.length - 1);
          if (lastChar != '.') {
            captionTitle += '.';
          }
          capth = captionTitle + capth;
        }
        caption.innerHTML = capth;
        figure.removeClass('item-text-default');
      }

      if (callback) {
        callback(figure);
      }

      _this.current_editor.selectFigure(figure);
    };
  }
};

Video.prototype.getEmbedFromNode = function (node, extractedUrl) {
  this.node = node;
  this.node_name = this.node.attr('name');
  this.node.addClass('loading-embed');
  this.node.attr('contenteditable', 'false');
  this.node.appendChild(Utils.generateElement('<i class="loader small dark"></i>'));

  let url = typeof extractedUrl !== 'undefined' ? extractedUrl : this.node.textContent;
  // canGoBackground = false;

  if (url.indexOf('vimeo') != -1) {
    url += '?badge=0&byline=0&portrait=0&title=0';
    // canGoBackground = true;
  } else if (url.indexOf('youtube') != -1) {
    // canGoBackground = true;
  }

  url += '&luxe=1';
  this.loadEmbedDetailsFromServer(url, node);
};

Video.prototype.getAspectRatio = (w, h) => {
  let fill_ratio; let height; let maxHeight; let maxWidth; let ratio; let result; let
    width;
  maxWidth = 760;
  maxHeight = 700;
  ratio = 0;
  width = w;
  height = h;

  if (w < maxWidth) {
    width = maxWidth;
    const fr = w / h;
    height = width / fr;
  }

  if (width > maxWidth) {
    ratio = maxWidth / width;
    height *= ratio;
    width *= ratio;
  } else if (height > maxHeight) {
    ratio = maxHeight / height;
    width *= ratio;
    height *= ratio;
  }
  fill_ratio = height / width * 100;
  result = {
    width,
    height,
    ratio: fill_ratio,
  };

  return result;
};

export default Video;
