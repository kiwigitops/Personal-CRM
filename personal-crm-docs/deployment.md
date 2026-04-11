# Deployment

The platform repo includes Docker images and Kubernetes starter manifests.

Production deployment should provide:

- Managed or self-hosted PostgreSQL with backups and PITR.
- Redis with persistence suitable for BullMQ.
- Strong JWT secrets and internal API keys from a secret manager.
- TLS termination at ingress or reverse proxy.
- Object storage credentials for attachments.
- SMTP provider for password reset and invite delivery.
- Image tags pinned by CI, not `latest`.
- Horizontal API replicas and at least one agents worker.

The included Kubernetes manifests are orchestration-ready examples, not a full Helm chart. Add Ingress, Secret, HPA, network policies, and persistent database resources before production.

