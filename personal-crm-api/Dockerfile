FROM node:22-alpine AS deps
WORKDIR /app/personal-crm-api
COPY personal-crm-api/package*.json ./
RUN npm ci

FROM deps AS build
COPY personal-crm-api ./
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/personal-crm-api
ENV NODE_ENV=production
COPY --from=build /app/personal-crm-api/node_modules ./node_modules
COPY --from=build /app/personal-crm-api/dist ./dist
COPY --from=build /app/personal-crm-api/prisma ./prisma
COPY personal-crm-api/package*.json ./
EXPOSE 4000
CMD ["sh", "-c", "npm run prisma:deploy && npm run seed && npm run start"]
