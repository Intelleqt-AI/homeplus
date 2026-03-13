import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserbackProvider } from '@userback/react';

const userbackToken = import.meta.env.VITE_USERBACK_TOKEN;

createRoot(document.getElementById('root')!).render(
  <UserbackProvider token={userbackToken}>
    <App />
  </UserbackProvider>
);
