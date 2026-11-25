import React from 'react';
import { createRoot } from 'react-dom/client';
import './editor.scss';
import App from './editor/app';

$(document).ready(function() {
  const { preview, base } = window.Locomotive.urls;

  createRoot(document.getElementById('editor-app')).render(
    <App previewPath={preview} basePath={base} />);
});
