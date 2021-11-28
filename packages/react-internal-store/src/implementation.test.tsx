/** @jest-environment jsdom */

import React, { ReactElement, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { createStore, defineModel } from './implementation';

describe('function defineModel()', () => {
  it('should exist', () => {
    expect(defineModel).toEqual(expect.any(Function));
  });

  it('should just return the input argument', () => {
    const hook = jest.fn();

    expect(defineModel(hook)).toBe(hook);
    expect(hook).not.toBeCalled();
  });
});

describe('function createStore()', () => {
  it('should exist', () => {
    expect(createStore).toEqual(expect.any(Function));
  });

  it('should return a function component with static hooks', () => {
    const MyModel = defineModel(jest.fn());
    const Store = createStore({ MyModel });

    expect(Store).toEqual(expect.any(Function));
    expect(Store).toHaveProperty('displayName', expect.any(String));
    expect(Store).toHaveProperty('useMyModel', expect.any(Function));
  });

  it('should return a store to provide model states for sharing', () => {
    let actualCount = 0;
    const [container, root] = createRoot();

    const Child = jest.fn().mockImplementation(function Child() {
      const [state, increment] = Store.useMyModel();
      const [count, actionWithSelector] = Store.useMyModel((state) => state.count);

      expect(count).toBe(actualCount);
      expect(state).toEqual({ count });
      expect(actionWithSelector).toBe(increment);

      return (
        <button onClick={increment} type="button">
          Click Me
        </button>
      );
    });

    const Parent = jest.fn().mockImplementation(function Parent() {
      return (
        <Store>
          <Child />
        </Store>
      );
    });

    const MyModel = defineModel(() => {
      const [count, setCount] = useState(0);

      const increment = useCallback(() => {
        setCount((prev) => prev + 1);
      }, []);

      return [{ count }, increment];
    });

    const Store = createStore({ MyModel });

    TestUtils.act(() => {
      root.render(<Parent />);
    });

    const button = container.querySelector('button');

    expect(button).toBeTruthy();
    expect(Parent).toBeCalledTimes(1);
    expect(Child).toBeCalledTimes(1);

    TestUtils.act(() => {
      button?.click();
      actualCount += 1;
    });

    expect(Parent).toBeCalledTimes(1);
    expect(Child).toBeCalledTimes(2);

    TestUtils.act(() => {
      root.unmount();
    });
  });
});

function createRoot(): [
  container: DocumentFragment,
  root: { render: (element: ReactElement) => void; unmount: () => void },
] {
  const container = new DocumentFragment();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { createRoot: impl } = ReactDOM as any;

  return [
    container,
    typeof impl === 'function'
      ? impl(container)
      : {
          render: (element) => ReactDOM.render(element, container),
          unmount: () => ReactDOM.unmountComponentAtNode(container),
        },
  ];
}
