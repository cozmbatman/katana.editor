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

Images.prototype.initialize = function () {
  const opts = this.opts;
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
    if (typeof event.row != 'undefined') {
      this.addImagesInRow = event.row;  
      this.imageSelect(event);
    } else if(typeof event.figure != 'undefined') {
      this.imageSelect(event);
    }
  });

  return this;
};

Images.prototype.handleClick = function (ev) {
  this.imageSelect(ev);
};

Images.prototype.createRowAroundFigure = function (figure) {
  const row = this.pushMultipleImageContainer(2, figure);
  figure.addClass('figure-in-row');
  const img = figure.querySelector('.item-image');
  row.appendChild(figure);

  if(img != null) {
    this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
  }
  
  return row;
};

Images.prototype.thirdPartyQueue = {};

Images.prototype.queueProcessTimer = null;

Images.prototype.thirdPartyImageProcessed = function (image_element, key) {
  delete this.thirdPartyQueue[key];
  if (Object.keys(this.thirdPartyQueue).length == 0) {
    clearInterval(this.queueProcessTimer);
  }
};

Images.prototype.processSingleImageElement = function (image_element, opts, key) {
  const url = image_element.attr('src');
  const formData = new FormData();
  const _this = this;

  if (url.indexOf('data:image') == 0) {
    formData.append('image', url);
  } else {
    formData.append('url', url);
  }

  this.current_editor.currentRequestCount++;

  const oReq = new XMLHttpRequest();
  oReq.open("POST", '/upload-url', true);
  oReq.onload = function(event) {
    if (oReq.status == 200) {
      try {
        const data = JSON.parse(oReq.responseText);
        if(data.success) {
          const imgSrc = data.file,
              imageId = data.id;
          _this.thirdPartyImageLoaded({url, imageId, key, file: imgSrc});
          _this.current_editor.currentRequestCount--;
        }
      } catch(e) {
        console.log('While uploading image');
        console.error(e);
        _this.current_editor.currentRequestCount--;
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    } else {
      _this.current_editor.currentRequestCount--;
    }
  };
  oReq.send(formData);
};

Images.prototype.processThirdPartyQueue = function () {
  let currentlyProcessing = 0;
  const toProcess = [];

  for (let prop in this.thirdPartyQueue) {
    if (this.thirdPartyQueue.hasOwnProperty(prop)) {
      let item = this.thirdPartyQueue[prop];
      if(item && item.processing) {
        currentlyProcessing++;
      }else if(item && !item.processing) {
        toProcess.push(item);
      }
    }
  }

  if (currentlyProcessing == 2) {
    return;
  }

  for (let i = 0; i < toProcess.length; i = i + 1) {
    toProcess[i].processing = true;
    this.processSingleImageElement(toProcess[i].element, toProcess[i].opts, toProcess[i].key);
    if (i == 1) {
      break;
    }
  }
  
};

Images.prototype.handleThirdPartyImage = function(image_element, opts) {
  const url = image_element.attr('src');
  const key = url + Math.random(0, Math.random()).toString(32).substring(0,8);
  image_element.attr('data-key', key);
  this.thirdPartyQueue[url] = { element : image_element, opts, key };

  if (this.queueProcessTimer == null) {
    this.queueProcessTimer = setInterval(() => {
      this.processThirdPartyQueue();
    }, 3000);
  }

};

Images.prototype.thirdPartyImageLoaded = function (ob) {
  const oldImg = document.querySelector('[src="'+ob.url+'"]'),
      newUrl = this.image_cdn_path + '/fullsize/' + ob.file,
      tmpl = Utils.generateElement(this.current_editor.templates.getFigureTemplate()),
      img = tmpl.querySelector('img');

  img.attr('src', newUrl);
  img.attr('data-delayed-src', newUrl);
  img.attr('data-image-id', ob.imageId);

  img.closest('.item-figure')?.removeClass('item-uploading');
  
  this.replaceImg(oldImg, tmpl, newUrl, (figure, image_element) => {
    this.thirdPartyImageProcessed(image_element, ob.key);

    let insideGraf = figure.closest('.item:not(".item-figure")');
    if (insideGraf != null) {
      do {
        figure.unwrap();
        insideGraf = figure.closest('.item:not(".item-figure")');
      } while(insideGraf != null);
    }

    figure.closest('.ignore-block.item-uploading')?.unwrap();
    image_element.parentNode.removeChild(image_element);
  });

};

Images.prototype.pastedImagesCache = {};

Images.prototype.uploadExistentImage = function(image_element, opts) {
  let src = image_element.attr('src');

  let name;
  if (image_element.hasAttribute('name'))  {
    name = image_element.attr('name');
  }

  if (name) {
      if (typeof this.pastedImagesCache[name] != 'undefined') {
        return;
      }
  } else if (image_element.hasClass('marked')) {
    return;
  }

  image_element.addClass('marked');

  if (name) {
    this.pastedImagesCache[name] = true;
  }

  if (!Utils.urlIsFromDomain(src, 'mefacto.com')) {
    const div = Utils.generateElement(`<div class="ignore-block item-uploading" contenteditable="false"></div>`);
    image_element.parentNode.insertBefore(div, image_element);
    div.appendChild(image_element);
    return this.handleThirdPartyImage(image_element, opts);
  }

  let i, img, n, node, tmpl, _i, _ref,
      pasting = false;

  if (opts == null) {
    opts = {};
  }

  tmpl = Utils.generateElement(this.current_editor.templates.getFigureTemplate());
  
  if (this.addImagesInContainer) {
    tmpl.addClass('figure-in-row');
  }

  if (image_element.closest(".item") != null) {
    if (image_element.closest(".item").hasClass("item-figure")) {
      return;
    }
    const itm = image_element.closest('.item');
    itm.parentNode.insertBefore(tmpl, itm);
    node = this.current_editor.getNode();
    if (node) {
      this.current_editor.addClassesToElement(node);
    }
  } else if(image_element.closest(this.current_editor.paste_element_id) != null) {
    pasting = true;
    image_element.parentNode.insertBefore(tmpl, image_element);
  }else {
    img = image_element.parentsUntil(".block-content-inner");
    if(img != null) {
      img = img.firstChild;
      img.parentNode.insertBefore(tmpl, img);
      img.parentNode.removeChild(img);
    }
  }

  if (!pasting) {
    this.replaceImg(image_element, document.querySelector("[name='" + (tmpl.attr('name')) + "']"));
    n = document.querySelector("[name='" + (tmpl.attr('name')) + "']");
    if(n != null) {
      n = n.parentsUntil(".block-content-inner");
      if (n != null) {
        for (i = _i = 0, _ref = n - 1; _i <= _ref; i = _i += 1) {
          document.querySelector("[name='" + (tmpl.attr('name')) + "']").unwrap();
        }
      }
    }
  } else {
    this.replaceImg(image_element, document.querySelector("[name='" + (tmpl.attr('name')) + "']"));
  }
  
  return ;
};

Images.prototype.replaceImg = function(image_element, figure, srcToUse, callback) {
  let img = new Image(), self = this, sr;
  
  if (typeof srcToUse == 'undefined' && typeof callback == 'undefined') {
    img.attr('src', image_element.attr('src') );  
    sr = image_element.attr('src');
    const fig = image_element.closest('figure');
    if(fig != null) {
      fig.parentNode.removeChild(fig);
    }
    image_element.parentNode.removeChild(image_element);
    let ig = figure.querySelector('img');
    if(ig != null) {
      ig.attr('src', sr);
      ig.attr('data-delayed-src',sr);
    }
  } else {
    img.attr('src', srcToUse);
    sr = srcToUse;
  }

  img.attr('data-delayed-src', sr);
  
  return img.onload = function() {
    self.setAspectRatio(figure, this.width, this.height);

    const fig = figure.querySelector(".item-image");
    if(fig != null) {
      fig.attr("data-height", this.height);
      fig.attr("data-width", this.width);
    }
    
    if (this.naturalWidth < 760) {
      figure.addClass('n-fullSize');
    } else {
      figure.removeChild('n-fullSize');
    }
    
    if (typeof srcToUse == 'undefined') {
      let ig = figure.querySelector('img');
      if(ig != null) {
        return ig.attr('src', sr);
      }
      return null;
    }else {
      let ig = figure.querySelector('img');
      if(ig != null) {
        ig.attr('src', srcToUse);
      }
      image_element.parentNode.insertBefore(figure, image_element);
      image_element.parentNode.removeChild(image_element);
    }

    if (typeof callback != 'undefined') {
      callback(figure, image_element);
    }
    
  };
};

Images.prototype.displayAndUploadImages = function(file, cont, callback) {
  this.displayCachedImage(file, cont, callback);
};

Images.prototype.viaDrop = false;

Images.prototype.imageSelect = function(ev) {
  let selectFile, self;
  selectFile = Utils.generateElement('<input type="file" multiple="multiple">');
  selectFile.click();
  self = this;
  return selectFile.addEventListener('change', function() {
    const t = this;
    self.viaDrop = false;
    if(ev.row) {
      self.addImagesInRow = ev.row;
    }else {
      self.addImagesInRow = false;
    }

    if (typeof ev.figure != 'undefined') {
      self.wrapFigureWithAdditions = ev.figure;
    } else {
      self.wrapFigureWithAdditions = false;
    }
    self.addImagesInContainer = false;
    return self.uploadFiles(t.files);
  });
};

Images.prototype.displayCachedImage = function(file, cont, callback) {
  this.current_editor.content_bar.hide();
  window.URL = window.webkitURL || window.URL; // Vendor prefixed in Chrome.

  const img = document.createElement('img');
  const _this = this;
  img.onload = function(e) {
    
    if (_this.droppedCount) {
      _this.droppedCount--;
    }

    const node = _this.viaDrop ? document.querySelector('.drop-placeholder') : _this.current_editor.getNode();
    const self = _this;
  
    let img_tag, new_tmpl, replaced_node;
    new_tmpl = Utils.generateElement(self.current_editor.templates.getFigureTemplate());

    if(typeof cont != 'undefined' && cont != null) {
      new_tmpl.addClass('figure-in-row');

      if(cont.contains(node)) {
        node.insertAdjacentElement('afterend', new_tmpl);
        replaced_node = new_tmpl; //node.parentNode.insertBefore(new_tmpl, node);
      }else {
        replaced_node = new_tmpl;
        cont.appendChild(replaced_node);
      }
    } else {
      replaced_node = node.parentNode.insertBefore(new_tmpl, node);
    }

    img_tag = new_tmpl.querySelector('img.item-image');
    if(img_tag != null) {
      img_tag.attr('src', e.target.currentSrc ? e.target.currentSrc : e.target.result);
    }
    img_tag.height = this.height;
    img_tag.width = this.width;
    
    self.setAspectRatio(replaced_node, this.width, this.height);
    
    let rig = replaced_node.querySelector(".item-image");
    
    if(rig != null) {
      rig.attr("data-height", this.height);
      rig.attr("data-width", this.width);
    }
    
    if (this.naturalWidth < 700) {
      replaced_node.addClass('n-fullSize');
    } else {
      replaced_node.removeClass('n-fullSize');
    }

    if(self.current_editor.image_options && self.current_editor.image_options.upload) {
      new_tmpl.addClass('item-uploading');
      // release blob when actual image uploads starts
      window.URL.revokeObjectURL(this.src); // Clean up after yourself
    }

    if( typeof callback != 'undefined') {
      callback(replaced_node); // let the callback know the image has been places, we need to adjust width incase of multiple images select  
    }
    if (_this.droppedCount == 0) {
      let dp = document.querySelector('.drop-placeholder');
      if(dp != null) {
        dp.parentNode.removeChild(dp);
      }
    }
    self.uploadFile(file, replaced_node);
  };

  img.src = window.URL.createObjectURL(file);

};

Images.prototype.setAspectRatio = function(figure, w, h) {
  let fill_ratio, height, maxHeight, maxWidth, ratio, width;
  maxWidth = 760;
  maxHeight = 700;
  ratio = 0;
  width = w;
  height = h;

  if (figure.hasClass('figure-in-row')) {
    maxWidth = figure.closest('.block-grid-row').getBoundingClientRect().width;
    maxHeight = Utils.getWindowWidth();
  }
  
  if (width > maxWidth) {
    ratio = maxWidth / width;
    height = height * ratio;
    width = width * ratio;
  } else if (height > maxHeight) {
    ratio = maxHeight / height;
    width = width * ratio;
    height = height * ratio;
  }

  fill_ratio = height / width * 100;

  let pc = figure.querySelector(".padding-cont");
  if(pc != null) {
    pc.style.maxWidth = width + 'px';
    pc.style.maxHeight = height + 'px';
  }

  let pb = figure.querySelector(".padding-box");
  if(pb != null) {
    pb.style.paddingBottom = fill_ratio + "%";
  }
};

Images.prototype.formatData = (file) => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return formData;
};

