import React, { Component } from 'react';
import Dropdown from '../../../components/dropdown';
import i18n from '../../../i18n';

export class NewBlockPicker extends React.Component {

  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  toggle(event) {
    event.preventDefault();
    this.setState({ open: !this.state.open });
  }

  select(type) {
    this.props.addBlock(type);
    this.setState({ open: false });
  }

  render() {
    const { sectionDefinition } = this.props;

    return (
      <div className="editor-section-blocks--new">
        {sectionDefinition.blocks.length === 1 && (
          <div className="editor-list-add">
            <a className="editor-list-add--button" onClick={this.select.bind(this, null)}>
              {i18n.t('views.sections.edit.add_block')}
            </a>
          </div>
        )}

        {sectionDefinition.blocks.length > 1 && (
          <Dropdown
            open={this.state.open}
            onClose={() => this.setState({ open: false })}
            target={
              <button className="editor-list-add--button" onClick={this.toggle.bind(this)}>
                {i18n.t('views.sections.edit.add_block')}
              </button>
            }
          >
            <div className="rap-popover-pad">
              {sectionDefinition.blocks.map(blockDefinition =>
                <div
                  key={`add-block-${blockDefinition.type}`}
                  className="rap-popover-button-wrapper">
                  <button onClick={this.select.bind(this, blockDefinition.type)}>
                    {blockDefinition.name}
                  </button>
                </div>
              )}
            </div>
          </Dropdown>
        )}
      </div>
    )
  }
}

export default NewBlockPicker;
