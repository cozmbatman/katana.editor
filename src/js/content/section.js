import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

function Section(opts) {
  this.opts = opts;
  this.initialize = this.initialize.bind(this);

  this.handleEnterKey = this.handleEnterKey.bind(this);
  this.handleBackspaceKey = this.handleBackspaceKey.bind(this);
  this.handleDeleteKey = this.handleDeleteKey.bind(this);

  this.template = this.template.bind(this);

  boot.it(this, opts);
}

Section.prototype.contentId = 'SECTION';

Section.prototype.initialize = function (opts) {
  if (opts == null) {
    opts = {};
  }
  this.icon = 'mfi-hyphens';
  this.title = 'section';
  this.action = 'section';
  this.editorType = opts.editorType || 'blog';

  this.publicationMode = this.editorType == 'publication' ? true : false;
  this.current_editor = opts.editor;
};


Section.prototype.template = function () {
  var t = (title, action, icon)  => {
    return "<button class='inlineTooltip-button scale' title='" + title + "' data-action='inline-menu-" + action + "' data-action-value='"+ action+"' > <span class='tooltip-icon " + icon + "'></span> </button>";
  };
  if (this.editorType == 'publication') {
    var ht = '';
    ht = t(this.title, this.action, this.icon);
    ht = ht + t('Stories', 'section-stories', 'mfi-grid-icon');
    return ht;
  }

  return t(this.title, this.action, this.icon);
};

Section.prototype.handleClick = function (ev, matched) {
  var target = matched ? matched : ev.currentTarget;

  var toolTipContainer = target.closest('.inlineContentOptions');
  var actionValue = target.attr('data-action-value');
  var storiesSection = false;
  if (this.publicationMode) {
    if (actionValue == 'section' && !toolTipContainer.hasClass('choose-section')) { // show other options
      toolTipContainer.addClass('choose-section');
      return false;
    } else if(actionValue == 'section-stories' && toolTipContainer.hasClass('choose-section')) { // make a section
      storiesSection = true;
    }   
  }
  
  var anchor_node = this.current_editor.getNode();
  if(anchor_node == null) {
    anchor_node = document.querySelectorAll('.item-selected');
  }
  if (anchor_node != null) {
    this.splitContainer(anchor_node, storiesSection);
    this.current_editor.content_bar.hide();
    return true;
  }
  return false;
};

Section.prototype.handleDeleteKey = function (e, node) {
  var sect, cont, last;
  if (this.current_editor.isLastChar()) {
    sect = $node.closest('.block-content');
    if (sect != null && !sect.hasClass('block-last')) {
      cont = node.closest('.block-content-inner');
      if(cont != null) {
        last = cont.querySelector('.item:last-child');
        if (last != null && last.attr('name') == node.attr('name')) {
          e.preventDefault();
          this.current_editor.mergeWithUpperSection(sect.next('.block-content'));
          return true;
        }
      }
    }
  }
  return true;
};

Section.prototype.handleBackspaceKey = function (e, node) {
  var sect,
      cont,
      first;
  if (this.current_editor.isFirstChar() && node) {
    sect = node.closest('.block-content');
    if(sect != null && !sect.hasClass('block-first')) {
      var cont = node.closest('.block-content-inner');
        if(cont != null) {
          first = cont.querySelector('.item:first-child');
          if (first != null && first.attr('name') == node.attr('name')) {
            this.current_editor.mergeWithUpperSection(sect);
            if (node != null) {
              this.current_editor.setRangeAt(node);  
              e.preventDefault();
              if (!node.hasClass('.item-figure')) {
                Utils.setCaretAtPosition(node);  
                this.current_editor.markAsSelected(node);
              }
            }  else {
              console.log('node empty');
            }
            return true;
          }
        }          
    }
  } else {
    var sect = document.querySelector('.figure-focused.with-background');
    if (sect != null) {
      var sel = this.current_editor.selection();
      if (sel && sel.type == 'Caret') {
        var anchorNode = sel.anchorNode;
        if (anchorNode.hasClass('block-background')) {
          e.preventDefault();
          this.convertBackgroundSectionToPlain(anchorNode);
          return true;
        }
      } else if(sel && sel.type == 'None') {
        var anchorNode = sel.anchorNode;
        if (anchorNode.hasClass('block-background')) {
          e.preventDefault();
          this.convertBackgroundSectionToPlain(anchorNode);
          return true;
        }
      }
    }
  }
  return false;
};

Section.prototype.convertBackgroundSectionToPlain = function (node) {
  var sect = node.closest('.block-content');
  if(sect != null) {
    var newContainer = Utils.generateElement(this.current_editor.getSingleSectionTemplate());
    var currentBody = sect.querySelector('.main-body');
    if(newContainer != null) {
      var newContainerBody = newContainer.querySelector('.main-body');
      currentBody.parentNode.replaceChild(newContainerBody, currentBody);
      sect.parentNode.replaceChild(newContainer, sect);
      this.current_editor.removeUnnecessarySections();
      this.current_editor.cleanUpInnerSections();
      this.current_editor.fixSectionClasses();
    }
  }
}

Section.prototype.handleEnterKey = function (e, node) {
  var prev = node.previousElementSibling,
      onePrev = prev != null ? prev.previousElementSibling : null;
  if (e.ctrlKey) { // 
    if (node.querySelector('.placeholder-text') == null) {
      this.splitContainer(node);
      this.current_editor.content_bar.hide();
      e.handled = true;
      Utils.setCaretAtPosition(node[0]);
      this.current_editor.markAsSelected(node);
      this.current_editor.scrollTo(node);
    }
  }
  return false;
};

Section.prototype.fillPreview = function (container, count) {
  if (typeof count == 'undefined') {
    count = 6;
  }
  this.current_editor.fillStoryPreview(container, count);
};

