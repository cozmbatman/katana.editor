import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

function Images(opts) {
  this.opts = opts;
  this.streamer = Stream;

  this.initialize = this.initialize.bind(this);

  this.uploadCompleted = this.uploadCompleted.bind(this);
  this.uploadExistentImage = this.uploadExistentImage.bind(this);

  this.updateProgressBar = this.updateProgressBar.bind(this);
  this.uploadFile = this.uploadFile.bind(this);
  this.uploadFiles = this.uploadFiles.bind(this);

  this.handleEnterKey = this.handleEnterKey.bind(this);
  this.handleClick = this.handleClick.bind(this);
  this.handleBackspaceKey = this.handleBackspaceKey.bind(this);
  this.handleDeleteKey = this.handleDeleteKey.bind(this);
  this.imageSelect = this.imageSelect.bind(this);
  this.imageUploadCallback = this.imageUploadCallback.bind(this);
  this.fixPositioningForMultipleImages = this.fixPositioningForMultipleImages.bind(this);
  this.addImagesOnScene = this.addImagesOnScene.bind(this);
  this.embedParagraphAboveImage = this.embedParagraphAboveImage.bind(this);

  this.pushMultipleImageContainer = this.pushMultipleImageContainer.bind(this);

  boot.it(this, opts);
}

Images.prototype.contentId = 'IMAGES';

Images.prototype.initialize = function initialize() {
  const { opts } = this;
  this.icon = 'mfi-photo';
  this.title = 'image';
  this.action = 'image';
  this.current_editor = opts.editor;
  this.editorEl = this.current_editor.elNode;
  this.addImagesInContainer = false;
  this.personal_toolbar = opts.toolbar;
  this.image_cdn_path = '/';

  this.streamer.subscribe('Katana.Images.Restructure', (event) => {
    this.fixPositioningForMultipleImages(event.container, event.figures, event.count);
  });

  this.streamer.subscribe('Katana.Images.Add', (event) => {
    if (typeof event.row !== 'undefined') {
      this.addImagesInRow = event.row;
      this.imageSelect(event);
    } else if (typeof event.figure !== 'undefined') {
      this.imageSelect(event);
    }
  });

  return this;
};

Images.prototype.handleClick = function handleClick(ev) {
  this.imageSelect(ev);
};

Images.prototype.createRowAroundFigure = function createRowAroundFigure(figure) {
  const row = this.pushMultipleImageContainer(2, figure);
  figure.addClass('figure-in-row');
  const img = figure.querySelector('.item-image');
  row.appendChild(figure);

  if (img != null) {
    this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
  }

  return row;
};

Images.prototype.thirdPartyQueue = {};

Images.prototype.queueProcessTimer = null;

Images.prototype.thirdPartyImageProcessed = function thirdPtyIgProcessed(imageElement, key) {
  delete this.thirdPartyQueue[key];
  if (Object.keys(this.thirdPartyQueue).length === 0) {
    clearInterval(this.queueProcessTimer);
  }
};

