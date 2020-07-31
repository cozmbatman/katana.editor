import Utils from './utils';

function Templates() {
  let storySectionFilter = null;

  this.init = (opts) => {
    const embedPlcStr = opts.embed ? opts.embed : 'Paste a YouTube video link, and press Enter';
    const titlePlcStr = opts.title ? opts.title : 'Title here';
    const subTitlePlcStr = opts.subtitle ? opts.subtitle : 'Start with introduction ..';

    storySectionFilter = opts.storySectionFilter;

    this.embed_placeholder = `<span class='placeholder-text placeholder-text--root'>${embedPlcStr}</span><br>`;

    this.title_placeholder = `<span class="placeholder-text placeholder-text--root" data-placeholder-text="${titlePlcStr}">${titlePlcStr}</span><br>`;
    this.subtitle_placeholder = `<span class="placeholder-text placeholder-text--root" data-placeholder-text="${subTitlePlcStr}">${subTitlePlcStr}</span><br>`;
  };

  this.singleItemTemplate = (etype) => `<${etype} class='item item-${etype} item-empty item-selected'><br/></${etype}>`;

  this.canvasTemplate = () => '<canvas class="parallax"></canvas>';

  this.imageToolbarBase = () => this.textToolbarBase('mf-toolbar-base-image');

  this.textToolbarBase = (kls = '') => `<div class='mf-menu mf-toolbar-base mf-toolbar ${kls} hide' ></div>`;

  this.contentToolbarBase = () => "<div class='inlineContentOptions inlineTooltip' id='mfContentBase'></div>";

  this.singleColumnPara = (kls = '') => this.getSingleLayoutTemplate('', `<p class="item item-p ${kls}" name="${Utils.generateId()}"><br /></p>`);

  this.getSingleLayoutTemplate = (kls = '', el = '') => `<div class="block-content-inner ${kls || 'center-column'}">${el}</div>`;

  this.gridRowTemplate = (para = 0) => `<div class="block-grid-row" data-name="${Utils.generateId()}" ${para ? `data-paragraph-count="${para}"` : ''}></div>`;

  this.blockGridTemplate = (para = 0) => `<figure class="block-content-inner block-grid item-text-default" data-name="${Utils.generateId()}" >
    ${this.gridRowTemplate(para)}
    <figcaption class="block-grid-caption" data-name="${Utils.generateId()}" data-placeholder-value="Type caption for image (optional)"><span class="placeholder-text">Type caption for image (optional)</span></figcaption>
    </figure>`;

  this.toolbarTemplate = (buttons = []) => {
    let html = `<div class="mf-menu-linkinput">
        <input class="mf-menu-input" placeholder="https://">
        <div class="mf-menu-button mf-link-close">&#215;</div></div>
        <ul class='mf-menu-buttons'>`;
    for (let i = 0; i < buttons.length; i += 1) {
      const item = buttons[i];
      html += `<li class='mf-menu-button'><i class="mf-icon mfi-${item.i}"  data-action="${item.a}"></i></li>`;
    }

    html += '</ul>';
    return html;
  };

  this.anchorMarkup = (link, kls = '', nofollow = false, content = '') => `<a ${nofollow ? 'rel="nofollow"' : ''} href="${link}" data-href="${link}" class="markup-anchor ${kls}">${content}</a>`;

  this.contentBasicButtonsWrap = (menu) => `<button class='inlineTooltip-button control' data-action='inline-menu' title='Content Options'> <span class='tooltip-icon mfi-plus'></span> </button> <div class='inlineTooltip-menu'>${menu}</div>`;
  this.contentBasicButton = (b, dataActionValue) => `<button class="inlineTooltip-button scale" title="${b.title}" data-action="inline-menu-${b.action}" data-action-value="${dataActionValue}"> <span class="tooltip-icon ${b.icon}"></span> </button>`;

  const getPlaceholders = () => `<h3 class="item item-h3 item-first" name="${Utils.generateId()}">${this.title_placeholder}</h3>
    <p class="item item-p item-last" name="${Utils.generateId()}">${this.subtitle_placeholder}</p>`;

  this.mainTemplate = (publicationMode = false) => {
    if (publicationMode) {
      return `<section class='block-content block-first block-last block-center-width' name='${Utils.generateId()}'>
            <div class='main-divider' contenteditable='false'>
              <hr class='divider-line' tabindex='-1'/>
            </div> 
          ${this.getStoriesSectionMenu()}
          <div class='main-body'>  
          <div class='block-content-inner center-column'>${getPlaceholders()}</div> </div> </section>
          ${this.getSingleStorySectionTemplate()}
          ${this.getSingleSectionTemplate()}`;
    }

    return `<section class='block-content block-first block-last' name='${Utils.generateId()}'>
      <div class='main-divider' contenteditable='false'>
        <hr class='divider-line' tabindex='-1'/>
      </div>
      <div class='main-body'>
        <div class='block-content-inner center-column'>${getPlaceholders()}</div>
      </div>
      </section>`;
  };

  this.getSingleSectionTemplate = () => `<section class="block-content" name="${Utils.generateId()}">
      <div class="main-divider" contenteditable="false"><hr class="divider-line" tabindex="-1"></div>
      <div class="main-body">
      </div>
      </section>`;

  this.getImageFigureControlTemplate = () => `<div class='item-controls-cont'>
    <div class='item-controls-inner'>
    <i class='mfi-arrow-up action' data-action='goup' title='Move image up'></i>
    <i class='mfi-arrow-left action' data-action='goleft' title='Move image to left'></i>
    <i class='mfi-arrow-right action' data-action='goright' title='Move image to right'></i>
    <i class='mfi-cross action' data-action='remove' title='Remove image'></i>
    <i class='mfi-carriage-return action' data-action='godown' title='Move image to next line'></i>
    <i class='mfi-plus action' data-action='addpic' title='Add photo here'></i>
    <div class='extend-button action' data-action='stretch' title='Stretch to full width'><i class='mfi-extend-in-row'></i></div>
    </div>
    </div>`;

  this.getFigureTemplate = () => `<figure contenteditable='false' class='item item-figure item-text-default' name='${Utils.generateId()}' tabindex='0'>
    <div style='' class='padding-cont'> 
    <div style='padding-bottom: 100%;' class='padding-box'></div> 
    <img src='' data-height='' data-width='' data-image-id='' class='item-image' data-delayed-src='' /> 
    ${this.getImageFigureControlTemplate()}
    </div> 
    <figcaption contenteditable='true' data-placeholder-value='Type caption for image (optional)' class='figure-caption caption'>
    <span class='placeholder-text'>Type caption for image (optional)</span> <br> 
    </figcaption> 
    </figure>`;

  this.figureCaptionTemplate = (multiple) => {
    const plc = typeof multiple !== 'undefined' ? 'Type caption for images(optional)' : 'Type caption for image(optional)';
    return `<figcaption contenteditable='true' data-placeholder-value='${plc}' class='figure-caption caption'>
      <span class="placeholder-text">${plc}<span> <br />
      </figcaption>`;
  };

  this.getFrameTemplate = () => `<figure contenteditable='false' class='item item-figure item-iframe item-first item-text-default' name='${Utils.generateId()}' tabindex='0'>
    <div class='iframeContainer'>
    <div style='' class='padding-cont'> 
    <div style='padding-bottom: 100%;' class='padding-box'>
    </div>
    <img src='' data-height='' data-width='' data-image-id='' class='item-image' data-delayed-src=''> 
    </div> 
    <div class='item-controls ignore'>
    <i class='mfi-icon mfi-play'></i>
    </div>
    </div> 
    <figcaption contenteditable='true' data-placeholder-value='Type caption for video (optional)' class='figure-caption caption'>
    <span class='placeholder-text'>Type caption for video (optional)</span>"
    </figcaption> 
    </figure>`;

  this.templateBackgroundSectionForImage = () => `<section name="${Utils.generateId()}" class="block-content block-image image-in-background with-background">
    <div class="block-background" data-scroll="aspect-ratio-viewport" contenteditable="false" data-image-id="" data-width="" data-height="">
    <div class="block-background-image" style="display:none;"></div>
    </div>
    <div class="table-view">
    <div class="table-cell-view" contenteditable="false">
    <div class="main-body" contenteditable="true">
    <div class="block-content-inner center-column">
    <h2 name="${Utils.generateId()}" class="item item-h2 item-text-default item-first item-selected" data-placeholder-value="Continue writing">
    <span class="placeholder-text">Continue writing</span><br>
    </h2>
    </div></div>
    </div></div>
    <div class="block-caption">
    <label name="${Utils.generateId()}" data-placeholder-value="Type caption " class="section-caption item-text-default item-last">
    <span class="placeholder-text">Type caption </span><br>
    </label>
    </div>
    </section>`;

  this.templateBackgroundSectionForVideo = () => `<section name="${Utils.generateId()}" class="block-content video-in-background block-image image-in-background with-background">
    <div class="block-background" data-scroll="aspect-ratio-viewport" contenteditable="false" data-image-id="" data-width="" data-height="">
    <div class="block-background-image" style="display:none;"></div>
    </div>
    <div class="table-view">
    <div class="table-cell-view" contenteditable="false">
    <div class="main-body" contenteditable="true">
    <div class="block-content-inner center-column">
    <h2 name="${Utils.generateId()}" class="item item-h2 item-text-default item-first item-selected" data-placeholder-value="Continue writing" data-scroll="native">
    <span class="placeholder-text">Continue writing</span><br>
    </h2>
    </div></div>
    </div></div>
    <div class="block-caption">
    <label name="${Utils.generateId()}" data-placeholder-value="Type caption " class="section-caption item-text-default item-last">
    <span class="placeholder-text">Type caption </span><br>
    </label>
    </div>
    </section>`;

  this.baseParagraphTmpl = () => `<p class='item item-p' name='${Utils.generateId()}'><br></p>`;

  this.menuOpts = [['featured', 'Featured'], ['latest', 'Latest'], ['tagged', 'Tagged as']];

  this.getStoriesSectionMenu = function getStoriesSectionMenu(forStories, exclude) {
    const fs = typeof forStories === 'undefined' ? true : forStories;
    let ht = `<div class="main-controls '${fs ? 'story-mode' : 'plain-mode'}" contenteditable="false">
          <div class="main-controls-inner center-column">
          <select data-for="storytype">`;

    let opts = '';
    const excludeOpts = typeof exclude !== 'undefined' ? exclude : [];

    for (let i = 0; i < this.menuOpts.length; i += 1) {
      const menu = this.menuOpts[i];
      if (excludeOpts.indexOf(menu[0]) === -1) {
        opts += `<option value="${menu[0]}">${menu[1]}</option>`;
      }
    }

    ht += opts;

    ht += `</select>';
      <input type="text" class="text-small autocomplete" data-behave="buttons" data-type="tag" data-for="tagname" placeholder="Tag name here"></input>
      <input type="number" class="text-small" data-for="storycount" value="6" min="4" max="10"></input>
      <div class="right">
      <div class="main-controls-structure">
      <i class="mfi-text-left" data-action="list-view"></i>
      <i class="mfi-photo" data-action="image-grid"></i>
      </div>
      <div class="main-controls-layout">`;

    if (!fs) {
      ht += '<i class="mfi-image-default" data-action="center-width"></i>';
    }

    ht += `<i class="mfi-image-add-width" data-action="add-width"></i>
      <i class="mfi-image-full-width" data-action="full-width"></i>
      <i class="mfi-cross left-spaced" data-action="remove-block"></i>
      </div>
      </div>
      </div>
      </div>`;
    return ht;
  };

  this.getStoryPreviewTemplate = () => `<div class="st-pre" >
      <div class="st-img"></div>
      <div class="st-title"></div>
      <div class="st-sub"></div>
      <div class="st-sub2"></div>
      </div>`;

  this.getSingleStorySectionTemplate = () => {
    const excludes = storySectionFilter ? storySectionFilter() : [];

    return `<section class="block-stories block-add-width as-image-list" name="${Utils.generateId()}" data-story-count="6">
        <div class="main-divider" contenteditable="false"><hr class="divider-line" tabindex="-1"></div>
        ${this.getStoriesSectionMenu(true, excludes)}
        <div class="main-body">
        </div>
        </section>`;
  };

  this.videoBackgroundContainerTemplate = () => `<div class="video-container container-fixed in-background" name="${Utils.generateId()}">
  <div class="actual-wrapper" id="${Utils.generateId()}"></div>
  </div>`;

  this.getTooltipTemplate = () => `<div class='popover popover-tooltip popover-bottom active'> 
    <div class='popover-inner'>
      <a href='#' target='_blank'> Link </a>
    </div> 
    <div class='popover-arrow'> </div> </div>`;

  this.getNoteIconTemplate = () => `<div class="notes-marker-container note-icon empty">
  <span class="notes-counter" data-note-count=""></span>
  <i class="mfi-comment"></i>
  </div>`;
}

export default new Templates();
