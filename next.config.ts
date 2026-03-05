import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["apify-client"],
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/proxy-agent/**",
      "./node_modules/pac-proxy-agent/**",
      "./node_modules/socks-proxy-agent/**",
      "./node_modules/http-proxy-agent/**",
      "./node_modules/https-proxy-agent/**",
      "./node_modules/agent-base/**",
      "./node_modules/proxy-from-env/**",
      "./node_modules/@tootallnate/quickjs-emscripten/**",
      "./node_modules/lru-cache/**",
    ],
  },
};

export default nextConfig;
