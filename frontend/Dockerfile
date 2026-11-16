FROM node:24-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0"]

FROM dev AS build
ARG VITE_API_URL=http://localhost:3333
ARG VITE_WHATSAPP_NUMERO
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WHATSAPP_NUMERO=$VITE_WHATSAPP_NUMERO
RUN pnpm build

FROM nginx:1.29-alpine AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
