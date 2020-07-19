(function () {
  var u = Katana.utils;

  Katana.Notes.Details = (function (_super) {
    u.__extends(Details, _super);

    function Details() {
      this.handleSaveClick = u.__bind(this.handleSaveClick, this);
      this.handleCancelClick = u.__bind(this.handleCancelClick, this);
      this.showDetailsFor = u.__bind(this.showDetailsFor, this);

      Details.__super__.constructor.apply(this, arguments);
    }

    Details.prototype.initialize = function (opts) {
      if (opts == null) {
        opts = {};
      }

      if(opts.notes == null) {
        opts.notes = {};
      }

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
      this.smallScreen = $(window).width() <= 480 ? true : false;
      this.currentUser = typeof Mefacto.User != 'undefined' && Mefacto.User.id != 0 ? Mefacto.User.id : false;
    };

    Details.prototype.isLoggedIn = function () {
      if (_.isUndefined(this.story.user_name)) {
        return false;
      }
      return true;
    };

    Details.prototype.el = '#markers_container';

    Details.prototype.events = {
      'click .read-prev-notes' : 'loadPreviousNotes',
      'click .note-delete-link' : 'handleDeleteClick',
      'click .note-save-link'   : 'handleSaveClick',
      'click .note-cancel-link' : 'handleCancelClick',
      'click .note-reply' : 'handleReplyClick',
      'click .note-edit': 'handleEditClick',
      'click .note-edit-editor': 'handleEditorEditClick',
      'click .note-delete-editor-link' : 'handleEditorDeleteClick',
      'click .note-cancel-editor-link' : 'handleEditorCancelClick',
      'click .note-visibility-change' : 'handleVisibilityChangeClick',

      'click .note-update-link' : 'handleUpdateClick',
      'click .note-login-btn': 'handleLoginAttempt',
      'click .note-close-btn': 'handleCancelClick'
    };

    Details.prototype.handleLoginAttempt = function () {
      this.$el.trigger({
        type: 'Mefacto.UserRequired',
        from: 'notes'
      });
      return false;
    };

    Details.prototype.replyFormTemplate = function () {
      return ` 
      <div class="notes-form">
      <textarea id="notes_textarea" class="camouflaged editable text-autogrow notes-textarea text-small" placeholder="Type here.."></textarea>
      <div>
      <a class="note-update-link notes-form-link" data-progress="Saving.." tabindex="0">Save</a>
      <a class="note-save-link notes-form-link" data-progress="Saving.." tabindex="0">Save</a>
      <a class="note-delete-link notes-form-link danger" data-progress="Deleting.." tabindex="0">Delete</a>
      <a class="note-cancel-link  notes-form-link plain" tabindex="0">Cancel</a>
      </div>
      </div>`;
    };

    Details.prototype.containerTemplate = function (name) {
      return `<div class="notes-list-wrapper" data-cont-for="${name}">
        <div class="loading-notes"> <span class="loader dark small ib"></span>loading..</div>
        <ul class="notes-list no-margin"></ul>
        <div class="notes-form-container"></div>
        </div>`;
    };

    Details.prototype.getForm = function (mode) {
      let textArea = null;
      if (this.replyForm == null) {
        this.replyForm = u.generateElement(this.replyFormTemplate());
        textArea = this.replyForm.querySelector('.notes-textarea');
        if(textArea != null) {
          textArea.value = '';
        }
        //var ta = this.replyForm.find('.notes-textarea').autogrow();
      }

      this.replyForm.removeClass('for-editing');
      this.replyForm.removeAttribute('data-note-id');
      this.replyForm.removeAttribute('disabled');

      const updater = this.updateButtonClasses(this.replyForm);
      if (mode == 'new') {
        updater.element('.note-delete-link').add('hide').remove('show');  
        updater.element('.note-save-link').add('show').remove('hide');
        updater.element('.note-update-link').add('hide').remove('show');
        updater.element('.note-cancel-link').add('show').remove('hide');        
      } else if (mode == 'edit') {
        updater.element('.note-delete-link').remove('hide').add('show');
        updater.element('.note-update-link').add('show').remove('hide');
        updater.element('.note-save-link').add('hide').remove('show');
        updater.element('.note-cancel-link').add('show').remove('hide');
      } 

      if(textArea) {
        textArea.value = '';
      }

      this.replyForm.show();

      return this.replyForm;
    };

    Details.prototype.updateButtonClasses = function(form) {
      const handler = function () {
        let e = null;
        const element = (sel) => {
          el = form.querySelector(sel);
          return this;
        }
        const add = (kls) => { 
          if(el != null) { 
            el.addClass(kls);
          }
          return this;
        }
        const remove = (kls) => {
          if(el != null) {
            el.removeClass(kls);
          }
          return this;
        }
        return {element, add, remove};
      }
      return new handler();
    }

    Details.prototype.getNotesList = function (notes) {
      var ht = '';
      for ( var i = 0; i < notes.length; i = i + 1) {
        var html = this.getSingleNoteTemplate(notes[i]);
        ht += html;
      }
      return ht;
    };

    Details.prototype.createContainer = function (name, notes) {
      var wrap = u.generateElement(this.containerTemplate(name)),
          eNotes = '';
      if (notes.length) {
        eNotes = this.getNotesList(notes);
        let notesList = wrap.querySelector('.notes-list');
        if(notesList != null) {
          notesList.append(u.generateElement(eNotes));
        }
      } else {
        let notesList = wrap.querySelector('.notes-list');
        if(notesList != null) {
          notesList.addClass('notes-list-empty');
        }
      }
      this.$el.append(wrap);
      return wrap;
    };

    Details.prototype.getContainer = function (name) {
      var cont = this.$el.querySelector('[data-cont-for="' + name + '"]');
      if (cont != null) {
        var notes = typeof this.existing_notes[name] == 'undefined' ? [] : this.existing_notes[name];
        cont = this.createContainer(name, notes);
      }
      return cont;
    };

    Details.prototype.getSingleNoteTemplate = function (ob) {
      let ht = `<li class="post-note-item clearfix" data-note-id="${ob.noteId}">
        <div class="post-note-avatar smarty-photo rounded thumb bordered left">
          <div class="profile-pic-bg" style="background-image:url('${ob.avatarUrl}');" ></div>
        </div>
        <div class="post-note-content-wrap">
          <span class="post-note-author-name">
            <a href="${ob.authorUrl}" title="${ob.authorName}" > ${ob.authorName} </a>
          </span>
          <span class="post-note-content">
            ${ob.content}
          </span>`;
      if (ob.edit && this.currentUser && this.currentUser == ob.user) {
        if (typeof ob.changeTo != 'undefined') {
          ht += `<div data-editor-actions data-note="${ob.noteId}" data-change-visibility="${ob.changeTo}">
              <a class="note-edit text-small" data-note-id="${ob.noteId}" tabindex="0">Edit</a>
              <a class="note-edit-editor" data-edit-btn  tabindex="0">More</a>
              </div>`;
        } else {
          ht += `<div><a class="note-edit text-small" data-note-id="${ob.noteId}"  tabindex="0">Edit</a></div>`;
        }
      } else if (ob.edit && typeof ob.changeTo == 'undefined') {
        ht += `<div><a class="note-edit text-small" data-note-id="${ob.noteId}" tabindex="0">Edit</a></div>`;
      }else if(ob.edit && typeof ob.changeTo != 'undefined') {
        ht += `<div data-editor-actions data-note="${ob.noteId}" data-change-visibility="${ob.changeTo}"><a class="note-edit-editor" data-edit-btn  tabindex="0">Edit</a></div>`;
      }
      ht += `</div></li>`;
      return ht;
    };

    Details.prototype.handleUpdateClick = function (ev, matched) {
      var form = matched ? matched.closest('.notes-form') : ev.currentTarget.closest('.notes-form');
      if (form != null) {
        const textArea = form.querySelector('textarea');
        let text = "";
        if(textArea != null) {
          text = textArea.value;
        }
        let _this = this;
        var deleting = false;
        if (!text || text.trim().length == 0) {
          //this.removeNote();
          deleting = true;
        }

        let noteId = form.attr('data-note-id');
        let container = form.closest('.notes-list-wrapper');
        let list = container.querySelector('.notes-list');
        let note = list != null ? list.querySelector('.post-note-item[data-note-id="' + noteId + '"]') : null;
        var piece = container.attr('data-cont-for');
        if (deleting) {          
          form.attr('disabled','disabled');
          this.makeRequest(this.delete_url + '/' + noteId, 'DELETE', {}, function (sresp) {
            if (sresp && sresp.success) {
              _this.iconHandler.decrementCounter(piece);
              form.unwrap();
              if( note!=null ) {
                note.remove();
              }
              const nFormContainer = container.querySelector('.notes-form-container');
              if(nFormContainer != null) {
                nFormContainer.append(_this.getForm('new'));
              }
            } else {
              form.removeAttribute('disabled')
            }
          }, function () {
            form.removeAttribute('disabled')
          });
          // update 
        } else {
          var sob = {};
          sob.noteId = noteId;
          sob.note = text;
          sob.piece = piece;
          sob.post = this.story.id;
          sob.draft = this.story.type == 'story' ? false : true;
          form.attr('disabled','disabled');

          this.makeRequest(this.edit_url , 'POST', sob, function (sresp) {
            if (sresp && sresp.success) {
              const pnoteContent = note.querySelector('.post-note-content');
              if(pnoteContent != null) {
                pnoteContent.innerHTML = text;  
              }
              note.show();
              form.unwrap();
              const nFormContainer = container.querySelector('.notes-form-container');
              if(nFormContainer != null) {
                nFormContainer.append(_this.getForm('new'));  
              }
            } else {
              form.removeAttribute('disabled');
            }
          }, function () { // error callback
            form.removeAttribute('disabled');
          });
        }
        if(textArea != null) {
          textArea.value = '';
        }
      }
      return false;
    };

    Details.prototype.handleEditorEditClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget;
      if (tg != null && tg.matches.call(tg, '[data-edit-btn]')) {
        var actionWrap  = tg.closest('[data-editor-actions]'),
            noteId = actionWrap.attr('data-note');
        if (actionWrap != null) {
          var currentHTML = actionWrap.innerHTML;
          currentHTML = '<div class="hide">' + currentHTML + '</div>';

          var changeToVisibilty = actionWrap.attr('data-change-visibility');
          var visibilityChangeText = changeToVisibilty == 'public' ? 'Make Public' : 'Make Private';
          var links = `<a class="note-visibility-change " data-changeTo="${changeToVisibilty}" tabindex="0">${visibilityChangeText}</a> &nbsp;<a class="note-delete-editor-link danger"  data-progress="Deleting.." tabindex="0">Delete</a> &nbsp;
          <a class="note-cancel-editor-link plain"  tabindex="0">Cancel</a> &nbsp;`;
          links += currentHTML;
          actionWrap.innerHTML = links;
        }
      }
      return false;
    };

    Details.prototype.handleEditClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget;
      if (tg.length && tg.matches.call(tg, '[data-note-id]')) {
        var alreadyOpen = document.querySelector('.notes-form.for-editing');
        if (alreadyOpen != null) {
          var ta = alreadyOpen.querySelector('textarea');
          ta.focus();
          ta.addClass('blinkOnce');
        } else {
          var noteId = tg.attr('data-note-id'),
            li = tg.closest('.post-note-item[data-note-id="' + noteId + '"]'),
            form = this.getForm('edit');

          form.addClass('for-editing');
          form.attr('data-note-id', noteId);
          let pNoteContent = li.querySelector('.post-note-content');
          const textArea = form.querySelector('textarea');
          if(pNoteContent != null && textArea != null) {
            textArea.value = pNoteContent.innerText;
          } else if(textArea != null) {
            textArea.value = '';
          }
          if(li != null) {
            li.insertBefore(form, li.firstChild);
            //form.insertBefore(li);
            li.hide();  
          }
          form.wrap(u.generateElement('<li class="has-form"></li>'));
          textArea.focus();
        }        
      }
      return false;
    };

    Details.prototype.handleSaveClick = function (ev, matched) {
      var form = matched ? matched.closest('.notes-form') : ev.currentTarget.closest('.notes-form');
      if (form != null) {
        let textArea = form.querySelector('textarea');
        var text = "";
        if(textArea != null) {
          text = textArea.value;
        }
        var _this = this;

        if (!text || text.trim().length == 0) {
          return false;
        }

        var tmplOb = {};
        
        tmplOb.noteId = u.generateId();
        tmplOb.authorName = this.story.user_name;
        tmplOb.authorUrl = this.story.user_link;
        tmplOb.avatarUrl = this.story.pic;
        tmplOb.content = text;
        tmplOb.edit = true;

        var note = u.generateElement(this.getSingleNoteTemplate(tmplOb)),
            sob = {},
            container = form.closest('.notes-list-wrapper');

        sob.noteId = tmplOb.noteId;
        sob.note = text;
        sob.piece = container.attr('data-cont-for');
        sob.post = this.story.id;
        sob.draft = this.story.type == 'story' ? false : true;
        form.attr('disabled','disabled');

        this.saveRequest(sob, function (sresp) {
          if (sresp && sresp.success)  {
            var list = container.querySelector('.notes-list');
            if(list != null) {
              list.append(note);
              list.removeClass('notes-list-empty');
              _this.iconHandler.incrementCounter(sob.piece);
              var ta = form.querySelector('textarea');
              if(ta != null) {
                ta.focus();
              }
              const rnote = _this.$el.find('[data-note-id="' + sresp.data.replace_note + '"]');
              if(rnote != null) {
                rnote.attr('data-note-id', sresp.data.note_id);
              }
              form.removeAttribute('disabled');
            }
          } else {
            form.removeAttribute('disabled');
          }
        }, function () {
          form.removeAttribute('disabled');
        });
      }
      return false;
    };

    Details.prototype.saveRequest = function (ob, successCallback, errorCallback) {

      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.save_url, true);
      xhr.onload = () => {
        if(xhr.status == "200" && xhr.readyState == 4) {
          try {
            let response = JSON.parse(xhr.responseText);
            successCallback(response);
          } catch(e) {
            console.error(e);
          }
        }
      }
      xhr.send(ob);
    };

    Details.prototype.handleCancelClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
          dontClose = false;
      if (tg != null) {
        var form = tg.closest('.for-editing');
        if (form != null) {
          var noteId = form.attr('data-note-id'),
              container = form.closest('.notes-list-wrapper');
          form.unwrap();
          if(container != null) {
            let nfc = container.querySelector('.notes-form-container');
            if(nfc != null) {
              nfc.append(this.getForm('new'));
            }
            let pnfc = container.querySelector('.post-note-item[data-note-id="' + noteId + '"]');
            if(pnfc != null) {
              pnfc.show();
            }
          }
          dontClose = true;
        }else {
          this.closePreviousBox();
        }
      }

      if (!dontClose) {
        this.iconHandler.deactivateAll();
      }
      return false;
    };

    Details.prototype.handleEditorCancelClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget;
      if (tg != null) {
        var actionWrap  = tg.closest('[data-editor-actions]');
        if(actionWrap != null) {
          //var noteId = actionWrap.attr('data-note');
          var hidenE = actionWrap.querySelector('.hide');
          if(hidenE != null) {
            actionWrap.innerHTML = hidenE.innerHTML;
          }
        }
      }
      return false;
    };

    Details.prototype.handleVisibilityChangeClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
      actionWrap = tg.closest('[data-editor-actions]');
      if(actionWrap != null) {
        var noteId = actionWrap.attr('data-note'),
        changeTo = tg.attr('data-changeTo'),
        futureIfSuccess = changeTo == 'public' ? 'private' : 'public',
        futureTextIfSuccess = changeTo == 'public' ? 'Make Private' : 'Make Public';

        const xhr = new XMLHttpRequest();
        xhr.open("POST", this.privacy_url, true);
        xhr.onload = () => {
          if(xhr.status == "200" && xhr.readyState == 4) {
            try {
              const resp = JSON.parse(xhr.responseText);
              if (resp && resp.success) {
                tg.innerText = futureTextIfSuccess;
                tg.attr('data-changeTo', futureIfSuccess);
                actionWrap.attr('data-change-visibility', futureIfSuccess);
              }
            }catch(e) {
              console.error(e);
            }
          }
        };
        xhr.send({note: noteId, visible: changeTo});
      }
      return false;
    };

    Details.prototype.handleEditorDeleteClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
          actionWrap = tg.closest('[data-editor-actions]');
      if (actionWrap != null) {
        let noteId = actionWrap.attr('data-note'),
            container = actionWrap.closest('.notes-list-wrapper'),
            piece = container.attr('data-cont-for'),
            noteItem = tg.closest('.post-note-item'),
            _this = this;

          noteItem.attr('disabled','disabled');
                  
          this.deleteRequest(noteId, function () {

            if (container.querySelectorAll('.post-note-item').length == 0) {
              let noteslist = container.querySelector('.notes-list');
              if(noteslist != null) {
                noteslist.addClass('notes-list-empty');
              }
            }
            let notesFormContainer = container.querySelector('.notes-form-container');
            if(notesFormContainer != null) {
              notesFormContainer.append(_this.getForm('new'));  
            }
            let postNotesItem = container.querySelector('.post-note-item[data-note-id="' + noteId + '"]');
            if(postNotesItem != null) {
              postNotesItem.remove();
            }
            var ta = container.querySelector('.notes-form-container textarea');
            if(ta != null) {
              ta.focus();
            }

            _this.iconHandler.decrementCounter(piece);
          }, function () {
            noteItem.removeAttribute('disabled');
          });
      }
    };

    Details.prototype.handleDeleteClick = function (ev, matched) {
      var tg = matched ? matched : ev.currentTarget,
          editMode = tg.closest('.for-editing');

        if (editMode != null) {
          var noteId = editMode.attr('data-note-id'),
              container = editMode.closest('.notes-list-wrapper'),
              piece = container.attr('data-cont-for'),
              _this = this;

          editMode.attr('disabled', 'disabled');

          this.deleteRequest(noteId, function () {
            editMode.unwrap();
            const postNote = container.querySelector('.post-note-item[data-note-id="' + noteId + '"]');
            if(postNote != null) {
              postNote.remove();
            }
            _this.iconHandler.decrementCounter(piece);

            if (container.querySelectorAll('.post-note-item').length == 0) {
              const notesList = container.querySelector('.notes-list');
              if(notesList != null) {
                notesList.addClass('notes-list-empty'); 
              }
            }
            const notesFormContainer = container.querySelector('.notes-form-container');
            if(notesFormContainer != null) {
              notesFormContainer.append(_this.getForm('new'));
            }
            var ta = container.find('.notes-form-container textarea');
            ta.focus();
          }, function () {
            editMode.removeAttribute('disabled');
          });
        }
      return false;
    };

    Details.prototype.deleteRequest = function (noteId, successCallback, errorCallback) {
      const xhr = new XMLHttpRequest();
      const url = `${this.delete_url}/${noteId}`;
      xhr.open("DELETE", url, true);
      xhr.onload = () => {
        if(xhr.readyState == 4 && xhr.status == "200") {
          try {
            const resp = JSON.parse(xhr.responseText);
            if(resp) {
              if(resp.success) {
                successCallback();
              } else {
                errorCallback();
              }
            } else {
              errorCallback();
            }
          }catch(e) {
            errorCallback();
          }
        }
      };
      xhr.onerror = () => {
        errorCallback();
      };
      xhr.send(null);
    };

    Details.prototype.handleReplyClick = function (ev, matched) {
      return false;
    };

    Details.prototype.closePreviousBox = function () {
      const copened = this.$el.querySelector('.opened');
      if(copened != null) {
        copened.removeClass('opened');
      }
      this._currentlyOpen = null;
    };

    Details.prototype._currentlyOpen = null;

    Details.prototype.showDetailsFor = function(name, $icon) {
      if (name && name != this._currentlyOpen) {
        this.closePreviousBox();
        this.openFor(name, $icon);
        this._currentlyOpen = name;
      }else if(name == this._currentlyOpen) {
        this.closePreviousBox();
      }
    };

    Details.prototype.getSignInLink = function () {
      return '<a href="javascript::;" class="note-login-btn">Login to leave a note</a><a class="note-close-btn">Close</a>';
    };

    Details.prototype.loadPreviousNotes = function(ev, matched) {
      let $tg = matched ? matched : ev.currentTarget;
      var url = $tg.attr('href');
      var container = $tg.closest('.notes-list-wrapper');
      var name = container.attr('data-cont-for');
      var $icon = document.querySelector('[note-for="' +name+ '"]');
      $tg.innerHTML = '<span class="loader ib small dark"></span> Loading..';
      this.loadNotesDetails(name, $icon, container, url);
      return false;
    };


    Details.prototype.loadNotesDetails = function(name, $icon, container, loadUrl) {
      var url = this.read_url + '/' + this.story.id + '/' + name,
      _this = this,
      mergeUserObject;

      if( typeof loadUrl != 'undefined') {
        url = loadUrl;
      }

      mergeUserObject = function (note, user) {
        note.authorName = user.name;
        note.authorUrl = user.link;
        note.avatarUrl = user.avatarUrl;
      };

      const getPreviousUrl = function (page) {
        return `${_this.read_url}/${_this.story.id}/${name}?page=${page}`;
      };

      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = () => {
        if(xhr.status == "200" && xhr.readyState == 4) {
          try {
            container.querySelectorAll('.loading-notes').forEach(el => el.remove());
            container.querySelectorAll('.read-prev-notes').forEach( el => el.remove());

            $icon.addClass('notes-loaded');

            const response = JSON.parse(xhr.responseText);
            if (response && response.success) {
              var dt = response.data;
              if (dt.notes && dt.users) {
                var notes = dt.notes;
  
                for (var i = 0; i < notes.length; i = i + 1) {
                  var user = notes[i].user;
                  if (dt.users[user]) {
                    mergeUserObject(notes[i], dt.users[user]);
                  }
                }
  
                if (notes.length) {
                  var ht = _this.getNotesList(notes);
                  container.querySelectorAll('.read-prev-notes').forEach( el => el.remove() );

                  var li = container.querySelector('.notes-list');
                  if (dt.page) {
                    var page = u.generateElement(`<a href="${getPreviousUrl(dt.page)}" class="read-prev-notes">Read previous</a>`);

                    li.parentNode.insertBefore(page, li);
                    //$(page).insertBefore(li);
                  }
  
                  li.removeClass('notes-list-empty');
                  li.prepend(u.generateElement(ht));
                }
              }
            }

          } catch(e) {
            console.error(e);
          }
        }
      }
      xhr.onerror = () => {
        container.querySelectorAll('.loading-notes').forEach(el => el.remove());
      }
      xhr.send(null);

    };

    Details.prototype.openFor = function (name, $icon) {
      var container = this.getContainer(name),
          isLoggedIn = this.isLoggedIn(),
          form = isLoggedIn ? this.getForm('new') : u.generateElement(this.getSignInLink());

      if(!$icon.hasClass('notes-loaded')) {
        const notesCounter = $icon.querySelector('.notes-counter');
        if(notesCounter != null) {
          var count = notesCounter.attr('data-note-count');
          count = parseInt(count);
          if(!isNaN(count) && count > 0) {
            this.loadNotesDetails(name, $icon, container);
          } else {
            container.querySelectorAll('.loading-notes').forEach(el => el.remove());
          }
        }
      }

      container.addClass('opened');

      if ($icon.hasClass('on-dark')) {
        container.addClass('on-dark');
      }else {
        container.removeClass('on-dark');
      }
      let lb = container.querySelector('.note-login-btn');
      if(lb != null) {
        lb.remove();
      }
      let lc = container.find('.note-close-btn');
      if(lc != null) {
        lc.remove();
      }

      const notesFormContainer = container.querySelector('.notes-form-container');
      if(notesFormContainer != null) {
        notesFormContainer.append(form);
      }
      this.positionContainer(container, name);

      if (form && form.querySelector('textarea') != null) {
        form.querySelector('textarea').focus();
      }
    };

    Details.prototype.positionContainer = function (container, name) {
      var against = document.querySelector('[name="' + name + '"]');
      if (against != null) {
        if (this.smallScreen) {

        } else {
          var rect = against.getBoundingClientRect();
          var offset = {
            top: rect.top + document.body.scrollTop,
            left: rect.left + document.body.scrollLeft
          };
          const st = container.style;
          const agwidth = parseFloat(getComputedStyle(against, null).width.replace("px", ""));
          st.left = offset.left + gwidth + 50 + 'px';
          st.top = offset.top + 'px';
          st.position = 'absolute';
        }
        
      }
    };

    Details.prototype.makeRequest = function (url, method, params, scallback, ecallback) {

      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.onload = () => {
        if(xhr.status == "200" && xhr.readyState == 4) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (typeof scallback != 'undefined') {
              scallback(response);
            }
          }catch(e) {
            console.error(e);
          }
        }
      };
    };

    Details.prototype.existingNotes = function (notes) {
      this.existing_notes = notes;
      this.$el.innerHTML = ''; // remove all existing notes..
      this.replyForm = null;
    };

    return Details;

  })(Katana.Base);

}).call(this);