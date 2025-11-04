import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserbackProvider } from '@userback/react';

createRoot(document.getElementById('root')!).render(
  <UserbackProvider token="A-toB4qf6TlycGzt55mrEgeMRHe">
    <App />
  </UserbackProvider>
);
