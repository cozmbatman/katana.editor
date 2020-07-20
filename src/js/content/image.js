import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

function Images(opts) {
  this.opts = opts;
  this.stream = Stream;

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

  const _this = this;

  this.stream.subscribe('Katana.Images.Restructure', (event) => {
    _this.fixPositioningForMultipleImages(event.container, event.figures, event.count);
  });

  this.stream.subscribe('Katana.Images.Add', (event) => {
    if (typeof event.row != 'undefined') {
      _this.addImagesInRow = event.row;  
      _this.imageSelect(event);
    } else if(typeof event.figure != 'undefined') {
      _this.imageSelect(event);
    }
  });

  return this;
};

Images.prototype.handleClick = function (ev) {
  this.imageSelect(ev);
};

Images.prototype.createRowAroundFigure = function (figure) {
  var row = this.pushMultipleImageContainer(2, figure);
  figure.addClass('figure-in-row');
  var img = figure.querySelector('.item-image');
  row.appendChild(figure);

  if(img != null) {
    img = img;
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
          var imgSrc = data.file,
              imageId = data.id;
          _this.thirdPartyImageLoaded({url: url, file: imgSrc, imageId: imageId, key: key});
          _this.current_editor.currentRequestCount--;
        }
      } catch(e) {
        console.log('While uploading image');
        console.error(e);
        _this.current_editor.currentRequestCount--;
      }
    } else {
      _this.current_editor.currentRequestCount--;
    }
  };
  oReq.send(formData);
};

Images.prototype.processThirdPartyQueue = function () {
  var currentlyProcessing = 0, toProcess = [],
    process;

  for (var prop in this.thirdPartyQueue) {
    if (this.thirdPartyQueue.hasOwnProperty(prop)) {
      var item = this.thirdPartyQueue[prop];
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

  for (var i = 0; i < toProcess.length; i = i + 1) {
    toProcess[i].processing = true;
    this.processSingleImageElement(toProcess[i].element, toProcess[i].opts, toProcess[i].key);
    if (i == 1) {
      break;
    }
  }
  
};

Images.prototype.handleThirdPartyImage = function(image_element, opts) {
  var url = image_element.attr('src');
  var key = url + Math.random(0, Math.random()).toString(32).substring(0,8);
  image_element.attr('data-key', key);
  this.thirdPartyQueue[url] = {element : image_element, opts: opts, key: key};
  var _this = this;

  if (this.queueProcessTimer == null) {
    this.queueProcessTimer = setInterval(function () {
      _this.processThirdPartyQueue();
    }, 3000);
  }

};

Images.prototype.thirdPartyImageLoaded = function (ob) {
  var oldImg = document.querySelector('[src="'+ob.url+'"]'),
      newUrl = this.image_cdn_path + '/fullsize/' + ob.file,
      tmpl = Utils.generateElement(this.current_editor.getFigureTemplate()),
      _this = this,
      img = tmpl.querySelector('img');

  img.attr('src', newUrl);
  img.attr('data-delayed-src', newUrl);
  img.attr('data-image-id', ob.imageId);

  var figure = img.closest('.item-figure');
  if(figure != null) {
    figure.removeClass('item-uploading');
  }

  this.replaceImg(oldImg, tmpl, newUrl, function (figure, image_element) {
    _this.thirdPartyImageProcessed(image_element, ob.key);

    var insideGraf = figure.closest('.item:not(".item-figure")');
    if (insideGraf != null) {
      do {
        figure.unwrap();
        insideGraf = figure.closest('.item:not(".item-figure")');
      } while(insideGraf != null);
    }
    if (figure.closest('.ignore-block.item-uploading') != null) {
      figure.unwrap();
    }
    image_element.parentNode.removeChild(image_element);
  });

};

Images.prototype.pastedImagesCache = {};

Images.prototype.uploadExistentImage = function(image_element, opts) {
  var src = image_element.attr('src');

  var name;
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
    var div = Utils.generateElement(`<div class="ignore-block item-uploading" contenteditable="false"></div>`);
    image_element.parentNode.insertBefore(div, image_element);
    div.appendChild(image_element);
    return this.handleThirdPartyImage(image_element, opts);
  }

  var i, img, n, node, tmpl, _i, _ref,
      pasting = false;

  if (opts == null) {
    opts = {};
  }

  tmpl = Utils.generateElement(this.current_editor.getFigureTemplate());
  
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
  }else {
    this.replaceImg(image_element, document.querySelector("[name='" + (tmpl.attr('name')) + "']"));
  }
  
  return ;
};

