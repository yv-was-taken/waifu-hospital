// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock localStorage - needs to be setup before any modules are imported
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Suppress console.log during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock the API utils directly instead of axios
jest.mock('./utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock setAuthToken utility
jest.mock('./utils/setAuthToken', () => ({
  setAuthToken: jest.fn(),
}));

// Mock styled-components globally - comprehensive approach
jest.mock('styled-components', () => {
  const React = require('react');
  
  // Create a function that handles template literals
  const createStyledComponent = (Component) => {
    return (strings, ...values) => {
      return React.forwardRef((props, ref) => {
        return React.createElement(Component, { ...props, ref }, props.children);
      });
    };
  };
  
  // Main styled function
  const styled = (Component) => {
    if (typeof Component === 'string') {
      return createStyledComponent(Component);
    }
    return createStyledComponent(Component);
  };
  
  // Add all HTML elements as properties
  const htmlElements = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'section', 'article', 'header', 'footer', 'nav', 'main',
    'form', 'input', 'textarea', 'button', 'select', 'option',
    'img', 'a', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'label', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter'
  ];
  
  htmlElements.forEach(element => {
    styled[element] = createStyledComponent(element);
  });

  return {
    __esModule: true,
    default: styled,
  };
});

// Mock Date for consistent testing
const OriginalDate = global.Date;

// Create a proper Date constructor that extends the original
function MockDate(...args) {
  const instance = args.length > 0 ? new OriginalDate(...args) : new OriginalDate();
  
  // Override getFullYear method
  instance.getFullYear = function() {
    return 2024;
  };
  
  return instance;
}

// Copy all static methods from OriginalDate
Object.setPrototypeOf(MockDate, OriginalDate);
Object.getOwnPropertyNames(OriginalDate).forEach(name => {
  if (name !== 'length' && name !== 'name' && name !== 'prototype') {
    MockDate[name] = OriginalDate[name];
  }
});

// Ensure prototype chain is correct
MockDate.prototype = OriginalDate.prototype;

global.Date = MockDate;