Section.prototype.handlePreviousStoryTypeOptionsAfterAddition = function (newContainer) { 
  var stype = newContainer.querySelector('[data-for="storytype"]');
  if (stype != null) {
    var stval = stype.value;
    if (stval == 'tagged') {
      // no issue just return from here
      return;
    }

    var others = this.current_editor.elNode.querySelectorAll('.block-stories [data-for="storytype"]');

    for (var i = 0; i < others.length; i = i + 1) {
      var ot = others[i];
      if (ot == stype) {
        continue;
      }
      var curral = ot.value;
      var opts = ot.querySelectorAll('option');
      if (opts.length) {
        for (var m = 0; m < opts.length; m = m + 1) {
          var kopts = $(opts[m]);
          if (kopts.attr('value') == stval && stval != curral) {
            kopts.parentNode.removeChild(kopts);
          }
        }
      }
    }
  }
};

Section.prototype.splitContainer = function (atNode, storiesSection) {
  var newContainer;
  if (typeof storiesSection != 'undefined' && storiesSection) {
    newContainer = Utils.generateElement(this.current_editor.getSingleStorySectionTemplate());
  } else {
    newContainer = Utils.generateElement(this.current_editor.getSingleSectionTemplate());
  } 
  
  this.current_editor.splitContainer(atNode);

  if (this.publicationMode && storiesSection) {
    if (atNode != null) {
      var sec = atNode.closest('.block-content');
      if(sec != null) {
        newContainer.insertBefore(sec);
      }
      var ac = newContainer.querySelector('.autocomplete');
      if(ac != null) {
        $(ac).autocomplete();
        if(ac.closest('.autocomplete-buttons') != null) {
          ac.closest('.autocomplete-buttons').addClass('hide');
        }
      }
    }

    this.fillPreview(newContainer.querySelector('.main-body'), 6);
    this.handlePreviousStoryTypeOptionsAfterAddition(newContainer);
  }

  if (atNode.nextElementSibling != null && atNode.textContent.isEmpty()) {
    var next = atNode.nextElementSibling;
    this.current_editor.setRangeAt(next);
    if (!next.hasClass('item-figure')) {
      Utils.setCaretAtPosition(next);
      this.current_editor.markAsSelected(atNode);
    }
    atNode.parentNode.removeChild(atNode);
  } else if(atNode.nextElementSibling == null) {
    this.current_editor.setRangeAt(atNode);
    Utils.setCaretAtPosition(atNode);
    this.current_editor.markAsSelected(atNode);
  }
};

// commands when in publication mode
Section.prototype.command = function (action, button) {
  var section = button.closest('.block-stories');
  if (section == null) {
    section = button.closest('.block-content');
  }
  if(section == null) {
    return;
  }
  switch (action) {
    case 'center-width':
      this.commandCenterWidth(section);
    break;
    case 'add-width':
      this.commandAddWidth(section);
      break;
    case 'full-width':
      this.commandFullWidth(section);
    break;
    case 'remove-block':
      this.commandRemoveBlock(section);
    break;
    case 'image-side':
      this.commandStructureImageList(section);
    break;
    case 'image-grid':
      this.commandStructureGrid(section);
    break;
    case 'list-view':
      this.commandStructureListView(section);
    break;
  }
};

Section.prototype.removeStructureClasses = function (section) {
  section.removeClass('as-list');
  section.removeClass('as-image-grid');
  section.removeClass('as-image-list');
};

Section.prototype.commandStructureGrid = function (section) {
  this.removeStructureClasses(section);
  section.addClass('as-image-grid');
};

Section.prototype.commandStructureImageList = function (section) {
  this.removeStructureClasses(section);
  section.addClass('as-image-list');
};

Section.prototype.commandStructureListView = function (section) {
  this.removeStructureClasses(section);
  section.addClass('as-list');
};

Section.prototype.removeLayoutClasses = function (section) {
  section.removeClass('block-full-width');
  section.removeClass('block-center-width');
  section.removeClass('block-add-width');
};

Section.prototype.mightAdjustFigures = function (section) {
  var figs = section.querySelectorAll('.item-figure:not(.figure-in-row)');
  figs.forEach((item) => {

    setTimeout( () => {
      const cm = new CustomEvent('Mizuchi.Images.Refit', {type: 'Mizuchi.Images.Refit',
      figure: item});
      this.current_editor.elNode.dispatchEvent(cm);
    }, 250);
    
  });
};

Section.prototype.commandCenterWidth = function (section) {
  this.removeLayoutClasses(section);
  section.addClass('block-center-width');
  this.mightAdjustFigures(section);
};

Section.prototype.commandAddWidth = function (section) {
  this.removeLayoutClasses(section);
  section.addClass('block-add-width');
  this.mightAdjustFigures(section);
}

Section.prototype.commandFullWidth = function (section) {
  this.removeLayoutClasses(section);
  section.addClass('block-full-width');
  this.mightAdjustFigures(section);
};

Section.prototype.commandRemoveBlock = function (section) {
  var needRefresh = section.hasClass('block-stories');
  var val = '';
  if (needRefresh) {
    val = section.querySelector('[data-for="storytype"]').value;
    if (val == 'tagged') {
      val = '';
    }
  }

  if (section.next('section') == null && section.prev('section') == null) {
    section.parentNode.removeChild(section);
    this.current_editor.handleCompleteDeletion();
  } else {
    section.parentNode.removeChild(section);
  }

  if (this.current_editor.elNode.querySelector('.block-content') == null) {
    this.current_editor.appendTextSection();
  }

  this.current_editor.fixSectionClasses();

  if (needRefresh) {
    this.current_editor.refreshStoriesMenus(val);
  }

};

export default Section;