import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/canvas/',
  plugins: [react()],
  server: {
    port: 5174, // Agent Canvas 전용 포트 강제 할당
    strictPort: true, // 포트 충돌 원천 차단
    allowedHosts: true, // 모든 호스트 허용 (개발 환경)
  },
})