Images.prototype.processSingleImageElement = function proSingleIgElm(imageElement, opts, key) {
  const url = imageElement.attr('src');
  const formData = new FormData();
  const self = this;

  if (url.indexOf('data:image') === 0) {
    formData.append('image', url);
  } else {
    formData.append('url', url);
  }

  this.current_editor.currentRequestCount += 1;

  const oReq = new XMLHttpRequest();
  oReq.open('POST', '/upload-url', true);
  oReq.onload = function onload() {
    if (oReq.status === '200' && oReq.readyState === 4) {
      try {
        const data = JSON.parse(oReq.responseText);
        if (data.success) {
          const imgSrc = data.file;
          const imageId = data.id;
          self.thirdPartyImageLoaded({
            url, imageId, key, file: imgSrc,
          });
          self.current_editor.currentRequestCount -= 1;
        }
      } catch (e) {
        self.current_editor.currentRequestCount -= 1;
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    } else {
      self.current_editor.currentRequestCount -= 1;
    }
  };
  oReq.send(formData);
};

Images.prototype.processThirdPartyQueue = function processThirdPartyQueue() {
  let currentlyProcessing = 0;
  const toProcess = [];
  const tpKeys = Object.keys(this.thirdPartyQueue);
  for (let i = 0; i < tpKeys.length; i += 1) {
    const prop = tpKeys[i];
    const item = this.thirdPartyQueue[prop];
    if (item && item.processing) {
      currentlyProcessing += 1;
    } else if (item && !item.processing) {
      toProcess.push(item);
    }
  }

  if (currentlyProcessing === 2) {
    return;
  }

  for (let i = 0; i < toProcess.length; i += 1) {
    toProcess[i].processing = true;
    this.processSingleImageElement(toProcess[i].element, toProcess[i].opts, toProcess[i].key);
    if (i === 1) {
      break;
    }
  }
};

Images.prototype.handleThirdPartyImage = function handleThirdPartyImage(imageElement, opts) {
  const url = imageElement.attr('src');
  const key = url + Math.random(0, Math.random()).toString(32).substring(0, 8);
  imageElement.attr('data-key', key);
  this.thirdPartyQueue[url] = { element: imageElement, opts, key };

  if (this.queueProcessTimer == null) {
    this.queueProcessTimer = setInterval(() => {
      this.processThirdPartyQueue();
    }, 3000);
  }
};

Images.prototype.thirdPartyImageLoaded = function thirdPartyImageLoaded(ob) {
  const oldImg = document.querySelector(`[src="${ob.url}"]`);
  const newUrl = `${this.image_cdn_path}/fullsize/${ob.file}`;
  const tmpl = Utils.generateElement(this.current_editor.templates.getFigureTemplate());
  const img = tmpl.querySelector('img');

  img.attr('src', newUrl);
  img.attr('data-delayed-src', newUrl);
  img.attr('data-image-id', ob.imageId);

  img.closest('.item-figure')?.removeClass('item-uploading');

  this.replaceImg(oldImg, tmpl, newUrl, (figure, imageElement) => {
    this.thirdPartyImageProcessed(imageElement, ob.key);

    let insideGraf = figure.closest('.item:not(".item-figure")');
    if (insideGraf != null) {
      do {
        figure.unwrap();
        insideGraf = figure.closest('.item:not(".item-figure")');
      } while (insideGraf != null);
    }

    figure.closest('.ignore-block.item-uploading')?.unwrap();
    imageElement.parentNode.removeChild(imageElement);
  });
};

Images.prototype.pastedImagesCache = {};

Images.prototype.uploadExistentImage = function uploadExistentImage(imageElement, opts = {}) {
  const src = imageElement.attr('src');

  let name;
  if (imageElement.hasAttribute('name')) {
    name = imageElement.attr('name');
  }

  if (name) {
    if (typeof this.pastedImagesCache[name] !== 'undefined') {
      return;
    }
  } else if (imageElement.hasClass('marked')) {
    return;
  }

  imageElement.addClass('marked');

  if (name) {
    this.pastedImagesCache[name] = true;
  }

  if (!Utils.urlIsFromDomain(src, 'mefacto.com')) {
    const igBlock = '<div class="ignore-block item-uploading" contenteditable="false"></div>';
    const div = Utils.generateElement(igBlock);
    imageElement.parentNode.insertBefore(div, imageElement);
    div.appendChild(imageElement);
    this.handleThirdPartyImage(imageElement, opts);
    return;
  }

  let img; let n; let node; let i; let ref;
  let pasting = false;

  const tmpl = Utils.generateElement(this.current_editor.templates.getFigureTemplate());

  if (this.addImagesInContainer) {
    tmpl.addClass('figure-in-row');
  }

  if (imageElement.closest('.item') != null) {
    if (imageElement.closest('.item').hasClass('item-figure')) {
      return;
    }
    const itm = imageElement.closest('.item');
    itm.parentNode.insertBefore(tmpl, itm);
    node = this.current_editor.getNode();
    if (node) {
      this.current_editor.addClassesToElement(node);
    }
  } else if (imageElement.closest(this.current_editor.paste_element_id) != null) {
    pasting = true;
    imageElement.parentNode.insertBefore(tmpl, imageElement);
  } else {
    img = imageElement.parentsUntil('.block-content-inner');
    if (img != null) {
      img = img.firstChild;
      img.parentNode.insertBefore(tmpl, img);
      img.parentNode.removeChild(img);
    }
  }

  if (!pasting) {
    this.replaceImg(imageElement, document.querySelector(`[name='${tmpl.attr('name')}']`));
    n = document.querySelector(`[name='${tmpl.attr('name')}']`);
    if (n != null) {
      n = n.parentsUntil('.block-content-inner');
      if (n != null) {
        for (i = 0, ref = n - 1; i <= ref; i += 1) {
          document.querySelector(`[name='${tmpl.attr('name')}']`).unwrap();
        }
      }
    }
  } else {
    this.replaceImg(imageElement, document.querySelector(`[name='${tmpl.attr('name')}']`));
  }
};

Images.prototype.replaceImg = function replaceImg(imageElement, figure, srcToUse, callback) {
  const img = new Image(); const self = this;
  let sr;

  if (typeof srcToUse === 'undefined' && typeof callback === 'undefined') {
    img.attr('src', imageElement.attr('src'));
    sr = imageElement.attr('src');
    const fig = imageElement.closest('figure');
    if (fig) {
      fig.parentNode.removeChild(fig);
    }
    imageElement.parentNode.removeChild(imageElement);
    const ig = figure.querySelector('img');
    if (ig) {
      ig.attr('src', sr);
      ig.attr('data-delayed-src', sr);
    }
  } else {
    img.attr('src', srcToUse);
    sr = srcToUse;
  }

  img.attr('data-delayed-src', sr);

  img.onload = function onload() {
    self.setAspectRatio(figure, this.width, this.height);

    const fig = figure.querySelector('.item-image');
    if (fig) {
      fig.attr('data-height', this.height);
      fig.attr('data-width', this.width);
    }

    if (this.naturalWidth < 760) {
      figure.addClass('n-fullSize');
    } else {
      figure.removeChild('n-fullSize');
    }

    if (typeof srcToUse === 'undefined') {
      figure.querySelector('img')?.attr('src', sr);
      return;
    }
    figure.querySelector('img')?.attr('src', srcToUse);
    imageElement.parentNode.insertBefore(figure, imageElement);
    imageElement.parentNode.removeChild(imageElement);

    if (typeof callback !== 'undefined') {
      callback(figure, imageElement);
    }
  };
};

Images.prototype.displayAndUploadImages = function displayAndUploadImages(file, cont, callback) {
  this.displayCachedImage(file, cont, callback);
};

Images.prototype.viaDrop = false;

Images.prototype.imageSelect = function imageSelect(ev) {
  const selectFile = Utils.generateElement('<input type="file" multiple="multiple">');
  selectFile.click();
  const self = this;
  return selectFile.addEventListener('change', function selectUplListener() {
    const t = this;
    self.viaDrop = false;
    if (ev.row) {
      self.addImagesInRow = ev.row;
    } else {
      self.addImagesInRow = false;
    }

    if (typeof ev.figure !== 'undefined') {
      self.wrapFigureWithAdditions = ev.figure;
    } else {
      self.wrapFigureWithAdditions = false;
    }
    self.addImagesInContainer = false;
    self.uploadFiles(t.files);
  });
};

Images.prototype.displayCachedImage = function displayCachedImage(file, cont, callback) {
  this.current_editor.content_bar.hide();
  window.URL = window.webkitURL || window.URL; // Vendor prefixed in Chrome.

  const img = document.createElement('img');
  const self = this;
  img.onload = function onload(e) {
    if (self.droppedCount) {
      self.droppedCount -= 1;
    }

    const node = self.viaDrop
      ? document.querySelector('.drop-placeholder')
      : self.current_editor.getNode();

    let replacedNode;
    const newTmpl = Utils.generateElement(self.current_editor.templates.getFigureTemplate());

    if (typeof cont !== 'undefined' && cont) {
      newTmpl.addClass('figure-in-row');

      if (cont.contains(node)) {
        node.insertAdjacentElement('afterend', newTmpl);
        replacedNode = newTmpl; // node.parentNode.insertBefore(newTmpl, node);
      } else {
        replacedNode = newTmpl;
        cont.appendChild(replacedNode);
      }
    } else {
      replacedNode = node.parentNode.insertBefore(newTmpl, node);
    }

    const imgTag = newTmpl.querySelector('img.item-image');
    if (imgTag) {
      imgTag.attr('src', e.target.currentSrc ? e.target.currentSrc : e.target.result);
    }
    imgTag.height = this.height;
    imgTag.width = this.width;

    self.setAspectRatio(replacedNode, this.width, this.height);

    const rig = replacedNode.querySelector('.item-image');

    if (rig) {
      rig.attr('data-height', this.height);
      rig.attr('data-width', this.width);
    }

    if (this.naturalWidth < 700) {
      replacedNode.addClass('n-fullSize');
    } else {
      replacedNode.removeClass('n-fullSize');
    }

    if (self.current_editor.image_options && self.current_editor.image_options.upload) {
      newTmpl.addClass('item-uploading');
      // release blob when actual image uploads starts
      window.URL.revokeObjectURL(this.src); // Clean up after yourself
    }

    if (typeof callback !== 'undefined') {
      // let the callback know the image has been places,
      // we need to adjust width incase of multiple images select
      callback(replacedNode);
    }
    if (self.droppedCount === 0) {
      const dp = document.querySelector('.drop-placeholder');
      if (dp) {
        dp.parentNode.removeChild(dp);
      }
    }
    self.uploadFile(file, replacedNode);
  };

  img.src = window.URL.createObjectURL(file);
};

Images.prototype.setAspectRatio = function setAspectRatio(figure, w, h) {
  let maxHeight = 700;
  let maxWidth = 760;
  let ratio = 0;
  let width = w;
  let height = h;

  if (figure.hasClass('figure-in-row')) {
    maxWidth = figure.closest('.block-grid-row').getBoundingClientRect().width;
    maxHeight = Utils.getWindowWidth();
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

  const fillRatio = (height / width) * 100;

  const pc = figure.querySelector('.padding-cont');
  if (pc) {
    pc.style.maxWidth = `${width}px`;
    pc.style.maxHeight = `${height}px`;
  }

  const pb = figure.querySelector('.padding-box');
  if (pb) {
    pb.style.paddingBottom = `${fillRatio}%`;
  }
};

Images.prototype.formatData = (file) => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return formData;
};

Images.prototype.droppedCount = -1;

Images.prototype.uploadFiles = function uploadFiles(files, viaDrop) {
  this.batchesFiles = [];
  if (typeof viaDrop !== 'undefined' && viaDrop) {
    this.viaDrop = true;
  }

  const sizeLimit = 17900000; // 8 MB

  let i = 0;
  const results = [];
  let sizeError = false;

  const acceptedTypes = {
    'image/png': true,
    'image/jpeg': true,
    'image/gif': true,
  };

  while (i < files.length) {
    const file = files[i];
    if (acceptedTypes[file.type] === true) {
      if (file.size <= sizeLimit) {
        this.batchesFiles.push(file);
      } else {
        sizeError = true;
      }
    }
    i += 1;
    results.push(i);
  }

  if (sizeError) {
    this.streamer.notifySubscribers('Katana.Error', {
      target: 'image',
      message: 'Max file size exceeded',
    });
    return;
  }

  if (this.batchesFiles.length === 0) {
    const dp = document.querySelector('.drop-placeholder');
    if (dp) {
      dp.parentNode.removeChild(dp);
    }
    this.viaDrop = false;
    this.droppedCount = this.batchesFiles.length;
  }

  this.addImagesOnScene();
};

Images.prototype.addImagesOnScene = function addImagesOnScene() {
  const batch = this.batchesFiles;
  const size = batch.length;
  let cont = false;
  if (!size) {
    return;
  }

  if (this.wrapFigureWithAdditions) {
    const figure = this.wrapFigureWithAdditions;
    const row = this.pushMultipleImageContainer(2, figure);
    figure.addClass('figure-in-row');
    const img = figure.querySelector('.item-image');
    row.appendChild(figure);

    if (img != null) {
      this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
    }
    cont = row;
    this.wrapFigureWithAdditions = false;
  }

  if (this.addImagesInRow) {
    const len = size > 3 ? 3 : size;
    for (let i = 0; i < len; i += 1) {
      this.displayAndUploadImages(batch[i], this.addImagesInRow, this.imageUploadCallback);
    }
    return;
  }

  if (size === 1 && !cont) {
    this.displayAndUploadImages(this.batchesFiles[0], null, this.imageUploadCallback);
  } else if ((size > 1 && size < 9) || cont) {
    if (!cont) {
      cont = this.pushMultipleImageContainer(size);
    }
    let k = 0;
    while (k < size) {
      const l = ((k + 3) > size) ? size : k + 3;

      for (let i = k; i < l; i += 1) {
        this.displayAndUploadImages(batch[i], cont, this.imageUploadCallback);
        k += 1;
      }

      if (k >= size) {
        break;
      }

      const newCount = size - l > 3 ? 3 : size - l;
      const newRow = Utils.generateElement(this.current_editor.templates.gridRowTemplate(newCount));
      cont.insertAdjacentElement('afterend', newRow);
      cont = newRow;
    }
  }
};

Images.prototype.imageUploadCallback = function imageUploadCallback(figure) {
  const node = figure;
  const { parentNode } = node;

  if (parentNode && parentNode.hasClass('block-grid-row')) {
    const count = parentNode.attr('data-paragraph-count');
    const figures = parentNode.querySelectorAll('.figure-in-row');
    this.fixPositioningForMultipleImages(parentNode, figures, count);

    if (figures.length === count) {
      // move to next section , so that its width doesn't change
      if (parentNode.querySelector('.item-selected')) {
        const selected = parentNode.querySelector('.item-selected');
        const nextCont = parentNode.next('.block-content-inner');
        let firstChild = null;

        if (nextCont) {
          for (let i = 0; i < nextCont.children.length; i += 1) {
            const ncc = nextCont.children[i];
            if (ncc.hasClass('item')) {
              firstChild = ncc;
              break;
            }
          }
        }

        if (firstChild) {
          firstChild.parentNode.insertBefore(selected, firstChild);
        } else {
          nextCont.appendChild(selected);
        }
      }

      // this.current_editor.cleanUpInnerSections();
      this.current_editor.selectFigure(node);
    }
  } else {
    this.current_editor.setupFirstAndLast();
    this.current_editor.selectFigure(figure);
  }
};

Images.prototype.fixPositioningForMultipleImages = function fixPosForMImg(cont, figures, count) {
  if (!cont) {
    return;
  }
  const ratios = [];
  let rsum = 0;
  const len = figures.length;
  const totalWidth = cont.getBoundingClientRect().width;
  let i = 0;

  for (i; i < len; i += 1) {
    const fig = figures[i];
    const ig = fig.querySelector('img');
    let nw = 0; let
      nh = 0;
    if (ig != null) {
      if (ig.hasAttribute('data-width')) {
        nw = parseInt(ig.attr('data-width')); // eslint-disable-line radix
      } else {
        nw = ig.naturalWidth;
      }
      if (ig.hasAttribute('data-height')) {
        nh = parseInt(ig.attr('data-height')); // eslint-disable-line radix
      } else {
        nh = ig.naturalHeight;
      }
    }
    this.setAspectRatio(fig, nw, nh);
  }

  for (i = 0; i < len; i += 1) {
    const ig = figures[i].querySelector('img');
    if (ig != null) {
      const r = parseFloat(ig.attr('data-width')) / parseFloat(ig.attr('data-height'));
      rsum += r;
      ratios[i] = r;
    }
  }

  const height = totalWidth / rsum;

  for (i = 0; i < len; i += 1) {
    const fig = figures[i];
    const wid = ((ratios[i] * height) / totalWidth) * 100;
    fig.style.width = `${wid}%`;
  }

  if (count === 1) {
    const pcA = figures[0].querySelectorAll('.padding-cont');
    pcA.forEach((pc) => {
      pc.removeAttribute('style');
    });
  }

  cont.attr('data-paragraph-count', figures.length);
  const grid = cont.closest('.block-grid');
  const figs = grid != null ? grid.querySelectorAll('.item-figure') : null;
  if (grid != null) {
    grid.attr('data-paragraph-count', figs.length);
  }
};

Images.prototype.pushMultipleImageContainer = function pushMultipleImageContainer(count, figure) {
  let node;
  if (typeof figure !== 'undefined') {
    node = figure;
  } else if (document.querySelectorAll('.drop-placeholder').length) {
    node = document.querySelector('.drop-placeholder');
  } else {
    node = this.current_editor.getNode();
  }
  if (!node) {
    return;
  }

  const prntContainer = node.closest('.block-content-inner');
  const item = node.closest('.item');

  const btmContainer = Utils.generateElement(`<div class="${prntContainer.attr('class')}"></div>`);

  while (item.nextElementSibling != null) {
    btmContainer.append(item.nextElementSibling);
  }

  const newTmpl = Utils.generateElement(this.current_editor.templates.blockGridTemplate(count));
  prntContainer.insertAdjacentElement('afterend', newTmpl);
  newTmpl.insertAdjacentElement('afterend', btmContainer);

  this.addImagesInContainer = true;
  btmContainer.prepend(item);
  this.current_editor.setRangeAt(document.querySelector('.item-selected'));

  newTmpl.querySelector('.block-grid-row');
};

Images.prototype.uploadFile = function uploadFile(file, node) {
  if (!this.current_editor.image_options || !this.current_editor.image_options.upload) {
    return;
  }
  const self = this;
  const formData = this.formatData(file);

  this.current_editor.currentRequestCount += 1;

  const oReq = new XMLHttpRequest();
  oReq.open('POST', this.current_editor.image_options.url, true);
  oReq.onprogress = this.updateProgressBar;
  oReq.onload = function onload() {
    if (oReq.status === '200' && oReq.readyState === 4) {
      self.current_editor.currentRequestCount -= 1;
      try {
        let resp = JSON.parse(oReq.responseText);
        if (self.current_editor.upload_callback) {
          resp = self.current_editor.upload_callback(resp);
        }
        self.uploadCompleted(resp, node);
      } catch (e) {
        self.streamer.notifySubscribers('Katana.Error', e);
      }
    } else {
      self.current_editor.currentRequestCount -= 1;
    }
  };
  oReq.send(formData);
};

Images.prototype.updateProgressBar = function updateProgressBar(e) {
  let complete = '';
  if (e.lengthComputable) {
    complete = (e.loaded / e.total) * 100;
    complete = complete != null ? complete : {
      complete: 0,
    };
    Utils.log(complete);
  }
};

Images.prototype.uploadCompleted = function uploadCompleted(ob, node) {
  const ig = node.querySelector('img');
  if (ig) {
    ig.attr('data-image-id', ob.id);
    // const path = `${this.image_cdn_path}/fullsize/${ob.file}`;
    const path = `/fullsize/${ob.file}`;
    node.removeClass('item-uploading');
    ig.attr('data-delayed-src', path);
    return ig.attr('src', path);
  }
  return null;
};

/*
Images.prototype._uploadCompleted = function _uploadCompleted(ob, node) {
  const ig = node.querySelector('img');
  if (ig) {
    ig.attr('data-image-id', ob.id);
    return ig.attr('src', `${this.image_cdn_path}/fullsize/${ob.file}`);
  }
  return null;
};
*/

/*
  * Handles the behavior of deleting images when using the backspace key
  *
  * @param {Event} e    - The backspace event that is being handled
  * @param {Node}  node - The node the backspace was used in,
  *  assumed to be from te editor's getNode() function
  *
  * @return {Boolean} true if this function handled the backspace event, otherwise false
  */

Images.prototype.handleBackspaceKey = function handleBackspaceKey(e, anchorNode) {
  const figure = document.querySelector('.item-selected');
  if (figure && figure.hasClass('item-figure')
    && (typeof anchorNode === 'undefined' || anchorNode === null)) {
    // FIXME check for matched
    if (e.target.hasClass('figure-caption')) {
      return true;
    }
    this.personal_toolbar.removeFigure(figure);

    e.preventDefault();
    this.current_editor.image_toolbar.hide();
    return true;
  } if (figure.hasClass('item-figure')
    && anchorNode && anchorNode.hasClass('item-figure')
    && e.target.tagName === 'FIGCAPTION') {
    const haveTextBefore = this.current_editor.getCharacterPrecedingCaret();
    if (haveTextBefore.killWhiteSpace().length === 0) {
      e.preventDefault();
      this.current_editor.image_toolbar.hide();
      this.personal_toolbar.removeFigure(figure);
      return true;
    }
    return false;
  }
  return true;
};

Images.prototype.handleDeleteKey = function handleDeleteKey(e, node) {
  const sel = document.querySelector('.item-selected');
  if (sel && sel.hasClass('item-figure') && (!node || node.length === 0)) {
    this.personal_toolbar.removeFigure(sel);
    e.preventDefault();
    this.current_editor.image_toolbar.hide();
    return true;
  }
  if (node && node.length && Utils.editableCaretAtEnd(node)) {
    const next = node.nextElementSibling;
    if (next && next.hasClass('item-figure') && !next.hasClass('figure-in-row')) {
      this.personal_toolbar.removeFigure(next);
      e.preventDefault();
      this.current_editor.image_toolbar.hide();
      Utils.setCaretAtPosition(node, node.textContent.length);
      return true;
    }
  }
  return false;
};

Images.prototype.embedParagraphAboveImage = function embedParagraphAboveImage(figure) {
  const cont = figure.closest('.block-content-inner');
  let p = null;
  const createAndAddContainer = (before) => {
    const div = Utils.generateElement(this.current_editor.templates.getSingleLayoutTemplate());
    p = Utils.generateElement(this.current_editor.templates.baseParagraphTmpl());
    div.appendChild(p);
    before.parentNode.insertBefore(div, before);
  };

  if (cont) {
    if (cont.hasClass('center-column')) { // just embed a paragraph above it
      p = Utils.generateElement(this.current_editor.templates.baseParagraphTmpl());
      figure.parentNode.insertBefore(p, figure);
    } else if (cont.hasClass('full-width-column')) {
      const figures = cont.querySelectorAll('.item-figure');
      if (figures.length === 1) {
        createAndAddContainer(cont);
      } else {
        const bottomContainer = Utils.generateElement(this.current_editor.templates.getSingleLayoutTemplate('full-width-column'));
        while (figure.nextElementSibling) {
          bottomContainer.appendChild(figure.nextElementSibling);
        }
        Utils.prependNode(figure, bottomContainer);
        bottomContainer.insertAfter(cont);
        createAndAddContainer(bottomContainer);
      }
    }
  }

  this.current_editor.mergeInnerSections(figure.closest('section'));

  if (p) {
    this.current_editor.image_toolbar.hide();
    this.current_editor.markAsSelected(p);
    this.current_editor.setRangeAt(document.querySelector('.item-selected'));
  }
};

Images.prototype.handleEnterKey = function handleEnterKey(e) {
  const figure = document.querySelector('.figure-focused');
  if (figure && figure.hasClass('item-figure')) {
    e.preventDefault();
    this.embedParagraphAboveImage(figure);
    return true;
  }
  return true;
};

export default Images;
