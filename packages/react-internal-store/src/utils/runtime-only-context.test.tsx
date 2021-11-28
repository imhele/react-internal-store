/** @jest-environment jsdom */

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { createRuntimeOnlyContext } from './runtime-only-context';

describe('function createRuntimeOnlyContext()', () => {
  it('should exist', () => {
    expect(createRuntimeOnlyContext).toEqual(expect.any(Function));
  });

  it('should return a pair of hook and provider', () => {
    let symbol = Symbol();
    const container = new DocumentFragment();
    const [useContext, Provider] = createRuntimeOnlyContext();

    TestUtils.act(() => {
      ReactDOM.render(<Parent />, container);
    });

    symbol = Symbol();

    TestUtils.act(() => {
      ReactDOM.render(<Parent />, container);
    });

    TestUtils.act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });

    function Parent() {
      return (
        <Provider value={symbol}>
          <Child />
        </Provider>
      );
    }

    function Child() {
      expect(useContext()).toBe(symbol);
      return null;
    }
  });

  it('should throw error when using the hook without provider', () => {
    const name = 'TestContext';
    const container = new DocumentFragment();
    const [useContext] = createRuntimeOnlyContext(name);

    TestUtils.act(() => {
      ReactDOM.render(<Test />, container);
    });

    TestUtils.act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });

    function Test() {
      expect(() => useContext()).toThrow(`Failed to read the context '${name}'`);
      return null;
    }
  });
});
