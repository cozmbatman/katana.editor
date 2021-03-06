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

Notes.prototype.initialize = function initialize() {
  const { opts } = this;

  this.current_editor = opts.editor;

  opts.icon = this;

  this.detailsHandler = new Details({ ...opts, node: document.querySelector('#markers_container') });
  this.options = opts;
  this.existing_notes = opts.currentNotes || [];

  this.layout = opts.layout || 'side';

  this.commentsCloserElement.addEventListener('click', () => {
    this.detailsHandler.closePreviousBox();
    this.deactivateAll();
  });

  const w = ('innerWidth' in window) ? window.innerWidth : Utils.getWindowWidth();
  this.smallScreen = w <= 480;
  const cc = document.querySelector('.center-column');
  let layoutWidth = 1020;
  if (cc != null) {
    layoutWidth = cc.getBoundingClientRect().width;
  }

  const cen = (w - layoutWidth) / 2;
  const tot = (cen + layoutWidth + 355);
  this.llShift = false;
  if (tot > w) {
    this.llShift = false;
    document.querySelector('body').addClass('notes-ll-shift');
  }

  this.readNotes();
};

Notes.prototype.events = {
  'click .note-icon': 'handleNoteIconClick',
};

Notes.prototype.readNotes = function readNotes() {
  const readUrl = `${this.options.info.read_url}/${this.options.info.story.id}`;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', readUrl, true);
  xhr.onload = () => {
    if (xhr.status === '200' && xhr.readyState === 4) {
      try {
        const resp = JSON.parse(xhr.responseText);
        this.parseNotes(resp);
      } catch (e) {
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    }
  };
  xhr.send(null);
};

Notes.prototype.parseNotes = function parseNotes(data) {
  if (data && data.success) {
    const dt = data.data; let
      notes = [];

    const pieces = {};
    if (dt.notes) {
      notes = dt.notes;
      for (let i = 0; i < notes.length; i += 1) {
        pieces[notes[i].piece] = notes[i].count;
      }
    }

    this.existing_notes = pieces;
    this.refresh();
  }
};

/** EVENTs handlers * */
Notes.prototype.handleNoteIconClick = function handleNoteIconClick(ev, matched) {
  const currentHovered = matched || ev.currentTarget;

  if (currentHovered && currentHovered.nodeType === 1) {
    const name = currentHovered.attr('note-for');
    const against = document.querySelector(`[name="${name}"]`);
    if (against) {
      this.deactivateAll();
      const curr = currentHovered;
      document.body.addClass('notes-opened');
      curr.addClass('is-clicked');

      if (!this.smallScreen) {
        setTimeout(() => {
          this.repositionIcon(curr, against);
          this.activateCloser(against);
          this.detailsHandler.showDetailsFor(name, curr);
        }, 300);
      } else {
        this.activateCloser(against);
        this.detailsHandler.showDetailsFor(name, curr);
      }
    }
  }
};

Notes.prototype.commentsCloserElement = document.querySelector('#comments_closer');

Notes.prototype.activateCloser = function activateCloser(against) {
  this.commentsCloserElement.addClass('active');
  const w = Utils.getWindowWidth();
  const box = against.getBoundingClientRect();
  const o = box.left + box.width;
  this.commentsCloserElement.style.right = `${w - o}px`;
};

Notes.prototype.deactivateCloser = function deactivateCloser() {
  this.commentsCloserElement.removeClass('active');
  document.querySelector('body').removeClass('notes-opened');
};

Notes.prototype.deactivateAll = function deactivateAll() {
  const clicked = this.elNode.querySelector('.is-clicked');
  if (clicked != null) {
    clicked.removeClass('is-clicked').addClass('hide');
    setTimeout(() => {
      this.repositionIcon(clicked, undefined);
    }, 240);
  }
  this.deactivateCloser();
};

Notes.prototype.hidePreviousVisible = function hidePreviousVisible() {
  this.elNode.querySelector('.note-icon.empty:not(.is-clicked)')?.removeClass('is-active');
  this.deactivateCloser();
};

Notes.prototype.showNoteIcon = function showNoteIcon(ob) {
  this.getNoteIcon(ob)?.addClass('is-active');
};

Notes.prototype.getNoteIcon = function getNoteIcon(ob) {
  const name = ob.node.attr('name');
  const { node } = ob;
  let onDark = false;

  if (node.closest('.with-background') != null) {
    onDark = true;
  }
  let existing = this.elNode.querySelector(`[note-for="${name}"]`);

  if (existing == null) {
    if (typeof this.existing_notes[name] === 'undefined') {
      existing = this.addIcon(name, 0);
    } else {
      existing = this.addIcon(name, this.existing_notes[name]);
    }
  }

  if (onDark) {
    existing.addClass('on-dark');
  } else {
    existing.removeClass('on-dark');
  }

  this.positionIcon(existing, node, ob.show);
  return existing;
};

Notes.prototype.calculateIconPosition = function calculateIconPosition(against) {
  const box = against.getBoundingClientRect();
  const aoffset = {
    top: box.top + document.body.scrollTop,
    left: box.left + document.body.scrollLeft,
  };

  let { top } = aoffset;
  let left = aoffset.left + box.width + 5;
  if (this.smallScreen) {
    if (left < 790) {
      left = 800;
    }
  }

  if (against.hasClass('item-h2')) {
    top += 20;
  } else if (against.hasClass('item-blockquote')) {
    left += 42;
  }

  return {
    left,
    top,
  };
};

Notes.prototype.repositionIcon = function repositionIcon(icon, against) {
  const name = icon.attr('note-for');
  let ag;
  if (typeof against !== 'undefined') {
    ag = against;
  } else {
    ag = document.querySelector(`[name="${name}"]`);
  }
  if (ag != null) {
    const pos = this.calculateIconPosition(ag);
    const st = icon.style;
    st.left = `${pos.left}px`;
    st.top = `${pos.top}px`;
    st.position = 'absolute';
    setTimeout(() => {
      icon.removeClass('hide');
    }, 100);
  }
};

Notes.prototype.positionIcon = function positionIcon(icon, against, show) {
  if (against.length) {
    if (this.smallScreen) {
      document.querySelector('.item-clicked')?.removeClass('item-clicked');

      if (typeof show !== 'undefined' && show) {
        this.elNode.removeClass('open');
        setTimeout(() => {
          this.elNode.addClass('open');
        }, 200);
      } else {
        this.elNode.removeClass('open');
      }

      icon.addClass('item-clicked');
    } else {
      const pos = this.calculateIconPosition(against);
      const ist = icon.style;
      ist.left = `${pos.left}px`;
      ist.top = `${pos.top}px`;
      ist.position = 'absolute';
    }
  }
};

Notes.prototype.addIcon = function addIcon(name, currentCount) {
  const icon = Utils.generateElement(this.current_editor.templates.getNoteIconTemplate());
  const iconSpan = icon.querySelector('.notes-counter');
  if (currentCount > 0) {
    icon.removeClass('empty');
    iconSpan.text(currentCount);
    iconSpan.attr('data-note-count', currentCount);
  }
  icon.attr('note-for', name);
  this.elNode.append(icon);
  return icon;
};

/** event handlers end * */

Notes.prototype.init = function init() {
  this.streamer.subscribe('Katana.Event.Notes', (ev) => {
    const { node } = ev;
    const text = ev.selectedText;

    let selection = null;
    if (typeof ev.selectedText !== 'undefined') {
      selection = Utils.saveSelection();
    }
    this.showNoteIcon({ node, text, selection });
  });
};

Notes.prototype.existingNotes = function existingNotes(notes) {
  this.existing_notes = notes;
  this.refresh();
};

Notes.prototype.currentHover = null;

// called by editor on mouse over or tap in case of mobile
Notes.prototype.showNote = function showNote(ev, matched) {
  const currentHovered = matched || ev.currentTarget;
  if (currentHovered && currentHovered.nodeType === 1) {
    const name = currentHovered.attr('name');
    if (name && this.currentHover !== name && !currentHovered.hasClass('item-empty') && !currentHovered.hasClass('item-figure')) {
      this.hidePreviousVisible();
      this.showNoteIcon({ node: currentHovered, text: '', show: true });
      this.currentHover = name;
    }
  }
};

Notes.prototype.refresh = function refresh() {
  this.deactivateCloser();
  const notes = this.existing_notes;
  const notesKeys = Object.keys(notes);
  for (let i = 0; i < notesKeys.length; i += 1) {
    const sel = this.current_editor.elNode.querySelector(`[name="${notesKeys[i]}"]`);
    if (sel) {
      this.showNoteIcon({ node: sel, text: '' });
    }
  }
  this.detailsHandler.existingNotes(notes);
};

Notes.prototype.incrementCounter = function incrementCounter(name) {
  const icon = this.elNode.querySelector(`[note-for="${name}"]`);
  if (icon != null) {
    const counter = icon.querySelector('.notes-counter');
    if (counter != null) {
      let currentCount = parseInt(counter.attr('data-note-count')); // eslint-disable-line radix
      if (Number.isNaN(currentCount)) {
        currentCount = 0;
      }
      currentCount += 1;
      counter.text(currentCount);
      counter.attr('data-note-count', currentCount);
      icon.removeClass('empty');
    }
  }
};

Notes.prototype.decrementCounter = function decrementCounter(name) {
  const icon = this.elNode.querySelector(`[note-for="${name}"]`);
  if (icon != null) {
    const counter = icon.querySelector('.notes-counter');
    if (counter != null) {
      let currentCount = parseInt(counter.attr('data-note-count')); // eslint-disable-line radix
      currentCount -= 1;
      counter.text(currentCount);
      counter.attr('data-note-count', currentCount);
      if (currentCount === 0) {
        icon.addClass('empty');
      }
      if (currentCount === 0) {
        counter.text('+');
      }
    }
  }
};

export default Notes;
