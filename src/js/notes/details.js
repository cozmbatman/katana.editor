import Utils from '../utils';
import boot from '../boot';
import Stream from '../stream';

function Details(opts) {
  this.opts = opts;
  this.streamer = Stream;

  this.handleSaveClick = this.handleSaveClick.bind(this);
  this.handleCancelClick = this.handleCancelClick.bind(this);
  this.showDetailsFor = this.showDetailsFor.bind(this);

  boot.it(this, opts);
}

Details.prototype.initialize = function initialize() {
  const { opts } = this;

  this.current_editor = opts.editor;
  this.existing_notes = opts.notes || [];
  this.iconHandler = opts.icon;
  this.options = opts;

  this.commentable = opts.info.commentable;

  this.story = opts.info.story;
  this.read_url = opts.info.read_url || '';
  this.save_url = opts.info.save_url || '';
  this.delete_url = opts.info.delete_url || '';
  this.edit_url = opts.info.edit_url || '';
  this.reply_url = opts.info.reply_url || '';
  this.privacy_url = opts.info.privacy_url || '';
  this.smallScreen = Utils.getWindowWidth() <= 480;
  this.currentUser = false;
};

Details.prototype.isLoggedIn = function isLoggedIn() {
  if (typeof this.story.user_name === 'undefined') {
    return false;
  }
  return true;
};

Details.prototype.events = {
  'click .read-prev-notes': 'loadPreviousNotes',
  'click .note-delete-link': 'handleDeleteClick',
  'click .note-save-link': 'handleSaveClick',
  'click .note-cancel-link': 'handleCancelClick',
  'click .note-reply': 'handleReplyClick',
  'click .note-edit': 'handleEditClick',
  'click .note-edit-editor': 'handleEditorEditClick',
  'click .note-delete-editor-link': 'handleEditorDeleteClick',
  'click .note-cancel-editor-link': 'handleEditorCancelClick',
  'click .note-visibility-change': 'handleVisibilityChangeClick',

  'click .note-update-link': 'handleUpdateClick',
  'click .note-login-btn': 'handleLoginAttempt',
  'click .note-close-btn': 'handleCancelClick',
};

Details.prototype.handleLoginAttempt = function handleLoginAttempt() {
  this.elNode.trigger({
    type: 'Mefacto.UserRequired',
    from: 'notes',
  });
  return false;
};

Details.prototype.getForm = function getForm(mode) {
  let textArea = null;
  if (this.replyForm == null) {
    const rfTmpl = this.current_editor.templates.noteReplyFormTemplate();
    this.replyForm = Utils.generateElement(rfTmpl);
    textArea = this.replyForm.querySelector('.notes-textarea');
    if (textArea != null) {
      textArea.value = '';
    }
    // let ta = this.replyForm.find('.notes-textarea').autogrow();
  }

  this.replyForm.removeClass('for-editing');
  this.replyForm.removeAttribute('data-note-id');
  this.replyForm.removeAttribute('disabled');

  const updater = this.updateButtonClasses(this.replyForm);
  if (mode === 'new') {
    updater.element('.note-delete-link').add('hide').remove('show');
    updater.element('.note-save-link').add('show').remove('hide');
    updater.element('.note-update-link').add('hide').remove('show');
    updater.element('.note-cancel-link').add('show').remove('hide');
  } else if (mode === 'edit') {
    updater.element('.note-delete-link').remove('hide').add('show');
    updater.element('.note-update-link').add('show').remove('hide');
    updater.element('.note-save-link').add('hide').remove('show');
    updater.element('.note-cancel-link').add('show').remove('hide');
  }

  if (textArea) {
    textArea.value = '';
  }

  this.replyForm.show();

  return this.replyForm;
};

Details.prototype.updateButtonClasses = function updateButtonClasses(form) {
  const Handler = function Handler() {
    let el = null;
    const element = (sel) => {
      el = form.querySelector(sel);
      return this;
    };
    const add = (kls) => {
      if (el) {
        el.addClass(kls);
      }
      return this;
    };
    const remove = (kls) => {
      if (el) {
        el.removeClass(kls);
      }
      return this;
    };
    return { element, add, remove };
  };
  return new Handler();
};

Details.prototype.getNotesList = function getNotesList(notes) {
  let ht = '';
  for (let i = 0; i < notes.length; i += 1) {
    ht += this.getSingleNoteTemplate(notes[i]);
  }
  return ht;
};

