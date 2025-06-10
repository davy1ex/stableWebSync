import '@testing-library/jest-dom';
import 'whatwg-fetch';

beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        reload: jest.fn(),
      },
    });
  });
  