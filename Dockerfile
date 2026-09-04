FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cofounder-discovery/package.json ./apps/cofounder-discovery/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --dir apps/cofounder-discovery check \
 && pnpm --dir apps/cofounder-discovery test:unit \
 && pnpm --dir apps/cofounder-discovery build \
 && pnpm --filter cofounder-discovery-platform deploy --prod --legacy /prod/app

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/app/package.json ./package.json
COPY --from=build /prod/app/node_modules ./node_modules
# pnpm deploy intentionally follows package/ignore rules, so compiled output and
# migrations come from the verified workspace build while dependencies stay pruned.
COPY --from=build /app/apps/cofounder-discovery/dist ./dist
COPY --from=build /app/apps/cofounder-discovery/drizzle ./drizzle
EXPOSE 3000
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