Details.prototype.createContainer = function createContainer(name, notes) {
  const wrap = Utils.generateElement(this.current_editor.templates.notesContainerTemplate(name));
  if (notes.length) {
    const eNotes = this.getNotesList(notes);
    wrap.querySelector('.notes-list')?.append(Utils.generateElement(eNotes));
  } else {
    wrap.querySelector('.notes-list')?.addClass('notes-list-empty');
  }
  this.elNode.append(wrap);
  return wrap;
};

Details.prototype.getContainer = function getContainer(name) {
  let cont = this.elNode.querySelector(`[data-cont-for="${name}"]`);
  if (cont != null) {
    const notes = typeof this.existing_notes[name] === 'undefined' ? [] : this.existing_notes[name];
    cont = this.createContainer(name, notes);
  }
  return cont;
};

Details.prototype.getSingleNoteTemplate = function getSingleNoteTemplate(ob) {
  return this.current_editor.templates.getSingleNoteTemplate(ob,
    (this.currentUser && this.currentUser === ob.user));
};

Details.prototype.handleUpdateClick = function handleUpdateClick(ev, matched) {
  const form = matched ? matched.closest('.notes-form') : ev.currentTarget.closest('.notes-form');
  if (form != null) {
    const textArea = form.querySelector('textarea');
    let text = '';
    if (textArea != null) {
      text = textArea.value;
    }

    let deleting = false;
    if (!text || text.trim().length === 0) {
      // this.removeNote();
      deleting = true;
    }

    const noteId = form.attr('data-note-id');
    const container = form.closest('.notes-list-wrapper');
    const list = container.querySelector('.notes-list');
    const note = list?.querySelector(`.post-note-item[data-note-id="${noteId}"]`);
    const piece = container.attr('data-cont-for');
    if (deleting) {
      form.attr('disabled', 'disabled');
      this.makeRequest(`${this.delete_url}/${noteId}`, 'DELETE', {}, (sresp) => {
        if (sresp && sresp.success) {
          this.iconHandler.decrementCounter(piece);
          form.unwrap();
          if (note) {
            note.remove();
          }
          container.querySelector('.notes-form-container')?.append(this.getForm('new'));
        } else {
          form.removeAttribute('disabled');
        }
      }, () => {
        form.removeAttribute('disabled');
      });
      // update
    } else {
      const sob = {
        noteId,
        note: text,
        piece,
        post: this.story.id,
        draft: this.story.type !== 'story',
      };

      form.attr('disabled', 'disabled');

      this.makeRequest(this.edit_url, 'POST', sob, (sresp) => {
        if (sresp && sresp.success) {
          const pnc = note.querySelector('.post-note-content');
          if (pnc) {
            pnc.innerHTML = text;
          }
          note.show();
          form.unwrap();

          container.querySelector('.notes-form-container')?.append(this.getForm('new'));
        } else {
          form.removeAttribute('disabled');
        }
      }, () => { // error callback
        form.removeAttribute('disabled');
      });
    }
    if (textArea) {
      textArea.value = '';
    }
  }
  return false;
};

Details.prototype.handleEditorEditClick = function handleEditorEditClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  if (tg && tg.matches.call(tg, '[data-edit-btn]')) {
    const actionWrap = tg.closest('[data-editor-actions]');
    // noteId = actionWrap.attr('data-note');

    if (actionWrap) {
      const currentHTML = `<div class="hide">${actionWrap.innerHTML}</div>`;
      const changeToVisibilty = actionWrap.attr('data-change-visibility');
      const visibilityChangeText = changeToVisibilty === 'public' ? 'Make Public' : 'Make Private';
      let links = `<a class="note-visibility-change " data-changeTo="${changeToVisibilty}" tabindex="0">${visibilityChangeText}</a> &nbsp;<a class="note-delete-editor-link danger"  data-progress="Deleting.." tabindex="0">Delete</a> &nbsp;
      <a class="note-cancel-editor-link plain"  tabindex="0">Cancel</a> &nbsp;`;
      links += currentHTML;
      actionWrap.innerHTML = links;
    }
  }
  return false;
};

