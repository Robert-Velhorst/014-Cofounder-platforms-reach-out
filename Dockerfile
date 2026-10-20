FROM debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS node-runtime
ARG TARGETARCH
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl xz-utils libatomic1 \
 && rm -rf /var/lib/apt/lists/*
RUN set -eux; \
    case "$TARGETARCH" in \
      amd64) node_arch=x64; node_sha=fd47865ecd6391ebb431fc815e01b9135bf83ded5cf373247e9331e196b7aded ;; \
      arm64) node_arch=arm64; node_sha=fd6cc729fa4448c2ac27c3fca5606019ced63c65a15c152c8df03e0cbce7f4c5 ;; \
      *) echo "Unsupported target architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    curl --fail --location --silent --show-error \
      "https://nodejs.org/dist/v26.12.0/node-v26.12.0-linux-${node_arch}.tar.xz" \
      --output node.tar.xz; \
    echo "${node_sha}  node.tar.xz" | sha256sum --check --status; \
    tar -xJf node.tar.xz --directory /usr/local --strip-components=1; \
    rm node.tar.xz; \
    node --version | grep --fixed-strings --line-regexp "v26.12.0"

FROM node-runtime AS dependencies
WORKDIR /app
RUN npm install --global pnpm@12.14.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/cofounder-discovery/package.json ./apps/cofounder-discovery/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN pnpm --dir apps/cofounder-discovery check \
 && pnpm --dir apps/cofounder-discovery test:unit \
 && pnpm --dir apps/cofounder-discovery build \
 && pnpm --filter cofounder-discovery-platform deploy --prod --legacy /prod/app

FROM dependencies AS integration-test
COPY . .
WORKDIR /app/apps/cofounder-discovery
RUN pnpm build
CMD ["sh", "-c", "pnpm db:migrate && pnpm test:integration"]

FROM debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS runtime
ENV NODE_ENV=production
RUN groupadd --system node && useradd --system --gid node --create-home node
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates libatomic1 \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=node-runtime /usr/local /usr/local
COPY --from=build /prod/app/package.json ./package.json
COPY --from=build /prod/app/node_modules ./node_modules
# pnpm deploy intentionally follows package/ignore rules, so compiled output and
# migrations come from the verified workspace build while dependencies stay pruned.
COPY --from=build /app/apps/cofounder-discovery/dist ./dist
COPY --from=build /app/apps/cofounder-discovery/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "dist/start-runtime.js"]
