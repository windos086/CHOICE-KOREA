# ==========================================
# 1단계: 빌드 스테이지 (Builder Stage)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스코드 전체 복사 및 프로덕션 빌드 실행
# (Vite 클라이언트 및 esbuild 백엔드 컴파일을 동시에 수행하여 dist/ 폴더 생성)
COPY . .
RUN npm run build

# ==========================================
# 2단계: 실행 스테이지 (Runner Stage)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# 빌드 산출물 복사 (dist/ 폴더 내에 HTML, JS 및 server.cjs 포함)
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

# 실행에 필요한 프로덕션용 패키지만 설치 (--omit=dev)
RUN npm ci --omit=dev

# 구글 클라우드 런 포트 매핑 (기본값 8080)
EXPOSE 8080

# 컴파일 완료된 백엔드 서버(server.cjs) 실행
CMD ["node", "dist/server.cjs"]
