(function () {
  var u = Katana.utils;

  Katana.Model.Item = (function (_super) {
    u.__extends(Item, _super);

    function Item() {

      return Item.__super__.constructor.apply(this, arguments);
    }

    Item.prototype.getType = function (element) {
      var tagName = element.tagName.toLowerCase();
      if ( this.contentTags.indexOf(tagName) != -1)  {
        return 10;
      } else {
        return 11;
      }
    };

    Item.prototype.build = function (element, index, sectionName) {
      var ob = {};
      this.elNode = element;
      this.index = index;
      ob.type = this.getType(element);
      ob.name = this.elNode.attr('name');
      ob.index = this.index;
      ob.section = sectionName;
      ob.tag = this.elNode.tagName.toLowerCase();

      if (ob.type == 10) {
        if (this.elNode.querySelectorAll('.placeholder-text').length) {
          ob.empty = true;
        } else if (ob.tag == 'li') {
          ob.text = this.elNode.textContent;
          ob.markups = this.readMarkups(this.elNode);
          this.buildList(this.elNode, ob);
        } else {
          ob.text = this.elNode.textContent;  
          ob.markups = this.readMarkups(this.elNode);
          if (this.elNode.hasClass('text-center')) {
            ob.center = this.elNode.hasClass('text-center');
          }

          if (this.elNode.hasClass('pullquote')) {
            ob.quote = true;
            if (this.elNode.hasClass('with-cite')) {
              ob.citation = true;
            }
          }
        }        
      }else if (ob.type == 11) {
        if (ob.tag == 'figure') {
          this.buildFigure(this.elNode, ob);
        } 
      }

      this.factory.addTo[ob.name] = ob;

    };

    Item.prototype.buildFigure = function (element, ob) {
      if (element && element.hasClass('item-text-default')) {
        ob.text = '';
        ob.empty = true;
      } else {
        var caption = element.querySelector('figcaption');
        if (caption != null && caption.querySelector('.placeholder-text') != null) {
          ob.empty = true;
        }else {
          ob.text = caption.textContent;
          ob.markups = this.readMarkups(caption);  
        }
      }

      var meta = {};
      var img = element.querySelector('img');

      if(img != null) {
        meta.resourceId = img.attr('data-image-id');
        meta.resourceUrl = img.attr('data-delayed-src');
        const pboxStyle = element.querySelector('.padding-box') != null ? element.querySelector('.padding-box').attr('style') : '';
        meta.resourceMarkup = {
          w: img.attr('data-width'), 
          h: img.attr('data-height'),
          a: pboxStyle
        };
      } else {
        meta.resourceMarkup = {};
      }

      if(element.hasClass('figure-to-left')) {
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('style') : '';
        meta.pos = 0;
      }else if(element.hasClass('figure-full-width')){
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('data-style') : '';
        meta.pos = 2;
      }else if (element.hasClass('figure-in-row')) {
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('style') : '';
        meta.pos = 3;
        var st = element.attr('style') ? element.attr('style') : '';
        meta.width = st.replace('width:','').replace('%','').replace(';','');
      }else {
        meta.resourceMarkup.s = element.querySelector('.padding-cont') != null ? element.querySelector('.padding-cont').attr('style') : '';
        meta.pos = 1;
      }

      if (element.hasClass('figure-in-row')) {
        var inner = element.closest('.block-content-inner');
        meta.partial = inner.attr('data-name');
        meta.count = inner.attr('data-paragraph-count');
        var row = element.closest('.block-grid-row');
        meta.grid = -1;

        var first = inner.querySelector('.block-grid-row:first-child .item-figure:first-child');
        if (first != null && first == element) {
          var gridCaption = inner.querySelector('.block-grid-caption');
          if (gridCaption != null && gridCaption.querySelector('.placeholder-text') == null) {
            ob.text = gridCaption.textContent;
            ob.markups = this.readMarkups(gridCaption);
            ob.empty = false;
          }
        }

        if (inner.hasClass('block-grid-full')) {
          meta.grid = 2;
        } else if(inner.hasClass('block-grid-center')) {
          meta.grid = 0;
        }

        if (row.length) {
          meta.row = row.attr('data-name');
          meta.rowElementCount = row.attr('data-paragraph-count');
        }

      }else {
        meta.partial = false;
      }

      if (element.hasClass('item-figure') && !element.hasClass('item-iframe')) {
        ob.type = 12;
      }else if(element.hasClass('item-iframe')) {
        ob.type = 13;
        meta.resourceFrame = img.attr('data-frame-url');
        meta.resourceAspect = img.attr('data-frame-aspect');
        meta.resourceUrl = img.attr('src');
        if (element.hasClass('can-go-background')) {
          meta.allowbg = true;
        }else {
          meta.allowbg = false;
        }
      }

      if (img != null && img.parentNode.hasClass('markup-anchor')) {
        meta.link = img.parentNode.attr('href');
      }else {
        meta.link = false;
      }

      ob.meta = meta;

    };

    Item.prototype.buildList = function (element, ob) {
      var prnt = element.closest('.postList'),
          prntTag = prnt != null ? prnt.tagName.toLowerCase() : null;

      if(prntTag == 'ul') {
        ob.type = 14;
      }else if(prntTag == 'ol') {
        ob.type = 15;
      }

      if(prnt.length) {
        if(prnt.attr('type')) {
          ob.listType = prnt.attr('type');
        }
      }
    };

    return Item;
  })(Katana.Model);

}).call(this);