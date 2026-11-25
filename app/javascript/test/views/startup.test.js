import React from 'react';
import { render, screen } from '@testing-library/react';

import Startup from '../../../javascript/src/locomotive/editor/views/startup';

describe('components', () => {
  describe('Startup', () => {
    it('should render a loading screen', () => {
      render(<Startup />);
      expect(screen.getByText('Waiting...')).toBeTruthy();
    });
  })
})
