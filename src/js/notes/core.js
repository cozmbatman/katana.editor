import Utils from '../utils';
import boot from '../boot';
import Stream from '../stream';
import Details from './details';

function Notes(opts) {
  this.opts = opts;
  this.streamer = Stream;
  this.handleMouseOver = this.handleMouseOver.bind(this);
  this.handleNoteIconClick = this.handleNoteIconClick.bind(this);

  this.incrementCounter = this.incrementCounter.bind(this);
  this.decrementCounter = this.decrementCounter.bind(this);

  boot.it(this, opts);
}


Notes.prototype.initialize = function () {
  const opts = this.opts;
  var _this = this;
  this.current_editor = opts.editor;

  opts.icon = this;

  this.detailsHandler = new Details({...opts, node: document.querySelector('#markers_container')});
  this.options = opts;
  this.existing_notes = opts.currentNotes || [];

  this.layout = opts.layout || 'side';

  this.commentsCloserElement.addEventListener('click', (ev) => {
    this.detailsHandler.closePreviousBox();
    this.deactivateAll();          
  });

  var w = ('innerWidth' in window) ? window.innerWidth : Utils.getWindowWidth();
  this.smallScreen = w <= 480 ? true : false;
  const cc = document.querySelector('.center-column');
  var layoutWidth = 1020;
  if(cc != null) {
    layoutWidth = cc.getBoundingClientRect().width;
  }

  var cen = (w - layoutWidth) / 2,
      tot = (cen + layoutWidth + 355);
  this.llShift = false;
  if (tot > w) {
    this.llShift = false;
    document.querySelector('body').addClass('notes-ll-shift');
  }

  this.readNotes();
};

Notes.prototype.events = {
  'click .note-icon' :  'handleNoteIconClick'
};

Notes.prototype.readNotes = function () {
  var read_url = this.options.info.read_url + '/' + this.options.info.story.id;
  $.ajax({
    url : read_url,
    type: 'GET',
    dataType: 'json',
    success: (function (_this) {
      return function (resp) {
        _this.parseNotes(resp);
      }
    })(this),
    error: (function (_this) {
      return function (jqxhr) {

      }
    })(this)
  });
};

Notes.prototype.parseNotes = function (data) {
  if (data && data.success) {
    var dt, notes = [];

    dt = data.data;

    var pieces = {};
    if (dt.notes) {
      notes = dt.notes;
      for (var i = 0; i < notes.length;i = i + 1) {
        pieces[notes[i].piece] = notes[i].count;
      }
    }
    
    this.existing_notes = pieces;
    this.refresh();
  }
};

/** EVENTs handlers **/
Notes.prototype.handleNoteIconClick = function (ev, matched) {
  var currentHovered = matched ? matched : ev.currentTarget,
      name;

  if (currentHovered && currentHovered.nodeType == 1) {
    name = currentHovered.attr('note-for');
    against = $('[name="' + name + '"]');
    if (against.length) {
      this.deactivateAll();
      var _this = this;
      var $curr = $(currentHovered);
      $('body').addClass('notes-opened');
      $curr.addClass('is-clicked');

      if (!_this.smallScreen) {

        setTimeout(function () {
          _this.repositionIcon($curr, against);
          _this.activateCloser(against);
          _this.detailsHandler.showDetailsFor(name, $curr );
        }, 300);

        // $curr.animate({left: '-=160'}, 200, function () {
        //   _this.activateCloser($curr); 
          
        // });  
      } else {
        _this.activateCloser(against); 
        _this.detailsHandler.showDetailsFor(name, $curr );
      }
    }
  }

};

Notes.prototype.commentsCloserElement = document.querySelector('#comments_closer');

Notes.prototype.activateCloser = function(against) {
  this.commentsCloserElement.addClass('active');
  var w = Utils.getWindowWidth();
  const box = against.getBoundingClientRect();
  var o = box.left + box.width;
  this.commentsCloserElement.style.right = (w - o) + 'px';
};

Notes.prototype.deactivateCloser = function() {
  this.commentsCloserElement.removeClass('active');
  document.querySelector('body').removeClass('notes-opened');
};

Notes.prototype.deactivateAll = function () {
  var clicked = this.elNode.querySelectorAll(".is-clicked");
  if (clicked.length) {
    clicked.removeClass('is-clicked').addClass('hide');
    var _this = this;
    setTimeout(function () {
      _this.repositionIcon(clicked, undefined);
    }, 240);
  }
  this.deactivateCloser();
};

Notes.prototype.hidePreviousVisible = function () {
  let nics = this.elNode.querySelector('.note-icon.empty:not(.is-clicked)');
  if(nics != null) {
    nics.removeClass('is-active');
  }
  this.deactivateCloser();
};

Notes.prototype.showNoteIcon = function (ob) {
  var noteIcon = this._getNoteIcon(ob);
  noteIcon.addClass('is-active');
  if (ob.selection != null) {
    var range,
      selection = ob.selection;
    if (selection.getRangeAt) {
      range = selection.getRangeAt(0);
    } else {
      range = selection[0];
    }
  }
};

Notes.prototype._getNoteIcon = function (ob) {
  var name = ob.node.attr('name'),
      $node = ob.node,
      onDark = false;

  if ($node.closest('.with-background') != null) {
    onDark = true;
  }
  var existing = this.elNode.querySelector('[note-for="' + name + '"]');

  if (existing ==  null) {
    if (typeof this.existing_notes[name] == 'undefined') {
      existing = this._addIcon(name, 0);  
    } else {
      existing = this._addIcon(name, this.existing_notes[name]);
    }
  }

  if(onDark) {
    existing.addClass('on-dark');
  } else {
    existing.removeClass('on-dark');
  }

  this.positionIcon(existing, $node, ob.show);
  return existing;
};

