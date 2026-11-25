import React, { Component } from 'react';
import { TransitionGroup } from 'react-transition-group';
import SlideTransition from '../../components/slide_transition';
import { bindAll } from 'lodash';

// Components
import View from '../../components/default_view';
import Menu from './menu';

// Views
import Sections from '../sections/list';
import Settings from '../settings';
import Seo from '../seo';

class Main extends Component {

  constructor(props) {
    super(props);
    this.state = { selectedTab: 'sections' }
    bindAll(this, 'selectTab');
  }

  selectTab(selectedTab) {
    this.setState({ selectedTab });
  }

  render() {
    const TabPane = {
      sections: Sections,
      settings: Settings,
      seo:      Seo
    }[this.state.selectedTab];

    return (
      <View
        renderMenu={() => (
          <Menu
            selectedTab={this.state.selectedTab}
            onSelectTab={this.selectTab}
          />
        )}
      >
        <TransitionGroup className="editor-tabpanes-wrapper">
          <SlideTransition
            key={this.state.selectedTab}
            classNames="slide-down"
            timeout={{ enter: 300, exit: 200 }}
            mountOnEnter={true}
            unmountOnExit={true}
          >
            <TabPane />
          </SlideTransition>
        </TransitionGroup>
      </View>
    )
  }

}

export default Main;
