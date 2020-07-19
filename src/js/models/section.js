(function () {
  var u = Katana.utils;

  Katana.Model.Section = (function (_super) {
    u.__extends(Section, _super);

    function Section() {
      this.build = u.__bind(this.build, this);
      return Section.__super__.constructor.apply(this, arguments);
    }

    Section.prototype.handleSelf = function () {
      var name = this.elNode.attr('name'),
          ob = {},
          grounded,
          markup;
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
          markup.resourceMarkup = { w: grounded.attr('data-width'), h: grounded.attr('data-height'), a: grounded.attr('data-aspect'), s: grounded.attr('data-style') };  
        }

        var bgImage = this.elNode.querySelector('.block-background-image');
        if(bgImage != null) {
          var path = u.getStyle(bgImage, 'backgroundImage');
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
        var caption = this.elNode.querySelector('.section-caption');
        if (caption != null) {
          if (caption.querySelector('.placeholder-text') != null) {
            ob.caption = {empty:true};
          }else {
            ob.caption = {};
            ob.caption.text = caption.textContent;
            ob.caption.markups = this.readMarkups(caption);  
          }
        }
      }else if(this.elNode.hasClass('block-stories')) {
        ob.type = 5;
        markup = {};
        var storyType = this.elNode.querySelector('[data-for="storytype"]'),
            storyCount = this.elNode.attr('data-story-count');

        if(storyType != null) {
          markup.storyType = storyType.value;
        }

        if (markup.storyType == 'tagged') {
          var auto = this.elNode.querySelector('.autocomplete');
          if(auto != null) {
            var tagData = $(auto).autocomplete('read');
            markup.storyTag = tagData;
          }
        }

        if (!storyCount) {
          storyCount = 6;
        }

        storyCount = parseInt(storyCount);
        if (isNaN(storyCount) || storyCount > 10) {
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
        } else if(this.elNode.hasClass('block-add-width')) {
          ob.width = 'add';
        } else if(this.elNode.hasClass('block-full-width')) {
          ob.width = 'full';
        }
        ob.meta = markup;
      }

      this.factory.addTo[name] = ob;
    };

    Section.prototype.build = function (element, index) {
      this.elNode = element;
      this.index = index;
      var sectionName = this.elNode.attr('name');
      this.handleSelf();

      var layouts = this.elNode.querySelectorAll('.main-body .block-content-inner'),
          i = 0,
          layout;
          childCount = 0;
      for (; i < layouts.length; i = i + 1) {
        layout = layouts[i];
        var items = layout.querySelectorAll('.item'),
            serializer = this.factory.getSerializer('item');
        if (items.length == 0) {
          layout.parentNode.removeChild(layout);
        }
        for (var k = 0; k < items.length; k = k + 1) {
          serializer.build(items[k], childCount + k, sectionName);
        }
        childCount = childCount + items.length;
      }
      
    };

    return Section;
  })(Katana.Model);
}).call(this);