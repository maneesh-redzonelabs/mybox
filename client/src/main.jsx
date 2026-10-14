import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { clearSession } from './api/client';
import './styles/global.css';

// A session must never survive a page load/reload of index.html, so wipe any
// stored token/profile before the app (and AuthProvider's initial state read)
// even starts. Also clear it when the tab/window is being closed or navigated
// away from, so a stale session isn't left sitting in localStorage either.
clearSession();
window.addEventListener('pagehide', clearSession);
window.addEventListener('beforeunload', clearSession);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
