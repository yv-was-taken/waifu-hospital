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

// Mock styled-components globally
jest.mock('styled-components', () => {
  const React = require('react');
  
  // Create styled function that handles both styled.div and styled(Component)
  const styled = (Component) => {
    // If it's a string (HTML element), return a function that creates that element
    if (typeof Component === 'string') {
      return () => React.forwardRef((props, ref) => 
        React.createElement(Component, { ...props, ref })
      );
    }
    // If it's a component, wrap it
    return () => React.forwardRef((props, ref) => 
      React.createElement(Component, { ...props, ref })
    );
  };
  
  // Add common HTML elements as properties
  const htmlElements = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'section', 'article', 'header', 'footer', 'nav', 'main',
    'form', 'input', 'textarea', 'button', 'select', 'option',
    'img', 'a', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ];
  
  htmlElements.forEach(element => {
    styled[element] = () => React.forwardRef((props, ref) => 
      React.createElement(element, { ...props, ref })
    );
  });

  return {
    __esModule: true,
    default: styled,
  };
});