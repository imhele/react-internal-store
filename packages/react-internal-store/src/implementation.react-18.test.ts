/** @jest-environment jsdom */

jest.mock('react', () => jest.requireActual('react18'));
jest.mock('react-dom', () => jest.requireActual('react-dom18'));
jest.mock('react-dom/test-utils', () => jest.requireActual('react-dom18/test-utils'));

declare namespace globalThis {
  let IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// React 18 测试相关文档不完善，等正式版本发布后看看有没有什么官方的解决方法
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import './implementation.test';
