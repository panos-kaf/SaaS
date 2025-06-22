import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { MessageProvider } from './components/Messages.tsx'; // Message context provider
import './global.css'; // style

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MessageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MessageProvider>
  </React.StrictMode>
);