Details.prototype.handleEditClick = function handleEditClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  if (tg && tg.matches.call(tg, '[data-note-id]')) {
    const alreadyOpen = document.querySelector('.notes-form.for-editing');
    if (alreadyOpen) {
      const ta = alreadyOpen.querySelector('textarea');
      ta.focus();
      ta.addClass('blinkOnce');
    } else {
      const noteId = tg.attr('data-note-id');
      const li = tg.closest(`.post-note-item[data-note-id="${noteId}"]`);
      const form = this.getForm('edit');

      form.addClass('for-editing');
      form.attr('data-note-id', noteId);

      const pNoteContent = li.querySelector('.post-note-content');
      const textArea = form.querySelector('textarea');
      if (pNoteContent && textArea) {
        textArea.value = pNoteContent.innerText;
      } else if (textArea) {
        textArea.value = '';
      }

      if (li != null) {
        li.insertBefore(form, li.firstChild);
        li.hide();
      }

      form.wrap(Utils.generateElement('<li class="has-form"></li>'));
      textArea.focus();
    }
  }
  return false;
};

Details.prototype.handleSaveClick = function handleSaveClick(ev, matched) {
  const form = matched ? matched.closest('.notes-form') : ev.currentTarget.closest('.notes-form');
  if (form != null) {
    const textArea = form.querySelector('textarea'); let
      text = '';
    if (textArea) {
      text = textArea.value;
    }

    if (!text || text.trim().length === 0) {
      return false;
    }

    const tmplOb = {
      noteId: Utils.generateId(),
      authorName: this.story.user_name,
      authorUrl: this.story.user_link,
      avatarUrl: this.story.pic,
      content: text,
      edit: true,
    };

    const note = Utils.generateElement(this.getSingleNoteTemplate(tmplOb));
    const container = form.closest('.notes-list-wrapper');

    const sob = {
      noteId: tmplOb.noteId,
      note: text,
      piece: container.attr('data-cont-for'),
      post: this.story.id,
      draft: this.story.type !== 'story',
    };
    form.attr('disabled', 'disabled');

    this.saveRequest(sob, (sresp) => {
      if (sresp && sresp.success) {
        const list = container.querySelector('.notes-list');
        if (list) {
          list.append(note);
          list.removeClass('notes-list-empty');
          this.iconHandler.incrementCounter(sob.piece);

          form.querySelector('textarea')?.focus();
          this.elNode.find(`[data-note-id="${sresp.data.replace_note}"]`)?.attr('data-note-id', sresp.data.note_id);
          form.removeAttribute('disabled');
        }
      } else {
        form.removeAttribute('disabled');
      }
    }, () => {
      form.removeAttribute('disabled');
    });
  }
  return false;
};

Details.prototype.saveRequest = function saveRequest(ob, successCallback, errorCallback) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', this.save_url, true);
  xhr.onload = () => {
    if (xhr.status === '200' && xhr.readyState === 4) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (successCallback) {
          successCallback(response);
        }
      } catch (e) {
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    }
  };
  xhr.onerror = (e) => {
    if (errorCallback) {
      errorCallback(e);
    }
  };

  xhr.send(ob);
};

Details.prototype.handleCancelClick = function handleCancelClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  let dontClose = false;

  if (tg != null) {
    const form = tg.closest('.for-editing');
    if (form != null) {
      const noteId = form.attr('data-note-id');
      const container = form.closest('.notes-list-wrapper');
      form.unwrap();
      if (container != null) {
        container.querySelector('.notes-form-container')?.append(this.getForm('new'));
        container.querySelector(`.post-note-item[data-note-id="${noteId}"]`)?.show();
      }
      dontClose = true;
    } else {
      this.closePreviousBox();
    }
  }

  if (!dontClose) {
    this.iconHandler.deactivateAll();
  }
  return false;
};

Details.prototype.handleEditorCancelClick = function handleEditorCancelClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  if (tg != null) {
    const actionWrap = tg.closest('[data-editor-actions]');
    const hidenE = actionWrap?.querySelector('.hide');
    if (actionWrap && hidenE) {
      actionWrap.innerHTML = hidenE.innerHTML;
    }
  }
  return false;
};

