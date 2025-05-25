import { render } from '@testing-library/react';
import React from "react";
import App from './App';

test('No errors on start!', () => {
  render(<App />);
});
