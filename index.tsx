
import './fetchPolyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadOpenArtConfig } from './services/openArtMcp';

// Save an OpenArt session handed back in the URL (same-tab login) before the app renders.
loadOpenArtConfig();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
