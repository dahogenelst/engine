import React from 'react';
import buildRoutes from '../../../javascript/src/locomotive/editor/utils/routes_builder';

describe('buildRoutes', () => {
  const Main = React.memo(() => null); // what react-redux's connect returns
  const Edit = () => null;

  it('flattens the nested tree and treats memo components as components', () => {
    const routes = buildRoutes({ '/:pageId': { component: Main, '/edit': Edit, '/sections': { '/new': Main } } });

    expect(routes).toEqual([
      { path: '/:pageId', component: Main, exact: true },
      { path: '/:pageId/edit', component: Edit },
      { path: '/:pageId/sections/new', component: Main }
    ]);
  });
});