Images.prototype.replaceImg = function(image_element, figure, srcToUse, callback) {
  var img, self,sr;
  
  img = new Image();

  if (typeof srcToUse == 'undefined' && typeof callback == 'undefined') {
    img.attr('src', image_element.attr('src') );  
    sr = image_element.attr('src');
    var imgE = image_element;
    const fig = imgE.closest('figure');
    if(fig != null) {
      fig.parentNode.removeChild(fig);
    }
    imgE.parentNode.removeChild(imgE);
    let ig = figure.querySelector('img');
    if(ig != null) {
      ig.attr('src', sr);
      ig.attr('data-delayed-src',sr);
    }
  } else {
    img.attr('src',srcToUse);
    sr = srcToUse;
  }

  img.attr('data-delayed-src', sr);
  
  self = this;
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
    var t;
    t = this;
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

  var img = document.createElement('img');
  var _this = this;
  img.onload = function(e) {
    
    if (_this.droppedCount) {
      _this.droppedCount--;
    }

    var img, node, self;
    node = _this.viaDrop ? document.querySelector('.drop-placeholder') : _this.current_editor.getNode();

    self = _this;
  
    var img_tag, new_tmpl, replaced_node;
    new_tmpl = Utils.generateElement(self.current_editor.getFigureTemplate());

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

    if (img_tag.naturalWidth < 700) {
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
  var fill_ratio, height, maxHeight, maxWidth, ratio, result, width;
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

Images.prototype.formatData = function(file) {
  var formData;
  formData = new FormData();
  formData.append('file', file, file.name);
  return formData;
};

Images.prototype.droppedCount = -1;

Images.prototype.uploadFiles = function(files, viaDrop) {
  this.batchesFiles = [];
  if (typeof viaDrop != 'undefined' && viaDrop) {
    this.viaDrop = true;
  }

  var sizeLimit = 17900000, // 8 MB

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
    this.current_editor.notifySubscribers('Katana.Error', {
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
  var batch = this.batchesFiles,
      size = batch.length,
      cont = false,
      i = 0;
  if(!size) {
    return;
  }

  if (this.wrapFigureWithAdditions) {
    var figure = this.wrapFigureWithAdditions;
    var row = this.pushMultipleImageContainer(2, figure);
    figure.addClass('figure-in-row');
    var img = figure.querySelector('.item-image');
    row.appendChild(figure);

    if(img != null) {
      this.setAspectRatio(figure, img.naturalWidth, img.naturalHeight);
    }
    cont = row;
    this.wrapFigureWithAdditions = false;
  }

  if (this.addImagesInRow) {
    var len = size > 3 ? 3 : size;
    for (var i = 0; i < len; i = i + 1) {
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
    k = 0;
    while (k < size) {
      var l = ((k + 3) > size) ? size : k + 3;

      for (i = k; i < l; i = i + 1) {
        this.displayAndUploadImages(batch[i], cont, this.imageUploadCallback);  
        k++;
      }

      if (k >= size) {
        break;
      }

      var newCount = size - l > 3 ? 3 : size - l;
      var newRow = this.blockGridRowTemplate(newCount);
      newRow.insertAfter(cont);
      cont = newRow;
    }
  }
};

Images.prototype.imageUploadCallback = function (figure) {
  var node ,parentNode;
  node = figure;
  parentNode = node.parentNode;
  if(parentNode != null && parentNode.hasClass('block-grid-row')) {
    var count = parentNode.attr('data-paragraph-count'),
    figures = parentNode.querySelectorAll('.figure-in-row');
    this.fixPositioningForMultipleImages(parentNode, figures, count);

    if (figures.length == count) {

      if(parentNode.querySelector('.item-selected') != null) { // move to next section , so that its width doesn't change
        var selected = parentNode.querySelector('.item-selected'),
            next_cont = parentNode.next('.block-content-inner'),
            first_child = null;

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
  var ratios = [],
      rsum = 0,
      height, 
      len = figures.length,
      widths = [],
      totalWidth = cont.getBoundingClientRect().width,
      i = 0;

  for (i; i < len; i = i + 1) {
    var fig = figures[i];
    var  ig = fig.querySelector('img')
    var nw = nh = 0;
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
    var ig = figures[i].querySelector('img');
    if(ig != null) {
      r = parseFloat(ig.attr('data-width')) / parseFloat(ig.attr('data-height'));
      rsum += r;
      ratios[i] = r;
    }
  }

  height = totalWidth / rsum;

  for(i = 0; i < len; i = i +1 ) {
    var fig = figures[i],
        wid = ((ratios[i] * height) / totalWidth) * 100;
        fig.style.width = wid + '%';
  }

  if (count == 1) {
    let pcA = figures[0].querySelectorAll('.padding-cont');
    pcA.forEach(pc => {
      pc.removeAttribute('style');
    });
  }

  cont.attr('data-paragraph-count', figures.length);
  var grid = cont.closest('.block-grid');
  var figs = grid != null ? grid.querySelectorAll('.item-figure') : null;
  if(grid != null) {
    grid.attr('data-paragraph-count', figs.length);
  }
  
};

Images.prototype.blockGridRowTemplate = function (count) {
  return Utils.generateElement(`<div class="block-grid-row" data-name="${Utils.generateId()}" data-paragraph-count="${count}"></div>`);
};

Images.prototype.blockGridTemplate = function (count) {
  var ht = `<figure class="block-content-inner block-grid item-text-default" data-name="${Utils.generateId()}" >
  <div class="block-grid-row" data-name="${Utils.generateId()}" data-paragraph-count="${count}"></div>
  <figcaption class="block-grid-caption" data-name="${Utils.generateId()}" data-placeholder-value="Type caption for image (optional)"><span class="placeholder-text">Type caption for image (optional)</span></figcaption>
  </figure>`;
  return Utils.generateElement(ht);
}

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
  
  var parentContainer = node.closest('.block-content-inner');
  var item = node.closest('.item');

  var bottomContainer = Utils.generateElement(`<div class="${parentContainer.attr('class')}"></div>`);

  while(item.nextElementSibling != null) {
    bottomContainer.append(item.nextElementSibling);
  }

  var new_tmpl = this.blockGridTemplate(count);
  parentContainer.insertAdjacentElement('afterend', new_tmpl);
  //new_tmpl.insertAfter(parentContainer);
  new_tmpl.insertAdjacentElement('afterend', bottomContainer);
  //bottomContainer.insertAfter(new_tmpl);

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
        _this.current_editor.notifySubscribers('Katana.Error', e);
      }
    } else {
      _this.current_editor.currentRequestCount--;
    }
  };
  oReq.send(formData);

};

Images.prototype.updateProgressBar = function(e) {
  var complete;
  complete = "";
  if (e.lengthComputable) {
    complete = e.loaded / e.total * 100;
    complete = complete != null ? complete : {
      complete: 0
    };
    return Utils.log(complete);
  }
};

Images.prototype.uploadCompleted = function(ob, node) {
  var ig = node.querySelector('img');
  if(ig != null) {
    ig.attr('data-image-id', ob.id);
    var path = `${this.image_cdn_path}/fullsize/${ob.file}`;
    node.removeClass('item-uploading');
    ig.attr('data-delayed-src', path);
    return ig.attr('src', path);
  }
  return null;
};

Images.prototype._uploadCompleted = function (ob, node) {
  var ig = node.querySelector('img');
  if(ig != null) {
    ig.attr('data-image-id', ob.id);
    var path = `${this.image_cdn_path}/fullsize/${ob.file}`;
    return ig.attr('src', path);
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
  var figure = document.querySelector(".item-selected");
  if (figure != null && figure.hasClass("item-figure") && (typeof anchor_node === "undefined" || anchor_node === null)) {
    
    if(e.target.hasClass('figure-caption')) {
      return true;
    }
    this.personal_toolbar.removeFigure(figure);
    var ret = false;

    e.preventDefault();
    this.current_editor.image_toolbar.hide();
    return true;
  } else if(figure.hasClass('item-figure') && anchor_node && anchor_node.hasClass('item-figure') && e.target.tagName == "FIGCAPTION") {
    var haveTextBefore = this.current_editor.getCharacterPrecedingCaret();
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
  var sel = document.querySelector('.item-selected');
  if (sel != null && sel.hasClass('item-figure') && (!node || node.length == 0)) {
    this.personal_toolbar.removeFigure(sel);
    e.preventDefault();
    this.current_editor.image_toolbar.hide();
    return true;
  }
  if (node && node.length && Utils.editableCaretAtEnd(node)) {
    var next = node.nextElementSibling;
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
  var cont = figure.closest('.block-content-inner'),
      self = this,
      p = null,
    createAndAddContainer = function(before) {
      var div = Utils.generateElement(self.current_editor.getSingleLayoutTempalte());
      p = Utils.generateElement(self.current_editor.baseParagraphTmpl());
      div.appendChild(p);
      before.parentNode.insertBefore(div, before);
    };

  if(cont != null) {
    if (cont.hasClass('center-column')) { // just embed a paragraph above it
      p = Utils.generateElement(this.current_editor.baseParagraphTmpl());
      figure.parentNode.insertBefore(p, figure);
    } else if(cont.hasClass('full-width-column')) {
      var figures = cont.querySelectorAll('.item-figure');
      if (figures.length == 1) {
        createAndAddContainer(cont);
      }else {
        var bottomContainer = Utils.generateElement(`<div class="block-content-inner full-width-column"></div>`);
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
    self.current_editor.image_toolbar.hide();
    self.current_editor.markAsSelected(p);
    self.current_editor.setRangeAt(document.querySelector('.item-selected'));
  }
  
};

Images.prototype.handleEnterKey = function(e, node) {
  var figure = document.querySelector('.figure-focused');
  if (figure != null && figure.hasClass('item-figure')) {
    e.preventDefault();
    this.embedParagraphAboveImage(figure);
    return true;
  }
  return true;
};

export default Images;

