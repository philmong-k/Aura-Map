# 1단계: Node.js 환경에서 React(Vite) 앱 빌드
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 가볍고 빠른 Nginx 웹 서버에 빌드된 파일 올리기
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# React Router (SPA) 새로고침 에러 방지 설정
RUN sed -i '10i \        try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]