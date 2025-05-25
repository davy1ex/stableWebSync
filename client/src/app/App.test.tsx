import { render } from '@testing-library/react';
import React from "react";
import App from './App';
import { BrowserRouter } from 'react-router-dom';

test('No errors on start!', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});
