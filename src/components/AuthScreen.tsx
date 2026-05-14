import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthScreen() {
  const login = useAuthStore((state) => state.login);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering ? { email, password, name } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '통신 오류가 발생했습니다.');
      }

      if (isRegistering) {
        alert('사령관 등록이 완료되었습니다. 승인된 정보로 로그인을 진행하십시오.');
        setIsRegistering(false); // 가입 성공 시 로그인 화면으로 전환
      } else {
        // 로그인 성공 시 Zustand 스토어에 토큰과 유저 정보 저장 (방어벽 해제)
        login(data.token, data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0b', color: '#00e5ff', fontFamily: '"Inter", sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '40px 50px', border: '1px solid #1f2937', borderRadius: '12px', background: '#111827', width: '350px', boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', letterSpacing: '2px', fontSize: '1.5rem' }}>
          {isRegistering ? 'COMMANDER REGISTRATION' : 'AURA COMMAND'}
        </h2>
        
        {isRegistering && (
          <input 
            type="text" placeholder="Commander Name" value={name} onChange={(e) => setName(e.target.value)} 
            style={{ padding: '12px', background: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', borderRadius: '6px', outline: 'none' }} required 
          />
        )}
        
        <input 
          type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: '12px', background: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', borderRadius: '6px', outline: 'none' }} required 
        />
        
        <input 
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '12px', background: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', borderRadius: '6px', outline: 'none' }} required 
        />

        {errorMsg && <div style={{ color: '#ff4444', fontSize: '12px', textAlign: 'center' }}>{errorMsg}</div>}
        
        <button type="submit" style={{ padding: '12px', background: '#00e5ff', color: '#000', fontWeight: 'bold', cursor: 'pointer', border: 'none', borderRadius: '6px', marginTop: '10px' }}>
          {isRegistering ? 'REGISTER' : 'INITIATE UPLINK'}
        </button>

        <p style={{ textAlign: 'center', margin: '10px 0 0 0', fontSize: '12px', color: '#9ca3af', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}>
          {isRegistering ? 'Already have an uplink? Login here.' : 'No access? Register Commander.'}
        </p>
      </form>
    </div>
  );
}