import React, { useState } from 'react';
import { compose } from 'redux';
import { useEditorState } from '@tiptap/react';
import { isBlank, encodeLinkResource, decodeLinkResource } from '../utils/misc';
import i18n from '../i18n';

// HOC
import withRedux from '../hoc/with_redux';
import withGlobalVars from '../hoc/with_global_vars';

// Components
import Modal from '../components/modal';
import UrlPicker from '../views/pickers/urls/main';

// The link buttons: a Locomotive resource (page, model, url, email) is picked in a modal.
const Link = ({ editor, api, contentTypes, findSectionDefinition }) => {
  const [url, setUrl]           = useState(null); // null: the modal is closed
  const [resource, setResource] = useState(null);
  const isLink = useEditorState({ editor, selector: ({ editor }) => editor.isActive('link') });

  const open = () => {
    const { from, to } = editor.state.selection;
    setUrl(decodeLinkResource(editor.getAttributes('link').href) || editor.state.doc.textBetween(from, to));
  };

  const close = () => { setUrl(null); setResource(null); };

  const insert = () => {
    if (isBlank(resource?.value)) return;

    editor.chain().focus().extendMarkRange('link').setLink({
      href:   encodeLinkResource(resource),
      target: resource.new_window ? '_blank' : '_self'
    }).run();
    close();
  };

  return (
    <div className="editor-rich-text-toolbar--group">
      <button type="button" title="Link" className="editor-rich-text-toolbar--button"
        aria-haspopup="dialog" aria-expanded={url !== null} onClick={open}>
        <i className="fas fa-link"></i>
      </button>
      <button type="button" title="Unlink" className="editor-rich-text-toolbar--button" disabled={!isLink}
        onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}>
        <i className="fas fa-unlink"></i>
      </button>

      <Modal title={i18n.t('components.rich_text.link.title')} isOpen={url !== null} onClose={close}>
        <UrlPicker
          api={api}
          url={url || ''}
          contentTypes={contentTypes}
          findSectionDefinition={findSectionDefinition}
          updateContent={(type, resource) => setResource({ ...resource, type })}
        />

        <div className="editor-rich-text-link-actions">
          <button className="btn btn-default btn-sm" onClick={insert}>
            {i18n.t('components.rich_text.link.insert_link')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default compose(
  withGlobalVars,
  withRedux(state => ({ contentTypes: state.editor.contentTypes }))
)(Link);
