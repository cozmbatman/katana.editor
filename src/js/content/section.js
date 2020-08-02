import boot from '../boot';
import Utils from '../utils';
import Stream from '../stream';

function Section(opts) {
  this.opts = opts;
  this.streamer = Stream;

  this.initialize = this.initialize.bind(this);

  this.handleEnterKey = this.handleEnterKey.bind(this);
  this.handleBackspaceKey = this.handleBackspaceKey.bind(this);
  this.handleDeleteKey = this.handleDeleteKey.bind(this);

  this.template = this.template.bind(this);

  boot.it(this, opts);
}

Section.prototype.contentId = 'SECTION';

Section.prototype.initialize = function initialize() {
  const { opts } = this;
  this.icon = 'mfi-hyphens';
  this.title = 'section';
  this.action = 'section';
  this.editorType = opts.editorType || 'blog';

  this.publicationMode = this.editorType === 'publication';
  this.current_editor = opts.editor;
};

Section.prototype.template = function template() {
  const tmpls = this.current_editor.templates;
  const t = (title, action, icon) => tmpls.contentBasicButton({ title, action, icon }, action);
  if (this.editorType === 'publication') {
    let ht = t(this.title, this.action, this.icon);
    ht += t('Stories', 'section-stories', 'mfi-grid-icon');
    return ht;
  }

  return t(this.title, this.action, this.icon);
};

Section.prototype.handleClick = function handleClick(ev, matched) {
  const target = matched || ev.currentTarget;
  const toolTipContainer = target.closest('.inlineContentOptions');
  const actionValue = target.attr('data-action-value');

  let storiesSection = false;
  if (this.publicationMode) {
    if (actionValue === 'section' && !toolTipContainer.hasClass('choose-section')) { // show other options
      toolTipContainer.addClass('choose-section');
      return false;
    } if (actionValue === 'section-stories' && toolTipContainer.hasClass('choose-section')) { // make a section
      storiesSection = true;
    }
  }

  let anchorNode = this.current_editor.getNode();
  if (!anchorNode) {
    anchorNode = document.querySelectorAll('.item-selected');
  }
  if (anchorNode) {
    this.splitContainer(anchorNode, storiesSection);
    this.current_editor.content_bar.hide();
    return true;
  }
  return false;
};

Section.prototype.handleDeleteKey = function handleDeleteKey(e, node) {
  if (this.current_editor.isLastChar()) {
    const sect = node.closest('.block-content');
    if (sect && !sect.hasClass('block-last')) {
      const cont = node.closest('.block-content-inner');
      if (cont) {
        const last = cont.querySelector('.item:last-child');
        if (last && last.attr('name') === node.attr('name')) {
          e.preventDefault();
          this.current_editor.mergeWithUpperSection(sect.next('.block-content'));
          return true;
        }
      }
    }
  }

  return true;
};

