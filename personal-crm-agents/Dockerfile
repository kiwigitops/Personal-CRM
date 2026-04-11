FROM node:22-alpine AS deps
WORKDIR /app
COPY personal-crm-agents/package*.json ./personal-crm-agents/
COPY personal-crm-api/prisma ./personal-crm-api/prisma
WORKDIR /app/personal-crm-agents
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY personal-crm-agents ./personal-crm-agents
COPY personal-crm-api/prisma ./personal-crm-api/prisma
WORKDIR /app/personal-crm-agents
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/personal-crm-agents/node_modules ./personal-crm-agents/node_modules
COPY --from=build /app/personal-crm-agents/dist ./personal-crm-agents/dist
COPY --from=build /app/personal-crm-agents/generated ./personal-crm-agents/generated
COPY personal-crm-agents/package*.json ./personal-crm-agents/
WORKDIR /app/personal-crm-agents
EXPOSE 4100
CMD ["npm", "run", "start"]

