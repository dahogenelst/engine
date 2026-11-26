import React, { Component } from 'react';
import { compose } from 'redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TransitionGroup } from 'react-transition-group';
import SlideTransition from '../../components/slide_transition';
import { compact } from 'lodash';
import routes from '../../routes';

// HOC
import withRedux from '../../hoc/with_redux';
import withRouter from '../../hoc/with_router';

// Components
import Header from './header';

// Views
import Startup from '../startup';
import Main from './main';

// routes are exact in react-router 6+; the ones that were not get a splat. Each view gets the
// history/location/match props it had with react-router 5.
const routedViews = routes.map(route => ({
  path: route.exact === true ? route.path : `${route.path}/*`,
  View: withRouter(route.component)
}));

class ActionBar extends Component {

  componentDidUpdate(prevProps) {
    if (prevProps.pageId !== this.props.pageId) {
      const pageId = compact([this.props.pageId, this.props.contentEntryId]).join('-');
      this.props.history.replace(`/${pageId}/content/edit`);
    }
  }

  render() {
    const { pageId, iframeLoaded, location } = this.props;
    const currentKey      = iframeLoaded ? location.pathname : 'startup';
    const slideDirection  = !iframeLoaded ? 'up' : (location.state || {}).slideDirection || 'up';
    const timeout         = slideDirection === 'none' ? { enter: 1, exit: 1 } : { enter: 150, exit: 100 };

    return (
      <div className="actionbar">
        <Header />

        <TransitionGroup className="editor-route-wrapper">
          <SlideTransition
            key={currentKey}
            classNames={`slide-${slideDirection}`}
            timeout={timeout}
            mountOnEnter={true}
            unmountOnExit={true}
          >
            <Routes location={location}>
              {!iframeLoaded && <Route path={`/${pageId}/content/edit/*`} element={<Startup />} />}

              {routedViews.map(route => (
                <Route key={route.path} path={route.path} element={<route.View />} />
              ))}

              <Route path="*" element={<Navigate to={`/${pageId}/content/edit`} replace />} />
            </Routes>
          </SlideTransition>
        </TransitionGroup>
      </div>
    )
  }
}

export { ActionBar };

export default compose(
  withRouter,
  withRedux(state => ({
    pageId:         state.content.page.id,
    contentEntryId: state.content.page.contentEntryId,
    iframeLoaded:   state.iframe.loaded
  }))
)(ActionBar);