Images.prototype.droppedCount = -1;

Images.prototype.uploadFiles = function(files, viaDrop) {
  this.batchesFiles = [];
  if (typeof viaDrop != 'undefined' && viaDrop) {
    this.viaDrop = true;
  }

  let sizeLimit = 17900000, // 8 MB

  acceptedTypes, file, i, _results, sizeError;
  
  acceptedTypes = {
    "image/png": true,
    "image/jpeg": true,
    "image/gif": true
  };

  i = 0;
  _results = [],

  sizeError = false;
  
  while (i < files.length) {
    file = files[i];
    if (acceptedTypes[file.type] === true) {
      if (file.size <= sizeLimit) {
        this.batchesFiles.push(file);
      } else {
        sizeError = true;
      }
    }
    _results.push(i++);
  }

  if (sizeError) {
    this.streamer.notifySubscribers('Katana.Error', {
        target : 'image',
        message: 'Max file size exceeded'
      });
    return;
  }

  if (this.batchesFiles.length == 0) {
    let dp = document.querySelector('.drop-placeholder');
    if(dp != null) {
      dp.parentNode.removeChild(dp);
    }
    this.viaDrop = false;
    this.droppedCount = this.batchesFiles.length;
  }

  this.addImagesOnScene();
  return _results;
};

