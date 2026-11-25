import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';

import { ActionBar } from '../../../javascript/src/locomotive/editor/views/action_bar';

// the header and the real views need the redux store; the routing is what we test here
jest.mock('../../../javascript/src/locomotive/editor/views/action_bar/header', () => () => null);
jest.mock('../../../javascript/src/locomotive/editor/routes', () => [
  { path: '/:pageId/content/edit', exact: true, component: () => 'Main view' }
]);

const renderActionBar = (iframeLoaded) => render(
  <MemoryRouter initialEntries={['/1/content/edit']}>
    <Route render={({ location, history }) => (
      <ActionBar pageId={1} iframeLoaded={iframeLoaded} location={location} history={history} />
    )} />
  </MemoryRouter>
);

describe('components', () => {
  describe('ActionBar', () => {
    describe('render', () => {
      it('should render an action bar', () => {
        const { container } = renderActionBar(false);
        expect(container.querySelectorAll('.actionbar').length).toBe(1);
      });

      describe('when preview is not loaded yet', () => {
        it('should render a waiting screen', () => {
          renderActionBar(false);
          expect(screen.getByText('Waiting...')).toBeTruthy();
          expect(screen.queryByText('Main view')).toBeNull();
        });
      });

      describe('when preview is loaded', () => {
        it('should render the route of the current page', () => {
          renderActionBar(true);
          expect(screen.getByText('Main view')).toBeTruthy();
          expect(screen.queryByText('Waiting...')).toBeNull();
        });
      });
    });
  })
})
