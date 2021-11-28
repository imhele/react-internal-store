# react-internal-store

Share state between your components without any magic ✋.

[![NPM version](https://img.shields.io/npm/v/react-internal-store.svg?style=flat)](https://npmjs.org/package/react-internal-store) [![NPM downloads](http://img.shields.io/npm/dm/react-internal-store.svg?style=flat)](https://npmjs.org/package/react-internal-store) [![Test Coverage](https://github.com/imhele/react-internal-store/actions/workflows/Test%20Coverage.yml/badge.svg)](https://github.com/imhele/react-internal-store/actions/workflows/Test%20Coverage.yml) [![Coverage Status](https://coveralls.io/repos/github/imhele/react-internal-store/badge.svg?branch=master)](https://coveralls.io/github/imhele/react-internal-store?branch=master) [![License](https://img.shields.io/npm/l/react-internal-store.svg)](https://npmjs.org/package/react-internal-store)

## Usage

### Basic

```tsx
import { useState } from 'react';
import { createStore } from 'react-internal-store';

const MyModel = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return [count, increment];
};

const Store = createStore({ MyModel });

function MyApp() {
  return (
    <Store>
      <MyPage />
    </Store>
  );
}

function MyPage() {
  const [count, increment] = Store.useMyModel();

  return (
    <button onClick={increment} type="button">
      You've clicked {count} times.
    </button>
  );
}
```

### With Selector

```tsx
import { useState } from 'react';
import { createStore, defineModel } from 'react-internal-store';

const MyModel = defineModel(() => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return [{ count }, increment];
});

const Store = createStore({ MyModel });

function MyApp() {
  return (
    <Store>
      <MyPage />
    </Store>
  );
}

function MyPage() {
  const [count, increment] = Store.useMyModel((state) => {
    return state.count;
  });

  return (
    <button onClick={increment} type="button">
      You've clicked {count} times.
    </button>
  );
}
```
