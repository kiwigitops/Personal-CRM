# ADR 0001: Core Stack

## Status

Accepted

## Decision

Use TypeScript across clients, API, and agents. Use Next.js for web, Expo for mobile, Tauri for Linux desktop, Fastify + Prisma for the API, PostgreSQL for primary data, Redis + BullMQ for jobs, and Docker Compose for local orchestration.

## Consequences

This stack keeps shared typing practical, supports self-hosted deployment, and avoids external SaaS lock-in for the MVP. The API uses Fastify rather than NestJS to keep the implementation compact while preserving modular structure.

