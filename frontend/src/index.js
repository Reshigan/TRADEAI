import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/App.css';
import App from './App';

window.__BUILD_ID__ = '2026-03-28T06:43Z';
console.info('BUILD_ID', window.__BUILD_ID__);

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
