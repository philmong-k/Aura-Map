import { create } from 'zustand';

// JWT 디코딩 유틸리티 (권한 추출용)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('JWT Decode Error:', e);
    return null;
  }
};

interface AuthState {
  token: string | null;
  user: { 
    email: string; 
    name: string | null; 
    role?: string | null;
    permissions?: string[]; 
  } | null;
  login: (token: string, user: { email: string; name: string | null; role?: string | null }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // [인증 통합] URL에 토큰이 포함되어 오면 즉시 저장 (Aura Hub 연동용)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    localStorage.setItem('aura_token', tokenFromUrl);
    // URL에서 토큰 제거 (심미적 및 보안 목적)
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }

  const initialToken = localStorage.getItem('aura_token');
  let initialUser = JSON.parse(localStorage.getItem('aura_user') || 'null');
  
  // [보안 및 정합성] 토큰은 있는데 유저 정보가 없거나, 그 반대인 경우 초기화
  if (initialToken && !initialUser) {
    const payload = decodeJWT(initialToken);
    if (payload) {
      initialUser = { 
        email: payload.email, 
        name: payload.name, 
        role: payload.role,
        permissions: payload.permissions || [] 
      };
      localStorage.setItem('aura_user', JSON.stringify(initialUser));
    } else {
      localStorage.removeItem('aura_token');
    }
  } else if (!initialToken && initialUser) {
    localStorage.removeItem('aura_user');
    initialUser = null;
  }

  return {
    token: initialToken,
    user: initialUser,
    login: (token, user) => {
      const payload = decodeJWT(token);
      const permissions = payload?.permissions || [];
      const userWithPermissions = { ...user, permissions };
      
      localStorage.setItem('aura_token', token);
      localStorage.setItem('aura_user', JSON.stringify(userWithPermissions));
      set({ token, user: userWithPermissions });
    },
    logout: () => {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
      set({ token: null, user: null });
    },
  };
});