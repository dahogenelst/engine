import React from 'react';
import { render, screen } from '@testing-library/react';

import { Index } from '../../../../javascript/src/locomotive/editor/views/sections/list';
import { buildProps } from '../../utils'

// stand-ins for the connected lists, so only Index's own logic renders
jest.mock('../../../../javascript/src/locomotive/editor/views/sections/list/simple', () =>
  () => require('react').createElement('div', { 'data-testid': 'simple-list' }));
jest.mock('../../../../javascript/src/locomotive/editor/views/sections/list/dropzone', () =>
  () => require('react').createElement('div', { 'data-testid': 'dropzone' }));

const count = (testId) => screen.queryAllByTestId(testId).length;

describe('components', () => {
  describe('Index', () => {
    describe('render', () => {
      describe('without dropzone', () => {

        it("shouldn't render a static list of sections if none", () => {
          render(<Index { ...buildProps() } />);
          expect(count('simple-list')).toBe(0)
          expect(count('dropzone')).toBe(0)
        });

        describe('with sections', () => {
          it('should render a static list with good data', () => {
            render(<Index { ...buildProps({ sections: { top: ['header'], bottom: ['footer'] } }) } />);
            expect(count('simple-list')).toBe(2)
          });
        });

      });

      describe('with dropzone', () => {
        it('should render a list', () => {
          render(<Index { ...buildProps({ sections: { top: [], bottom: [], dropzone: true }, dropzoneContent: [{ name: 'Slider' }] }) } />);
          expect(count('dropzone')).toBe(1)
          expect(count('simple-list')).toBe(0)
        });

        describe('with top and bottom sections', () => {
          it('should render a static list on top', () => {
            render(<Index { ...buildProps({sections: { top: ['header'], bottom: ['footer'], dropzone: true }, dropzoneContent: [{ name: 'Slider' }] }) } />);
            expect(count('dropzone')).toBe(1)
            expect(count('simple-list')).toBe(2)
          });
        });
      });
    });
  })
})
