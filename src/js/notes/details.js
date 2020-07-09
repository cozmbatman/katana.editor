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
      var ht = '';
      ht += '<div class="notes-form">';
      ht += '<textarea id="notes_textarea" class="camouflaged editable text-autogrow notes-textarea text-small" placeholder="Type here.."></textarea>';
      ht += '<div>';
      ht += '<a class="note-update-link notes-form-link" data-progress="Saving.." tabindex="0">Save</a>';
      ht += '<a class="note-save-link notes-form-link" data-progress="Saving.." tabindex="0">Save</a>';
      ht += '<a class="note-delete-link notes-form-link danger" data-progress="Deleting.." tabindex="0">Delete</a>';
      ht += '<a class="note-cancel-link  notes-form-link plain" tabindex="0">Cancel</a>';
      ht += '</div>';
      ht += '</div>';
      return ht;
    };

    Details.prototype.containerTemplate = function (name) {
      var ht = '';
      ht += '<div class="notes-list-wrapper" data-cont-for="' + name + '">';
      ht += '<div class="loading-notes"> <span class="loader dark small ib"></span>loading..</div>';
      ht += '<ul class="notes-list no-margin"></ul>';
      ht += '<div class="notes-form-container"></div>';
      ht += '</div>';
      return ht;
    };

    Details.prototype.getForm = function (mode) {
      if (this.replyForm == null) {
        this.replyForm = $(this.replyFormTemplate());
        this.replyForm.find('.notes-textarea').val('');
        var ta = this.replyForm.find('.notes-textarea').autogrow();
      }

      this.replyForm.removeClass('for-editing');
      this.replyForm.removeAttr('data-note-id');
      this.replyForm.removeAttr('disabled');

      if (mode == 'new') {
        this.replyForm.find('.note-delete-link').addClass('hide').removeClass('show');  
        this.replyForm.find('.note-save-link').addClass('show').removeClass('hide');
        this.replyForm.find('.note-update-link').addClass('hide').removeClass('show');
        this.replyForm.find('.note-cancel-link').addClass('show').removeClass('hide');        
      } else if (mode == 'edit') {
        this.replyForm.find('.note-delete-link').removeClass('hide').addClass('show');
        this.replyForm.find('.note-update-link').addClass('show').removeClass('hide');
        this.replyForm.find('.note-save-link').addClass('hide').removeClass('show');
        this.replyForm.find('.note-cancel-link').addClass('show').removeClass('hide');
      } 

      this.replyForm.find('textarea').val('');

      this.replyForm.show();

      return this.replyForm;
    };

    Details.prototype.getNotesList = function (notes) {
      var ht = '';
      for ( var i = 0; i < notes.length; i = i + 1) {
        var html = this.getSingleNoteTemplate(notes[i]);
        ht += html;
      }
      return ht;
    };

    Details.prototype.createContainer = function (name, notes) {
      var wrap = $(this.containerTemplate(name)),
          eNotes = '';
      if (notes.length) {
        eNotes = this.getNotesList(notes);
        wrap.find('.notes-list').append(eNotes);
      }else {
        wrap.find('.notes-list').addClass('notes-list-empty');
      }
      this.$el.append(wrap);
      return wrap;
    };

    Details.prototype.getContainer = function (name) {
      var cont = this.$el.find('[data-cont-for="' + name + '"]');
      if (cont.length == 0) {
        var notes = _.isUndefined(this.existing_notes[name]) ? [] : this.existing_notes[name];
        cont = this.createContainer(name, notes);
      }
      return cont;
    };

    Details.prototype.getSingleNoteTemplate = function (ob) {
      var ht = '';
      ht += '<li class="post-note-item clearfix" data-note-id="' + ob.noteId + '">';
      ht += '<div class="post-note-avatar smarty-photo rounded thumb bordered left">';
      ht += '<div class="profile-pic-bg" style="background-image:url(\'' + ob.avatarUrl + '\');" ></div>';
      ht += '</div>';
      ht += '<div class="post-note-content-wrap">';
      ht += '<span class="post-note-author-name">';
      ht += '<a href="' + ob.authorUrl + '" title="' + ob.authorName  + '" >';
      ht += ob.authorName;
      ht += '</a>';
      ht += '</span>';
      ht += '<span class="post-note-content">';
      ht += ob.content;
      ht += '</span>';
      if (ob.edit && this.currentUser && this.currentUser == ob.user) {
        if (typeof ob.changeTo != 'undefined') {
          ht += '<div data-editor-actions data-note="' + ob.noteId + '" data-change-visibility="' + ob.changeTo + '">';
          ht += '<a class="note-edit text-small" data-note-id="' + ob.noteId + '" tabindex="0">Edit</a>';
          ht += '<a class="note-edit-editor" data-edit-btn  tabindex="0">More</a>';
          ht += '</div>';
        } else {
          ht += '<div><a class="note-edit text-small" data-note-id="' + ob.noteId + '"  tabindex="0">Edit</a></div>';  
        }
      } else if (ob.edit && typeof ob.changeTo == 'undefined') {
        ht += '<div><a class="note-edit text-small" data-note-id="' + ob.noteId + '" tabindex="0">Edit</a></div>';
      }else if(ob.edit && typeof ob.changeTo != 'undefined') {
        ht += '<div data-editor-actions data-note="' + ob.noteId + '" data-change-visibility="' + ob.changeTo + '"><a class="note-edit-editor" data-edit-btn  tabindex="0">Edit</a></div>';
      }
      ht += '</div>';
      ht += '</li>';
      return ht;
    };

    Details.prototype.handleUpdateClick = function (ev) {
      var form = $(ev.currentTarget).closest('.notes-form');
      if (form.length) {
        var text = form.find('textarea').val(),
        _this = this;
        var deleting = false;
        if (_.isEmpty(text)) {
          //this.removeNote();
          deleting = true;
        }

        var noteId = form.attr('data-note-id');
        var container = form.closest('.notes-list-wrapper');
        var list = container.find('.notes-list');
        var note = list.find('.post-note-item[data-note-id="' + noteId + '"]');
        var piece = container.attr('data-cont-for');
        if (deleting) {          
          form.attr('disabled','disabled');
          this.makeRequest(this.delete_url + '/' + noteId, 'DELETE', {}, function (sresp) {
            if (sresp && sresp.success) {
              _this.iconHandler.decrementCounter(piece);
              form.unwrap();
              note.remove();
              container.find('.notes-form-container').append(_this.getForm('new'));  
            } else {
              form.removeAttr('disabled')
            }
          }, function () {
            form.removeAttr('disabled')
          });
          // update 
        }else {
          var sob = {};
          sob.noteId = noteId;
          sob.note = text;
          sob.piece = piece;
          sob.post = this.story.id;
          sob.draft = this.story.type == 'story' ? false : true;
          form.attr('disabled','disabled');

          this.makeRequest(this.edit_url , 'POST', sob, function (sresp) {
            if (sresp && sresp.success) {
              note.find('.post-note-content').html(text);  
              note.show();
              form.unwrap();
              container.find('.notes-form-container').append(_this.getForm('new'));  
            } else {
              form.removeAttr('disabled');
            }
          }, function () { // error callback
            form.removeAttr('disabled');
          });
        }
        form.find('textarea').val('');
      }
      return false;
    };

    Details.prototype.handleEditorEditClick = function (ev) {
      var tg = $(ev.currentTarget);
      if (tg.length && tg.is('[data-edit-btn]')) {
        var actionWrap  = tg.closest('[data-editor-actions]'),
            noteId = actionWrap.attr('data-note');
        if (actionWrap.length) {
          var currentHTML = actionWrap.html();
          currentHTML = '<div class="hide">' + currentHTML + '</div>';
          var changeToVisibilty = actionWrap.attr('data-change-visibility');
          var visibilityChangeText = changeToVisibilty == 'public' ? 'Make Public' : 'Make Private';
          var links = '<a class="note-visibility-change " data-changeTo="' + changeToVisibilty + '" tabindex="0">' + visibilityChangeText + '</a> &nbsp;';
          links += '<a class="note-delete-editor-link danger"  data-progress="Deleting.." tabindex="0">Delete</a> &nbsp;';
          links += '<a class="note-cancel-editor-link plain"  tabindex="0">Cancel</a> &nbsp;';
          links += currentHTML;
          actionWrap.html(links);
        }
      }
      return false;
    };

    Details.prototype.handleEditClick = function (ev) {
      var tg = $(ev.currentTarget);
      if (tg.length && tg.is('[data-note-id]')) {
        var alreadyOpen = $('.notes-form.for-editing');
        if (alreadyOpen.length) {
          var ta = alreadyOpen.find('textarea');
          ta.focus();
          ta.addClass('blinkOnce');
        } else {
          var noteId = tg.attr('data-note-id'),
            li = tg.closest('.post-note-item[data-note-id="' + noteId + '"]'),
            form = this.getForm('edit');

          form.addClass('for-editing');
          form.attr('data-note-id', noteId);

          form.find('textarea').val(li.find('.post-note-content').text());
          form.insertBefore(li);
          form.wrap('<li class="has-form"></li>');
          var ta = form.find('textarea');
          ta.focus();

          li.hide();  
        }        
      }
      return false;
    };

    Details.prototype.handleSaveClick = function (ev) {
      var form = $(ev.currentTarget).closest('.notes-form');
      if (form.length) {
        var text = form.find('textarea').val();
        var _this = this;

        if (text && _.isEmpty(text)) {
          return false;
        }

        var tmplOb = {};
        
        tmplOb.noteId = u.generateId();
        tmplOb.authorName = this.story.user_name;
        tmplOb.authorUrl = this.story.user_link;
        tmplOb.avatarUrl = this.story.pic;
        tmplOb.content = text;
        tmplOb.edit = true;

        var note = $(this.getSingleNoteTemplate(tmplOb)),
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
            var list = container.find('.notes-list');
            list.append(note);
            list.removeClass('notes-list-empty');
            _this.iconHandler.incrementCounter(sob.piece);
            var ta = form.find('textarea');
            ta.focus();
            _this.$el.find('[data-note-id="' + sresp.data.replace_note + '"]').attr('data-note-id', sresp.data.note_id);
            form.removeAttr('disabled');
            
          } else {
            form.removeAttr('disabled');
          }
        }, function () {
          form.removeAttr('disabled');
        });
      }
      return false;
    };

    Details.prototype.saveRequest = function (ob, successCallback, errorCallback) {
      $.ajax({
        url: this.save_url,
        type: 'POST',
        dataType: 'json',
        data: ob, 
        success: (function (_this) {
          return function(response) {
            successCallback(response);
          };
        })(this),
        error: (function (_this) {
          return function(jqxhr) {

          };
        })(this)
      });
    };

    Details.prototype.handleCancelClick = function (ev) {
      var tg = $(ev.currentTarget),
          dontClose = false;
      if (tg.length) {
        var form = tg.closest('.for-editing');
        if (form.length) {
          var noteId = form.attr('data-note-id'),
              container = form.closest('.notes-list-wrapper');
          form.unwrap();

          container.find('.notes-form-container').append(this.getForm('new'));
          container.find('.post-note-item[data-note-id="' + noteId + '"]').show();
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

    Details.prototype.handleEditorCancelClick = function (ev) {
      var tg = $(ev.currentTarget);
      if (tg.length) {
        var actionWrap  = tg.closest('[data-editor-actions]'),
            noteId = actionWrap.attr('data-note');
        var hidden = actionWrap.find('.hide').html();

        actionWrap.html(hidden);
      }
      return false;
    };

    Details.prototype.handleVisibilityChangeClick = function (ev) {
      var tg = $(ev.currentTarget),
      actionWrap  = tg.closest('[data-editor-actions]');
      if(actionWrap.length) {
        var noteId = actionWrap.attr('data-note'),
        changeTo = tg.attr('data-changeTo'),
        futureIfSuccess = changeTo == 'public' ? 'private' : 'public',
        futureTextIfSuccess = changeTo == 'public' ? 'Make Private' : 'Make Public';

        $.ajax({
          url : this.privacy_url,
          method: 'POST',
          data: {note: noteId, visible: changeTo},
          dataType: 'json',
          success: (function(_this) {
            return function (resp)  {
              if (resp && resp.success) {
                tg.text(futureTextIfSuccess);
                tg.attr('data-changeTo', futureIfSuccess);
                actionWrap.attr('data-change-visibility', futureIfSuccess);

              }
            };
          })(this),
          error: (function (_this) {
            return function (jqxhr) {
              
            }
          })(this)
        });
      }
      return false;
    };

    Details.prototype.handleEditorDeleteClick = function (ev) {
      var tg = $(ev.currentTarget);
      if (tg.length) {
        var actionWrap  = tg.closest('[data-editor-actions]'),
            noteId = actionWrap.attr('data-note'),
            container = actionWrap.closest('.notes-list-wrapper'),
            piece = container.attr('data-cont-for'),
            noteItem = tg.closest('.post-note-item'),
            _this = this;

          noteItem.attr('disabled','disabled');
                  
          this.deleteRequest(noteId, function () {
            if (container.find('.post-note-item').length == 0) {
              container.find('.notes-list').addClass('notes-list-empty');
            }
            container.find('.notes-form-container').append(_this.getForm('new'));  
            container.find('.post-note-item[data-note-id="' + noteId + '"]').remove();
            var ta = container.find('.notes-form-container textarea');
            ta.focus();
            _this.iconHandler.decrementCounter(piece);
          }, function () {
            noteItem.removeAttr('disabled');
          });
      }
    };

    Details.prototype.handleDeleteClick = function (ev) {
      var tg = $(ev.currentTarget);
      if (tg.length) {
        var editMode = tg.closest('.for-editing');
        if (editMode.length) {

          var noteId = editMode.attr('data-note-id'),
              container = editMode.closest('.notes-list-wrapper'),
              piece = container.attr('data-cont-for'),
              _this = this;

          editMode.attr('disabled', 'disabled');

          this.deleteRequest(noteId, function () {
            editMode.unwrap();
            container.find('.post-note-item[data-note-id="' + noteId + '"]').remove();
            _this.iconHandler.decrementCounter(piece);

            if (container.find('.post-note-item').length == 0) {
              container.find('.notes-list').addClass('notes-list-empty');
            }
            container.find('.notes-form-container').append(_this.getForm('new'));
            var ta = container.find('.notes-form-container textarea');
            ta.focus();
          }, function () {
            editMode.removeAttr('disabled');
          });
        } else {

        }
      }
      return false;
    };

    Details.prototype.deleteRequest = function (noteId, successCallback, errorCallback) {
      $.ajax({
        url : this.delete_url + '/' + noteId,
        method: 'DELETE',
        dataType: 'json',
        success: (function(_this) {
          return function (resp)  {
            if (resp && resp.success ) {
              successCallback();
            } else if (resp && !resp.success) {
              errorCallback();
            }
          };
        })(this),
        error: (function (_this) {
          return function (jqxhr) {
            errorCallback();
          }
        })(this)
      });
    };

    Details.prototype.handleReplyClick = function (ev) {
      
      return false;
    };

    Details.prototype.closePreviousBox = function () {
      this.$el.find('.opened').removeClass('opened');
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
      return $('<a href="javascript::;" class="note-login-btn">Login to leave a note</a><a class="note-close-btn">Close</a>');
    };

    Details.prototype.loadPreviousNotes = function(ev) {
      var $tg = $(ev.currentTarget);
      var url = $tg.attr('href');
      var container = $tg.closest('.notes-list-wrapper');
      var name = container.attr('data-cont-for');
      var $icon = $('[note-for="' +name+ '"]');
      $tg.html('<span class="loader ib small dark"></span> Loading..');
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

      var getPreviousUrl = function (page) {
        var url = _this.read_url + '/' + _this.story.id + '/' + name + '?page=' + page;
        return url;
      };

      $.ajax({
        dataType:'json',
        url: url,
        method:'GET',
        data: {},
        success: function (response) {
          container.find('.loading-notes').remove();
          container.find('.read-prev-notes').remove();
          $icon.addClass('notes-loaded');
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
                container.find('.read-prev-notes').remove();
                var li = container.find('.notes-list');
                if (dt.page) {
                  var page = '<a href="' + getPreviousUrl(dt.page) + '" class="read-prev-notes">Read previous</a>';
                  $(page).insertBefore(li);
                }

                li.removeClass('notes-list-empty');
                li.prepend(ht);
              }
            }
          }
        },
        error: function(jqXHR, textStatus) {
          container.find('.loading-notes').remove();
        } 
      });
    };

    Details.prototype.openFor = function (name, $icon) {
      var container = this.getContainer(name),
          isLoggedIn = this.isLoggedIn(),
          form = isLoggedIn ? this.getForm('new') : this.getSignInLink();

      if(!$icon.hasClass('notes-loaded')) {
        var count = $icon.find('.notes-counter').attr('data-note-count');
        count = parseInt(count);
        if(!isNaN(count) && count > 0) {

          this.loadNotesDetails(name, $icon, container);
        } else {
          container.find('.loading-notes').remove();
        }
      }

      container.addClass('opened');

      if ($icon.hasClass('on-dark')) {
        container.addClass('on-dark');
      }else {
        container.removeClass('on-dark');
      }
      container.find('.note-login-btn').remove();
      container.find('.note-close-btn').remove();
      container.find('.notes-form-container').append(form);
      this.positionContainer(container, name);

      if (form && form.find('textarea').length) {
        form.find('textarea').focus();
      }
    };

    Details.prototype.positionContainer = function (container, name) {
      var against = $('[name="' + name + '"]');
      if (against.length) {
        if (this.smallScreen) {

        } else {
          var offset = against.offset();
          container.css({left: offset.left + against.width() + 50, top: offset.top , position: 'absolute'});  
        }
        
      }
    };

    Details.prototype.makeRequest = function (url, method, params, scallback, ecallback) {
      var opt = {
        url: url,
        type: method,
        dataType: 'json'
      };
      if (!_.isEmpty(params)) {
        opt.data = params;
      }

      opt.success = function (resp) {
        if (typeof scallback != 'undefined') {
          scallback(resp);
        }
      };

      opt.error = function (resp) {
        if (typeof ecallback != 'undefined') {
          ecallback(resp);
        }
      };

      $.ajax(opt);
    };

    Details.prototype.existingNotes = function (notes) {
      this.existing_notes = notes;
      this.$el.html(''); // remove all existing notes..
      this.replyForm = null;
    };

    return Details;

  })(Katana.Base);

}).call(this);