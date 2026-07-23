import React, { useState, useEffect, useRef } from 'react';
import './LoginOverlay.css';

const LoginOverlay = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef(null);

  const applyToken = (data) => {
    localStorage.setItem('aura_token', data.token);
    localStorage.setItem('aura_user_role', data.role);
    console.log(`✅ [Auth] ${data.message}`);
    onLoginSuccess();
  };

  const handleGoogleCredential = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      const data = await response.json();

      if (response.ok) {
        applyToken(data);
      } else {
        setError(data.error || '구글 인증에 실패했습니다.');
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError('인증 서버와 통신할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        setTimeout(tryInit, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          text: 'signin_with',
        });
      }
    };

    tryInit();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="aura-logo">AURA</div>
          <h1>로그인</h1>
          <p>구글 계정으로 로그인해 주세요.</p>
        </div>

        <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }} />

        {isLoading && <div className="login-error" style={{ color: '#94a3b8' }}>로그인 중...</div>}
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
};

export default LoginOverlay;
