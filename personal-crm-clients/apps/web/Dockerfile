FROM node:22-alpine AS deps
WORKDIR /app/personal-crm-clients
COPY personal-crm-clients/package*.json ./
COPY personal-crm-clients/apps/web/package.json ./apps/web/package.json
COPY personal-crm-clients/apps/mobile/package.json ./apps/mobile/package.json
COPY personal-crm-clients/apps/desktop-linux/package.json ./apps/desktop-linux/package.json
COPY personal-crm-clients/packages ./packages
RUN npm ci

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY personal-crm-clients ./
RUN npm run build --workspace @personal-crm/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/personal-crm-clients/apps/web/.next/standalone ./
COPY --from=build /app/personal-crm-clients/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

