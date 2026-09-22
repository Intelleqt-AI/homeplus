import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'goey-toast/styles.css';
import { UserbackProvider } from '@userback/react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const root = (
  <UserbackProvider token="A-toB4qf6TlycGzt55mrEgeMRHe">
    <App />
  </UserbackProvider>
);

createRoot(document.getElementById('root')!).render(
  googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{root}</GoogleOAuthProvider> : root
);
