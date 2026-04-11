/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@personal-crm/api-client",
    "@personal-crm/types",
    "@personal-crm/ui",
    "@personal-crm/utils"
  ]
};

export default nextConfig;

