FROM node:24-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
EXPOSE 3333
CMD ["pnpm", "exec", "tsx", "watch", "src/shared/infra/http/server.ts"]

FROM dev AS build
RUN pnpm build

FROM base AS prod
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/src ./dist/src
EXPOSE 3333
USER node
CMD ["node", "dist/src/shared/infra/http/server.js"]
