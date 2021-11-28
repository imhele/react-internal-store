/** @jest-environment jsdom */

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { useConstant } from './hooks';

describe('function useConstant()', () => {
  it('should exist', async () => {
    expect(useConstant).toEqual(expect.any(Function));
  });

  it('should invoke initializer just once', () => {
    const symbol = Symbol();
    const container = new DocumentFragment();
    const initializer = jest.fn().mockReturnValue(symbol);

    TestUtils.act(() => {
      ReactDOM.render(<Test />, container);
    });

    TestUtils.act(() => {
      ReactDOM.render(<Test />, container);
    });

    TestUtils.act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });

    expect(initializer).toBeCalledTimes(1);

    function Test() {
      expect(useConstant(initializer)).toBe(symbol);
      return null;
    }
  });
});