Images.prototype.addImagesOnScene = function () {
  let batch = this.batchesFiles,
      size = batch.length,
      cont = false;
  if(!size) {
    return;
  }

  if (this.wrapFigureWithAdditions) {
    const figure = this.wrapFigureWithAdditions;
    const row = this.pushMultipleImageContainer(2, figure);
    figure.addClass('figure-in-row');
    const img = figure.querySelector('.item-image');
    row.appendChild(figure);

    if(img != null) {
      this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
    }
    cont = row;
    this.wrapFigureWithAdditions = false;
  }

  if (this.addImagesInRow) {
    const len = size > 3 ? 3 : size;
    for (let i = 0; i < len; i = i + 1) {
      this.displayAndUploadImages(batch[i], this.addImagesInRow, this.imageUploadCallback);
    }
    return;
  }

  if (size == 1 && !cont) {
    this.displayAndUploadImages(this.batchesFiles[0], null, this.imageUploadCallback);
  } else if(size > 1 && size < 9 || cont) {
    if (!cont) {
      cont = this.pushMultipleImageContainer(size);  
    }
    let k = 0;
    while (k < size) {
      const l = ((k + 3) > size) ? size : k + 3;

      for (let i = k; i < l; i = i + 1) {
        this.displayAndUploadImages(batch[i], cont, this.imageUploadCallback);  
        k++;
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

Images.prototype.imageUploadCallback = function (figure) {
  let node ,parentNode;
  node = figure;
  parentNode = node.parentNode;

  if(parentNode != null && parentNode.hasClass('block-grid-row')) {
    const count = parentNode.attr('data-paragraph-count'),
    figures = parentNode.querySelectorAll('.figure-in-row');
    this.fixPositioningForMultipleImages(parentNode, figures, count);

    if (figures.length == count) {

      if(parentNode.querySelector('.item-selected') != null) { // move to next section , so that its width doesn't change
        const selected = parentNode.querySelector('.item-selected'),
          next_cont = parentNode.next('.block-content-inner');
        let first_child = null;

        if(next_cont != null) {
          for(let i = 0; i < next_cont.children.length; i++) {
            let ncc = next_cont.children[i];
            if(ncc.hasClass('item')) {
              first_child = ncc;
              break;
            }
          }
        }

        if(first_child != null) {
          first_child.parentNode.insertBefore(selected, first_child);
        }else {
          next_cont.appendChild(selected);
        }
      }

      //this.current_editor.cleanUpInnerSections();
      this.current_editor.selectFigure(node);
    }
  }else {
    this.current_editor.setupFirstAndLast();
    this.current_editor.selectFigure(figure);
  }
};

Images.prototype.fixPositioningForMultipleImages = function (cont, figures, count)  {
  if(cont == null) {
    return;
  }
  let ratios = [],
      rsum = 0,
      height, 
      len = figures.length,
      widths = [],
      totalWidth = cont.getBoundingClientRect().width,
      i = 0;

  for (i; i < len; i = i + 1) {
    const fig = figures[i];
    const ig = fig.querySelector('img')
    let nw = 0, nh = 0;
    if(ig != null) {
      if (ig.hasAttribute('data-width')) {
        nw = parseInt(ig.attr('data-width'));
      } else {
        nw = ig.naturalWidth;
      }
      if (ig.hasAttribute('data-height')) {
        nh = parseInt(ig.attr('data-height'));
      } else {
        nh = ig.naturalHeight;
      }
    }
    this.setAspectRatio(fig, nw, nh);
  }

  for (i = 0; i < len; i = i +1 ) {
    const ig = figures[i].querySelector('img');
    if(ig != null) {
      let r = parseFloat(ig.attr('data-width')) / parseFloat(ig.attr('data-height'));
      rsum += r;
      ratios[i] = r;
    }
  }

  height = totalWidth / rsum;

  for(i = 0; i < len; i = i +1 ) {
    const fig = figures[i],
      wid = ((ratios[i] * height) / totalWidth) * 100;
    fig.style.width = wid + '%';
  }

  if (count == 1) {
    const pcA = figures[0].querySelectorAll('.padding-cont');
    pcA.forEach(pc => {
      pc.removeAttribute('style');
    });
  }

  cont.attr('data-paragraph-count', figures.length);
  const grid = cont.closest('.block-grid');
  const figs = grid != null ? grid.querySelectorAll('.item-figure') : null;
  if(grid != null) {
    grid.attr('data-paragraph-count', figs.length);
  }
  
};

Images.prototype.pushMultipleImageContainer = function (count, figure) {
  let node;
  if (typeof figure != 'undefined') {
    node = figure;
  } else if (document.querySelectorAll('.drop-placeholder').length) {
    node = document.querySelector('.drop-placeholder');
  } else {
    node = this.current_editor.getNode();
  }
  if(node == null) {
    return;
  }
  
  const parentContainer = node.closest('.block-content-inner');
  const item = node.closest('.item');

  const bottomContainer = Utils.generateElement(`<div class="${parentContainer.attr('class')}"></div>`);

  while(item.nextElementSibling != null) {
    bottomContainer.append(item.nextElementSibling);
  }

  const new_tmpl = Utils.generateElement(this.current_editor.templates.blockGridTemplate(count));
  parentContainer.insertAdjacentElement('afterend', new_tmpl);
  new_tmpl.insertAdjacentElement('afterend', bottomContainer);

  this.addImagesInContainer = true;
  bottomContainer.prepend(item);
  this.current_editor.setRangeAt(document.querySelector('.item-selected'));

  return new_tmpl.querySelector('.block-grid-row');
};

Images.prototype.uploadFile = function(file, node) {
  if(!this.current_editor.image_options || !this.current_editor.image_options.upload) {
    return;
  }
  const _this = this;
  const formData = this.formatData(file);

  this.current_editor.currentRequestCount++;

  const oReq = new XMLHttpRequest();
  oReq.open("POST", this.current_editor.image_options.url, true);
  oReq.onprogress = this.updateProgressBar;
  oReq.onload = function(event) {
    if (oReq.status == 200) {
      _this.current_editor.currentRequestCount--;
      try {
        let resp = JSON.parse(oReq.responseText);
        if (_this.current_editor.upload_callback) {
          resp = _this.current_editor.upload_callback(resp);
        }
        _this.uploadCompleted(resp, node);
      } catch(e) {
        console.log('--- image upload issue ---');
        console.error(e);
        _this.streamer.notifySubscribers('Katana.Error', e);
      }
    } else {
      _this.current_editor.currentRequestCount--;
    }
  };
  oReq.send(formData);
};


Images.prototype.updateProgressBar = function(e) {
  let complete = "";
  if (e.lengthComputable) {
    complete = e.loaded / e.total * 100;
    complete = complete != null ? complete : {
      complete: 0
    };
    return Utils.log(complete);
  }
};

Images.prototype.uploadCompleted = function(ob, node) {
  const ig = node.querySelector('img');
  if(ig != null) {
    ig.attr('data-image-id', ob.id);
    const path = `${this.image_cdn_path}/fullsize/${ob.file}`;
    node.removeClass('item-uploading');
    ig.attr('data-delayed-src', path);
    return ig.attr('src', path);
  }
  return null;
};

Images.prototype._uploadCompleted = function (ob, node) {
  const ig = node.querySelector('img');
  if(ig != null) {
    ig.attr('data-image-id', ob.id);
    return ig.attr('src', `${this.image_cdn_path}/fullsize/${ob.file}`);
  }
  return null;
};

/*
  * Handles the behavior of deleting images when using the backspace key
  *
  * @param {Event} e    - The backspace event that is being handled
  * @param {Node}  node - The node the backspace was used in, assumed to be from te editor's getNode() function
  *
  * @return {Boolean} true if this function handled the backspace event, otherwise false
  */

Images.prototype.handleBackspaceKey = function(e, anchor_node) {      
  const figure = document.querySelector(".item-selected");
  if (figure != null && figure.hasClass("item-figure") && (typeof anchor_node === "undefined" || anchor_node === null)) {
    
    //FIXME check for matched
    if(e.target.hasClass('figure-caption')) {
      return true;
    }
    this.personal_toolbar.removeFigure(figure);
    
    e.preventDefault();
    this.current_editor.image_toolbar.hide();
    return true;
  } else if(figure.hasClass('item-figure') && anchor_node && anchor_node.hasClass('item-figure') && e.target.tagName == "FIGCAPTION") {
    const haveTextBefore = this.current_editor.getCharacterPrecedingCaret();
    if (haveTextBefore.killWhiteSpace().length == 0) {
      e.preventDefault();
      this.current_editor.image_toolbar.hide();
      this.personal_toolbar.removeFigure(figure);
      return true;          
    }
    return false;
  }
  return true;
};

Images.prototype.handleDeleteKey = function (e, node) {
  const sel = document.querySelector('.item-selected');
  if (sel != null && sel.hasClass('item-figure') && (!node || node.length == 0)) {
    this.personal_toolbar.removeFigure(sel);
    e.preventDefault();
    this.current_editor.image_toolbar.hide();
    return true;
  }
  if (node && node.length && Utils.editableCaretAtEnd(node)) {
    const next = node.nextElementSibling;
    if (next != null && next.hasClass('item-figure') && !next.hasClass('figure-in-row')) {
      this.personal_toolbar.removeFigure(next);
      e.preventDefault();
      this.current_editor.image_toolbar.hide();
      Utils.setCaretAtPosition(node, node.textContent.length);
      return true;
    }
  }
  return false;
};

Images.prototype.embedParagraphAboveImage = function(figure) {
  let cont = figure.closest('.block-content-inner'),
      p = null,
    createAndAddContainer = (before) => {
      const div = Utils.generateElement(this.current_editor.templates.getSingleLayoutTemplate());
      const p = Utils.generateElement(this.current_editor.templates.baseParagraphTmpl());
      div.appendChild(p);
      before.parentNode.insertBefore(div, before);
    };

  if(cont != null) {
    if (cont.hasClass('center-column')) { // just embed a paragraph above it
      p = Utils.generateElement(this.current_editor.templates.baseParagraphTmpl());
      figure.parentNode.insertBefore(p, figure);
    } else if(cont.hasClass('full-width-column')) {
      const figures = cont.querySelectorAll('.item-figure');
      if (figures.length == 1) {
        createAndAddContainer(cont);
      } else {
        let bottomContainer = Utils.generateElement(this.current_editor.templates.getSingleLayoutTemplate("full-width-column"));
        while(figure.nextElementSibling != null) {
          bottomContainer.appendChild(figure.nextElementSibling);
        }
        Utils.prependNode(figure, bottomContainer);
        bottomContainer.insertAfter(cont);
        createAndAddContainer(bottomContainer);
      }
    }
  }

  this.current_editor.mergeInnerSections(figure.closest('section'));

  if(p != null) {
    this.current_editor.image_toolbar.hide();
    this.current_editor.markAsSelected(p);
    this.current_editor.setRangeAt(document.querySelector('.item-selected'));
  }
  
};

Images.prototype.handleEnterKey = function(e, node) {
  const figure = document.querySelector('.figure-focused');
  if (figure != null && figure.hasClass('item-figure')) {
    e.preventDefault();
    this.embedParagraphAboveImage(figure);
    return true;
  }
  return true;
};

export default Images;