Notes.prototype.calculateIconPosition = function (against) {
  const box = against.getBoundingClientRect();
  var aoffset = {
    top: box.top + document.body.scrollTop,
    left: box.left + document.body.scrollLeft
  };
  var top = aoffset.top,
      left = aoffset.left + box.width + 5;
  if (this.smallScreen) {
    if (left < 790) {
      left = 800;
    }  
  }

  if (against.hasClass('item-h2')) {
    top += 20;
  } else if(against.hasClass('item-blockquote')) {
    left += 42;
  }

  return {
    left: left,
    top: top
  };
};

Notes.prototype.repositionIcon = function (icon, against) {
  var name = icon.attr('note-for');
  var ag;
  if (typeof against != 'undefined') {
    ag = against;
  }else {
    ag = $('[name="'+name+'"]');
  } 
  if (ag.length) {
    var pos = this.calculateIconPosition(ag);
    const st = icon.style;
    st.left = pos.left + 'px';
    st.top = pos.top + 'px';
    st.position = 'absolute';
    //icon.css({left: pos.left, top : pos.top , position: 'absolute'});  
    setTimeout(function () {
      icon.removeClass('hide');
    },100);
  }
};

Notes.prototype.positionIcon = function (icon, against, show) {
  if (against.length) {
    if (this.smallScreen) {
      //icon.addClass('open');
      $('.item-clicked').removeClass('item-clicked');
      if (typeof show != 'undefined' && show) {
        this.elNode.removeClass('open');
        var _this = this;
        setTimeout(function () {
          _this.elNode.addClass('open');  
        }, 200);
      } else {
        this.elNode.removeClass('open');
      }
      
      icon.addClass('item-clicked');
      //icon.css({left:0, top:0, position:'absolute'});
    } else {
      var pos = this.calculateIconPosition(against);
      const ist = icon.style;
      ist.left = pos.left + 'px';
      ist.top = pos.top + 'px';
      ist.position = 'absolute';
      //icon.css({left: pos.left, top : pos.top , position: 'absolute'});  
    }
  }
};

Notes.prototype.getIconTemplate = function () {
  var ht = `<div class="notes-marker-container note-icon empty">
  <span class="notes-counter" data-note-count=""></span>
  <i class="mfi-comment"></i>
  </div>`;
  return Utils.generateElement(ht);
};

Notes.prototype._addIcon = function (name, currentCount) {
  var icon = this.getIconTemplate();
  var iconSpan = icon.querySelector('.notes-counter');
  if (currentCount > 0) {
    icon.removeClass('empty');
    iconSpan.text(currentCount);
    iconSpan.attr('data-note-count', currentCount);
  }
  icon.attr('note-for', name);
  this.elNode.append(icon);
  return icon;
};

/** event handlers end **/

Notes.prototype.init = function () {
  var _this = this;
  this.streamer.subscribe('Katana.Event.Notes', function (ev) {
    var node = ev.node,
        text = ev.selectedText,
        selection = null;
        if (typeof ev.selectedText != 'undefined') {
          selection = Utils.saveSelection();
        }
    _this.showNoteIcon({node: $(node), text: text, selection: selection});
  });
};

Notes.prototype.existingNotes = function (notes) {
  this.existing_notes = notes;
  this.refresh();
};


Notes.prototype.currentHover = null;

// called by editor on mouse over or tap in case of mobile
Notes.prototype.showNote = function (ev) {
  var currentHovered = ev.currentTarget,
      name;
  if (currentHovered && currentHovered.nodeType == 1) {
    name = currentHovered.attr('name');
    if (name != null && this.currentHover != name && !$(currentHovered).hasClass('item-empty') && !$(currentHovered).hasClass('item-figure')) {
      this.hidePreviousVisible();
      var ob = {node : $(currentHovered), text: '', show: true};
      this.showNoteIcon(ob);
      this.currentHover = name;
    }
  }
};

Notes.prototype.refresh = function () {
  this.deactivateCloser();
  var notes = this.existing_notes;
  for (var name in notes) {
    if (notes.hasOwnProperty(name)) {
      var sel = this.current_editor.elNode.querySelector('[name="' + name + '"]');
      if (sel != null) {
        this.showNoteIcon({node: sel, text: ''});
      }
    }
  }
  this.detailsHandler.existingNotes(notes);
};

Notes.prototype.incrementCounter = function (name) {
  var icon = this.elNode.querySelector('[note-for="' + name + '"]');
  if (icon != null) {
    var counter = icon.querySelector('.notes-counter');
    if(counter != null) {
      var currentCount = parseInt(counter.attr('data-note-count'));
      if (isNaN(currentCount)) {
        currentCount = 0;
      }
      currentCount++;
      counter.text(currentCount);
      counter.attr('data-note-count', currentCount);
      icon.removeClass('empty');
    }
  }
};

Notes.prototype.decrementCounter = function (name) {
  var icon = this.elNode.querySelector('[note-for="' + name + '"]');
  if (icon != null) {
    var counter = icon.querySelector('.notes-counter');
    if(counter != null) {
      var currentCount = parseInt(counter.attr('data-note-count'));
      currentCount--;
      counter.text(currentCount);
      counter.attr('data-note-count', currentCount);
      if (currentCount == 0) {
        icon.addClass('empty');
      }
      if (currentCount == 0) {
        counter.text('+');
      }    
    }
  }
};

export default Notes;
