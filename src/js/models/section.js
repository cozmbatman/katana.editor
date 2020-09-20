import Utils from '../utils';

function Section(opts) {
  this.common = opts.common;
  this.build = this.build.bind(this);
}

Section.prototype.handleSelf = function handleSelf() {
  const name = this.elNode.attr('name');
  const ob = {};
  let grounded;
  let markup;

  ob.name = name;
  ob.index = this.index;
  ob.type = 0;

  if (this.elNode.hasClass('block-add-width')) {
    ob.width = 'add';
  }

  if (this.elNode.hasClass('with-background')) {
    grounded = this.elNode.querySelector('.block-background');
    ob.type = 1;
    markup = {};

    if (this.elNode.hasClass('talk-to-canvas')) {
      markup.canvas = true;
    }

    if (grounded != null) {
      markup.resourceId = grounded.attr('data-image-id');
      markup.resourceType = 'image';
      markup.resourceMarkup = {
        w: grounded.attr('data-width'), h: grounded.attr('data-height'), a: grounded.attr('data-aspect'), s: grounded.attr('data-style'),
      };
    }

    const bgImage = this.elNode.querySelector('.block-background-image');
    if (bgImage != null) {
      let path = Utils.getStyle(bgImage, 'backgroundImage');
      path = /^url\((['"]?)(.*)\1\)$/.exec(path);
      path = path ? path[2] : '';

      if (this.elNode.hasClass('video-in-background')) {
        markup.resourceFrame = bgImage.attr('data-frame-url');
        markup.resourceAspect = bgImage.attr('data-frame-aspect');
        ob.type = 2;
      }

      markup.resourceUrl = path;
    }

    ob.meta = markup;
    const caption = this.elNode.querySelector('.section-caption');
    if (caption != null) {
      if (caption.querySelector('.placeholder-text') != null) {
        ob.caption = { empty: true };
      } else {
        ob.caption = {};
        ob.caption.text = caption.textContent;
        ob.caption.markups = this.common.readMarkups(caption);
      }
    }
  } else if (this.elNode.hasClass('block-stories')) {
    ob.type = 5;
    markup = {};
    const storyType = this.elNode.querySelector('[data-for="storytype"]');
    let storyCount = this.elNode.attr('data-story-count');

    if (storyType) {
      markup.storyType = storyType.value;
    }

    if (markup.storyType === 'tagged') {
      const auto = this.elNode.querySelector('.autocomplete');
      if (auto != null) {
        // FIXME autocomplete
        // const tagData = (auto).autocomplete('read');
        // markup.storyTag = tagData;
      }
    }

    if (!storyCount) {
      storyCount = 6;
    }

    storyCount = parseInt(storyCount, 10);
    if (Number.isNaN(storyCount) || storyCount > 10) {
      storyCount = 6;
    }

    markup.storyCount = storyCount;

    if (this.elNode.hasClass('as-list')) {
      markup.list = 'list';
    } else if (this.elNode.hasClass('as-image-list')) {
      markup.list = 'image-list';
    } else if (this.elNode.hasClass('as-image-grid')) {
      markup.list = 'image-grid';
    }

    if (this.elNode.hasClass('block-center-width')) {
      ob.width = 'center';
    } else if (this.elNode.hasClass('block-add-width')) {
      ob.width = 'add';
    } else if (this.elNode.hasClass('block-full-width')) {
      ob.width = 'full';
    }
    ob.meta = markup;
  }

  this.factory.addTo[name] = ob;
};

Section.prototype.build = function build(element, index) {
  this.elNode = element;
  this.index = index;
  const sectionName = this.elNode.attr('name');
  this.handleSelf();

  const layouts = this.elNode.querySelectorAll('.main-body .block-content-inner');
  let childCount = 0;
  for (let i = 0; i < layouts.length; i += 1) {
    const layout = layouts[i];
    const items = layout.querySelectorAll('.item');
    const serializer = this.factory.getSerializer('item');
    if (items.length === 0) {
      layout.parentNode.removeChild(layout);
    }
    for (let k = 0; k < items.length; k += 1) {
      serializer.build(items[k], childCount + k, sectionName);
    }
    childCount += items.length;
  }
};

export default Section;