Section.prototype.handleBackspaceKey = function handleBackspaceKey(e, node) {
  if (this.current_editor.isFirstChar() && node) {
    const sect = node.closest('.block-content');

    if (sect && !sect.hasClass('block-first')) {
      const cont = node.closest('.block-content-inner');

      if (cont) {
        const first = cont.querySelector('.item:first-child');

        if (first && first.attr('name') === node.attr('name')) {
          this.current_editor.mergeWithUpperSection(sect);
          if (node) {
            this.current_editor.setRangeAt(node);
            e.preventDefault();
            if (!node.hasClass('.item-figure')) {
              Utils.setCaretAtPosition(node);
              this.current_editor.markAsSelected(node);
            }
          } else {
            this.streamer.notifySubscribers('Katana.Error', { msg: 'Node empty' });
          }
          return true;
        }
      }
    }
  } else {
    const sect = document.querySelector('.figure-focused.with-background');
    if (sect) {
      const sel = this.current_editor.selection();
      if (sel && sel.type === 'Caret') {
        const { anchorNode } = sel;
        if (anchorNode.hasClass('block-background')) {
          e.preventDefault();
          this.convertBackgroundSectionToPlain(anchorNode);
          return true;
        }
      } else if (sel && sel.type === 'None') {
        const { anchorNode } = sel;
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

Section.prototype.convertBackgroundSectionToPlain = function convertBgSectionToPlain(node) {
  const sect = node?.closest('.block-content');
  if (sect) {
    const singleTemplate = this.current_editor.templates.getSingleSectionTemplate();
    const newContainer = Utils.generateElement(singleTemplate);
    const currentBody = sect.querySelector('.main-body');
    if (newContainer) {
      const newContainerBody = newContainer.querySelector('.main-body');
      currentBody.parentNode.replaceChild(newContainerBody, currentBody);
      sect.parentNode.replaceChild(newContainer, sect);
      this.current_editor.removeUnnecessarySections();
      this.current_editor.cleanUpInnerSections();
      this.current_editor.fixSectionClasses();
    }
  }
};

Section.prototype.handleEnterKey = function handleEnterKey(e, node) {
  if (e.ctrlKey) { //
    if (node.querySelector('.placeholder-text')) {
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

Section.prototype.fillPreview = function fillPreview(container, count) {
  if (typeof count === 'undefined') {
    this.current_editor.fillStoryPreview(container, count);
  } else {
    this.current_editor.fillStoryPreview(container, 6);
  }
};

Section.prototype.handlePrevStoryAfterAdd = function fPSTYOAA(newContainer) {
  const stype = newContainer.querySelector('[data-for="storytype"]');
  if (stype) {
    const stval = stype.value;
    if (stval === 'tagged') {
      // no issue just return from here
      return;
    }

    const dSelector = '.block-stories [data-for="storytype"]';
    const others = this.current_editor.elNode.querySelectorAll(dSelector);

    for (let i = 0; i < others.length; i += 1) {
      const ot = others[i];
      if (ot !== stype) {
        const curral = ot.value;
        const opts = ot.querySelectorAll('option');
        if (opts.length) {
          for (let m = 0; m < opts.length; m += 1) {
            const kopts = opts[m];
            if (kopts.attr('value') === stval && stval !== curral) {
              kopts.parentNode.removeChild(kopts);
            }
          }
        }
      }
    }
  }
};

Section.prototype.splitContainer = function splitContainer(atNode, storiesSection) {
  let newContainer;
  const tmpls = this.current_editor.templates;
  if (typeof storiesSection !== 'undefined' && storiesSection) {
    newContainer = Utils.generateElement(tmpls.getSingleStorySectionTemplate());
  } else {
    newContainer = Utils.generateElement(tmpls.getSingleSectionTemplate());
  }

  this.current_editor.splitContainer(atNode);

  if (this.publicationMode && storiesSection) {
    if (atNode != null) {
      const sec = atNode.closest('.block-content');
      if (sec != null) {
        sec.insertAdjacentElement('beforebegin', newContainer);
      }
      const ac = newContainer.querySelector('.autocomplete');
      if (ac != null) {
        // FIXME autocomplete
        // (ac).autocomplete();
        if (ac.closest('.autocomplete-buttons')) {
          ac.closest('.autocomplete-buttons').addClass('hide');
        }
      }
    }

    this.fillPreview(newContainer.querySelector('.main-body'), 6);
    this.handlePrevStoryAfterAdd(newContainer);
  }

  if (atNode.nextElementSibling && atNode.textContent.isEmpty()) {
    const next = atNode.nextElementSibling;
    this.current_editor.setRangeAt(next);
    if (!next.hasClass('item-figure')) {
      Utils.setCaretAtPosition(next);
      this.current_editor.markAsSelected(atNode);
    }
    atNode.parentNode.removeChild(atNode);
  } else if (!atNode.nextElementSibling) {
    this.current_editor.setRangeAt(atNode);
    Utils.setCaretAtPosition(atNode);
    this.current_editor.markAsSelected(atNode);
  }
};

// commands when in publication mode
Section.prototype.command = function command(action, button) {
  let section = button.closest('.block-stories');
  if (!section) {
    section = button.closest('.block-content');
  }
  if (!section) {
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

Section.prototype.removeStructureClasses = function removeStructureClasses(section) {
  section.removeClass('as-list');
  section.removeClass('as-image-grid');
  section.removeClass('as-image-list');
};

Section.prototype.commandStructureGrid = function commandStructureGrid(section) {
  this.removeStructureClasses(section);
  section.addClass('as-image-grid');
};

Section.prototype.commandStructureImageList = function commandStructureImageList(section) {
  this.removeStructureClasses(section);
  section.addClass('as-image-list');
};

Section.prototype.commandStructureListView = function commandStructureListView(section) {
  this.removeStructureClasses(section);
  section.addClass('as-list');
};

Section.prototype.removeLayoutClasses = function removeLayoutClasses(section) {
  section.removeClass('block-full-width');
  section.removeClass('block-center-width');
  section.removeClass('block-add-width');
};

Section.prototype.mightAdjustFigures = function mightAdjustFigures(section) {
  section.querySelectorAll('.item-figure:not(.figure-in-row)').forEach((item) => {
    // FIXME delayed send
    this.streamer.notifySubscribers('Katana.Images.Refit', { figure: item });
  });
};

Section.prototype.commandCenterWidth = function commandCenterWidth(section) {
  this.removeLayoutClasses(section);
  section.addClass('block-center-width');
  this.mightAdjustFigures(section);
};

Section.prototype.commandAddWidth = function commandAddWidth(section) {
  this.removeLayoutClasses(section);
  section.addClass('block-add-width');
  this.mightAdjustFigures(section);
};

Section.prototype.commandFullWidth = function commandFullWidth(section) {
  this.removeLayoutClasses(section);
  section.addClass('block-full-width');
  this.mightAdjustFigures(section);
};

Section.prototype.commandRemoveBlock = function commandRemoveBlock(section) {
  const needRefresh = section.hasClass('block-stories');
  let val = '';
  if (needRefresh) {
    val = section.querySelector('[data-for="storytype"]').value;
    if (val === 'tagged') {
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