Details.prototype.handleVisibilityChangeClick = function handleVisibilityChangeClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  const actionWrap = tg.closest('[data-editor-actions]');
  if (actionWrap != null) {
    const noteId = actionWrap.attr('data-note');
    const changeTo = tg.attr('data-changeTo');
    const futureIfSuccess = changeTo === 'public' ? 'private' : 'public';
    const futureTextIfSuccess = changeTo === 'public' ? 'Make Private' : 'Make Public';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.privacy_url, true);
    xhr.onload = () => {
      if (xhr.status === '200' && xhr.readyState === 4) {
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp && resp.success) {
            tg.innerText = futureTextIfSuccess;
            tg.attr('data-changeTo', futureIfSuccess);
            actionWrap.attr('data-change-visibility', futureIfSuccess);
          }
        } catch (e) {
          this.streamer.notifySubscribers('Katana.Error', e);
        }
      }
    };
    xhr.send({ note: noteId, visible: changeTo });
  }
  return false;
};

Details.prototype.handleEditorDeleteClick = function handleEditorDeleteClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  const actionWrap = tg.closest('[data-editor-actions]');

  if (actionWrap != null) {
    const noteId = actionWrap.attr('data-note');
    const container = actionWrap.closest('.notes-list-wrapper');
    const piece = container.attr('data-cont-for');
    const noteItem = tg.closest('.post-note-item');

    noteItem.attr('disabled', 'disabled');

    this.deleteRequest(noteId, () => {
      if (container.querySelectorAll('.post-note-item').length === 0) {
          container.querySelector('.notes-list')?.addClass('notes-list-empty');
      }

        container.querySelector('.notes-form-container')?.append(this.getForm('new'));
        container.querySelector(`.post-note-item[data-note-id="${noteId}"]`)?.remove();
        container.querySelector('.notes-form-container textarea')?.focus();

        this.iconHandler.decrementCounter(piece);
    }, () => {
      noteItem.removeAttribute('disabled');
    });
  }
};

Details.prototype.handleDeleteClick = function handleDeleteClick(ev, matched) {
  const tg = matched || ev.currentTarget;
  const editMode = tg.closest('.for-editing');

  if (editMode != null) {
    const noteId = editMode.attr('data-note-id');
    const container = editMode.closest('.notes-list-wrapper');
    const piece = container.attr('data-cont-for');

    editMode.attr('disabled', 'disabled');

    this.deleteRequest(noteId, () => {
      editMode.unwrap();

        container.querySelector(`.post-note-item[data-note-id="${noteId}"]`)?.remove();
        this.iconHandler.decrementCounter(piece);

        if (container.querySelectorAll('.post-note-item').length === 0) {
          container.querySelector('.notes-list')?.addClass('notes-list-empty');
        }

        container.querySelector('.notes-form-container')?.append(this.getForm('new'));
        container.querySelector('.notes-form-container textarea')?.focus();
    }, () => {
      editMode.removeAttribute('disabled');
    });
  }
  return false;
};

Details.prototype.deleteRequest = function deleteRequest(noteId, successCallback, errorCallback) {
  const xhr = new XMLHttpRequest();
  const url = `${this.delete_url}/${noteId}`;
  xhr.open('DELETE', url, true);
  xhr.onload = () => {
    if (xhr.readyState === 4 && xhr.status === '200') {
      try {
        const resp = JSON.parse(xhr.responseText);
        if (resp) {
          if (resp.success) {
            successCallback();
          } else {
            errorCallback();
          }
        } else {
          errorCallback();
        }
      } catch (e) {
        errorCallback();
      }
    }
  };
  xhr.onerror = () => {
    errorCallback();
  };
  xhr.send(null);
};

Details.prototype.handleReplyClick = function handleReplyClick() {
  return false;
};

Details.prototype.closePreviousBox = function closePreviousBox() {
  this.elNode.querySelector('.opened')?.removeClass('opened');
  this.currentlyOpen = null;
};

Details.prototype.currentlyOpen = null;

Details.prototype.showDetailsFor = function showDetailsFor(name, icon) {
  if (name && name !== this.currentlyOpen) {
    this.closePreviousBox();
    this.openFor(name, icon);
    this.currentlyOpen = name;
  } else if (name === this.currentlyOpen) {
    this.closePreviousBox();
  }
};

Details.prototype.loadPreviousNotes = function loadPreviousNotes(ev, matched) {
  const tg = matched || ev.currentTarget;
  const container = tg.closest('.notes-list-wrapper');
  const name = container.attr('data-cont-for');
  const icon = document.querySelector(`[note-for="${name}"]`);
  tg.innerHTML = '<span class="loader ib small dark"></span> Loading..';
  this.loadNotesDetails(name, icon, container, tg.attr('href'));
  return false;
};

