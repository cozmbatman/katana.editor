(function () {
  var u = Katana.utils;

  Katana.Builder = (function() {
    
    function Builder(opts) {
      if (opts == null) {
        opts = {};
      }
      if (opts.data) {
        this.data = opts.data;
      }
      
      this.initialize.apply(this, arguments);
    }

    Builder.prototype.initialize = function(opts) {
      this.compileTemplates();
      this.segregateData();
      this.paint();
      return this;
    };

    Builder.prototype.compileTemplates = function () {
      Handlebars.registerHelper('if_eq', function(a, b, opts) {
        if(a == b) {
          return opts.fn(this);
        } else {
          return opts.inverse(this);
        }
      });

      Handlebars.registerHelper('if_eq_either', function (a, b, c, opts) {
        if(a == b || a == c) {
          return opts.fn(this);
        } else {
          return opts.inverse(this);
        }
      });

      this.template = Handlebars.compile($('#template_st_main').html()); // main template

      Handlebars.registerPartial('defaultSection', $('#template_st_section').html()); // default section partial
      Handlebars.registerPartial('imageSection', $('#template_st_section_with_picture').html());
      Handlebars.registerPartial('videoSection', $('#template_st_section_with_video').html()); // section with video background

      Handlebars.registerPartial('sectionContent', $('#template_st_section_content').html());
      
      Handlebars.registerPartial('figureSelect', $('#template_st_figure_select').html());
      Handlebars.registerPartial('figure', $('#template_st_figure').html());
      Handlebars.registerPartial('iframe', $('#template_st_figure_with_iframe').html());
      Handlebars.registerPartial('multipleFigure', $('#template_st_multilple_figures').html());
      Handlebars.registerPartial('fullSizeFigure', $('#template_st_full_with_image').html());
      Handlebars.registerPartial('list', $('#template_st_list').html());
      Handlebars.registerPartial('item', $('#template_st_item').html());
    };

    Builder.prototype.segregateData = function () {
      var firstPass = {}; // after first pass, this object ll contains key => sectionName, value => {section: 'name', content: [], info: sectionInfo};

      for(var prop in this.data) {
        if (this.data.hasOwnProperty(prop)) {
          var item = this.data[prop]
              type = item.type,
              name = item.name;
              if (type >=0 && type <= 3) { // section we got
          if (typeof firstPass[name] == 'undefined') {
            var ob = {
                section: name,
                content: [],
                info: item
              };
              firstPass[name] = ob;
            } else {
              firstPass[name].info = item;
            }
          } else {
            if (typeof firstPass[item.section] == 'undefined') {
              firstPass[item.section] = {section: name, content: []};
            }
            firstPass[item.section].content[item.index] = item;
          }
        }
      }

      var items = [];
      for(var prop in firstPass) {
        if (firstPass.hasOwnProperty(prop)) {
          var item = firstPass[prop];
          var info = item.info;
          items[info.index] = item;
        }
      }
      this.parsedData = {};
      this.parsedData.items = items;
      
    };

    Builder.prototype.paint = function () {
      var html = this.template(this.parsedData);
      console.log(html);
    };

    return Builder;

  })();
}).call(this);
