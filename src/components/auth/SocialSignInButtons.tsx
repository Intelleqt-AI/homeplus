import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string };
          user?: { name?: { firstName?: string; lastName?: string } };
        }>;
      };
    };
  }
}

interface SocialSignInButtonsProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

const APPLE_SDK_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

const SocialSignInButtons = ({ onSuccess, onError }: SocialSignInButtonsProps) => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleReady, setAppleReady] = useState(!!window.AppleID);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
  const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;

  useEffect(() => {
    if (containerRef.current) setWidth(containerRef.current.offsetWidth);
  }, []);

  useEffect(() => {
    if (!appleClientId || window.AppleID) {
      if (window.AppleID) setAppleReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = APPLE_SDK_SRC;
    script.async = true;
    script.onload = () => setAppleReady(true);
    document.head.appendChild(script);
  }, [appleClientId]);

  useEffect(() => {
    if (!appleReady || !appleClientId || !appleRedirectUri || !window.AppleID) return;
    window.AppleID.auth.init({
      clientId: appleClientId,
      scope: 'name email',
      redirectURI: appleRedirectUri,
      usePopup: true,
    });
  }, [appleReady, appleClientId, appleRedirectUri]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError('Google sign-in failed. Please try again.');
      return;
    }
    const { error } = await signInWithGoogle(credentialResponse.credential);
    if (error) onError(error.message);
    else onSuccess();
  };

  const handleAppleClick = async () => {
    if (!window.AppleID) return;
    setAppleLoading(true);
    try {
      const res = await window.AppleID.auth.signIn();
      const { error } = await signInWithApple(
        res.authorization.id_token,
        res.user?.name?.firstName,
        res.user?.name?.lastName,
      );
      if (error) onError(error.message);
      else onSuccess();
    } catch {
      // User closed the popup or Apple returned an error — not worth surfacing as a form error.
    } finally {
      setAppleLoading(false);
    }
  };

  if (!googleClientId && !appleClientId) return null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground bg-background px-3">
          <span className="bg-gradient-to-br from-background to-muted/30 px-2">Or continue with</span>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-col items-center gap-2.5 w-full">
        {googleClientId && (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => onError('Google sign-in failed. Please try again.')}
            width={width.toString()}
            theme="outline"
            size="large"
            text="continue_with"
          />
        )}
        {appleClientId && appleRedirectUri && (
          <button
            type="button"
            onClick={handleAppleClick}
            disabled={!appleReady || appleLoading}
            style={{ width }}
            className="h-10 rounded-md bg-black text-white text-sm font-medium
              flex items-center justify-center gap-2
              hover:bg-black/90 active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.462 2.098-1.386 2.874-.923.775-2.033 1.226-3.328 1.351-.078-1.113.375-2.14 1.326-2.918.95-.78 2.145-1.239 3.388-1.307zM20.37 17.045c-.463 1.052-.68 1.522-1.276 2.454-.83 1.3-2.002 2.918-3.454 2.93-1.29.012-1.623-.84-3.373-.828-1.75.011-2.12.842-3.41.83-1.452-.012-2.562-1.472-3.393-2.772C2.865 17.07 2.18 13.16 3.07 10.406c.61-1.884 1.868-3.267 3.44-3.365 1.24-.078 2.13.9 3.373.9 1.24 0 1.93-.9 3.373-.9 1.34 0 2.526.752 3.373 1.917-2.963 1.622-2.484 5.844.744 7.087z" />
            </svg>
            {appleLoading ? 'Signing in…' : 'Continue with Apple'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialSignInButtons;
