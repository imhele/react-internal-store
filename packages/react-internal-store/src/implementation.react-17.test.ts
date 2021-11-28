/** @jest-environment jsdom */

jest.mock('react', () => jest.requireActual('react17'));
jest.mock('react-dom', () => jest.requireActual('react-dom17'));
jest.mock('react-dom/test-utils', () => jest.requireActual('react-dom17/test-utils'));

import './implementation.test';