Details.prototype.loadNotesDetails = function loadNotesDetails(name, icon, container, loadUrl) {
  let url = `${this.read_url}/${this.story.id}/${name}`;
  const mergeUserObject = (note, user) => {
    const nt = {
      ...note,
      authorName: user.name,
      authorUrl: user.link,
      avatarUrl: user.avatarUrl,
    };
    return nt;
  };

  if (typeof loadUrl !== 'undefined') {
    url = loadUrl;
  }

  const getPreviousUrl = (page) => `${this.read_url}/${this.story.id}/${name}?page=${page}`;

  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = () => {
    if (xhr.status === '200' && xhr.readyState === 4) {
      try {
        container.querySelectorAll('.loading-notes').forEach((el) => el.remove());
        container.querySelectorAll('.read-prev-notes').forEach((el) => el.remove());

        icon.addClass('notes-loaded');

        const response = JSON.parse(xhr.responseText);
        if (response && response.success) {
          const dt = response.data;
          if (dt.notes && dt.users) {
            const { notes } = dt;

            for (let i = 0; i < notes.length; i += 1) {
              const { user } = notes[i];
              if (dt.users[user]) {
                notes[i] = mergeUserObject(notes[i], dt.users[user]);
              }
            }

            if (notes.length) {
              const ht = this.getNotesList(notes);
              container.querySelectorAll('.read-prev-notes').forEach((el) => el.remove());

              const li = container.querySelector('.notes-list');
              if (dt.page) {
                const page = Utils.generateElement(`<a href="${getPreviousUrl(dt.page)}" class="read-prev-notes">Read previous</a>`);
                li.insertAdjacentElement('beforebegin', page);
              }

              li.removeClass('notes-list-empty');
              li.prepend(Utils.generateElement(ht));
            }
          }
        }
      } catch (e) {
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    }
  };
  xhr.onerror = () => {
    container.querySelectorAll('.loading-notes').forEach((el) => el.remove());
  };
  xhr.send(null);
};

Details.prototype.openFor = function openFor(name, icon) {
  const container = this.getContainer(name);
  const isLoggedIn = this.isLoggedIn();

  const form = isLoggedIn
    ? this.getForm('new')
    : Utils.generateElement(this.current_editor.templates.getNotesSignInLink());

  if (!icon.hasClass('notes-loaded')) {
    const notesCounter = icon.querySelector('.notes-counter');
    if (notesCounter != null) {
      let count = notesCounter.attr('data-note-count');
      count = parseInt(count); // eslint-disable-line radix
      if (!Number.isNaN(count) && count > 0) {
        this.loadNotesDetails(name, icon, container);
      } else {
        container.querySelectorAll('.loading-notes').forEach((el) => el.remove());
      }
    }
  }

  container.addClass('opened');

  if (icon.hasClass('on-dark')) {
    container.addClass('on-dark');
  } else {
    container.removeClass('on-dark');
  }
  container.querySelector('.note-login-btn')?.remove();

  container.querySelector('.note-close-btn')?.remove();

  container.querySelector('.notes-form-container')?.append(form);

  this.positionContainer(container, name);

  if (form && form.querySelector('textarea') != null) {
    form.querySelector('textarea').focus();
  }
};

Details.prototype.positionContainer = function positionContainer(container, name) {
  const against = document.querySelector(`[name="${name}"]`);
  if (against != null && !this.smallScreen) {
    const rect = against.getBoundingClientRect();
    const offset = {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft,
    };
    const st = container.style;
    const agwidth = parseFloat(getComputedStyle(against, null).width.replace('px', ''));
    st.left = `${offset.left + agwidth + 50}px`;
    st.top = `${offset.top}px`;
    st.position = 'absolute';
  }
};

Details.prototype.makeRequest = function makeRequest(url, method, params, scallback, ecallback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.onload = () => {
    if (xhr.status === '200' && xhr.readyState === 4) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (typeof scallback !== 'undefined') {
          scallback(response);
        }
      } catch (e) {
        this.streamer.notifySubscribers('Katana.Error', e);
      }
    }
  };
  xhr.onerror = (er) => {
    if (ecallback) {
      ecallback(er);
    }
  };
  xhr.send(params);
};

Details.prototype.existingNotes = function existingNotes(notes) {
  this.existing_notes = notes;
  this.elNode.innerHTML = ''; // remove all existing notes..
  this.replyForm = null;
};

export default Details;
