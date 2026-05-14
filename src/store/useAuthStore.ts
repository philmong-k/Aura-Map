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
  const initialToken = localStorage.getItem('aura_token');
  const initialUser = JSON.parse(localStorage.getItem('aura_user') || 'null');
  
  // 초기 로드 시 토큰이 있으면 권한 동기화 (보안 강화)
  if (initialToken && initialUser) {
    const payload = decodeJWT(initialToken);
    if (payload && payload.permissions) {
      initialUser.permissions = payload.permissions;
    }
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