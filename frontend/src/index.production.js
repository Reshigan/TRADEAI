import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppProduction from './App.production';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AppProduction />
  </React.StrictMode>
);
