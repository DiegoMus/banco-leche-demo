import React from 'react';
import { createRoot } from 'react-dom/client';
import Acceso from './Acceso';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Acceso>
      <App />
    </Acceso>
  </React.StrictMode>,
);