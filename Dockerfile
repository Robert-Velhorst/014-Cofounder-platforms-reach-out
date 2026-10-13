ARG NODE_IMAGE=node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/cofounder-discovery/package.json ./apps/cofounder-discovery/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN pnpm --dir apps/cofounder-discovery check \
 && pnpm --dir apps/cofounder-discovery test:unit \
 && pnpm --dir apps/cofounder-discovery build \
 && pnpm --filter cofounder-discovery-platform deploy --prod --offline /prod/app

# Current locked dependencies, without relying on a previously tagged app image.
# This stage is only for the isolated database acceptance workflow.
FROM dependencies AS integration-test
COPY . .
WORKDIR /app/apps/cofounder-discovery
RUN pnpm build
CMD ["sh", "-c", "pnpm db:migrate && pnpm test:integration"]

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/app/package.json ./package.json
COPY --from=build /prod/app/node_modules ./node_modules
# pnpm deploy intentionally follows package/ignore rules, so compiled output and
# migrations come from the verified workspace build while dependencies stay pruned.
COPY --from=build /app/apps/cofounder-discovery/dist ./dist
COPY --from=build /app/apps/cofounder-discovery/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "dist/start-runtime.js"]
