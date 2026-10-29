import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), "db/custom.db")}`;
}

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingIncludes: {
    "/*": ["./db/**/*"],
    "/**/*": ["./db/**/*"],
  },
  // `standalone` produces a minimal self-contained server bundle — required for
  // Railway (no node_modules bloat in the image). Only needed in production; in
  // dev it forces extra graph analysis that slows compiles.
  output: isProd ? "standalone" : undefined,
  reactStrictMode: true,
  // Allow the sandbox preview gateway (and any *.space-z.ai preview host) to
  // hit /_next/* HMR + asset resources without Next.js blocking/throttling the
  // request as a "cross-origin" attempt. Without this, every HMR ping from the
  // preview panel logs a warning and can stall Fast Refresh, making the app
  // feel slow. Dev-only concern; no production impact.
  allowedDevOrigins: ["*.space-z.ai", "localhost", "127.0.0.1", "0.0.0.0"],
  // Security headers — applied to all routes.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  experimental: {
    // Tree-shake barrel imports. lucide-react ships 1000+ icons; without this,
    // every admin page that imports a single icon could pull in much of the
    // barrel. recharts is a heavy chart lib (~400KB ungzipped) — tree-shaking
    // the named imports (LineChart, BarChart, etc.) drops the unused charts.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Vendor chunk splitting is a PRODUCTION optimization (smaller client JS
  // bundles, better caching). In dev it forces webpack to analyze the full
  // dependency graph for chunk optimization on every compile — pure overhead.
  // Gate it on production builds only.
  ...(isProd
    ? {
        webpack: (config: any, { isServer }: { isServer: boolean }) => {
          if (!isServer) {
            config.optimization = config.optimization || {};
            const splitChunks = config.optimization.splitChunks;
            if (splitChunks && typeof splitChunks === "object") {
              splitChunks.cacheGroups = {
                ...splitChunks.cacheGroups,
                // One stable chunk for the heavy chart lib — shared between
                // marketplace detail-charts and admin analytics-dashboard.
                recharts: {
                  name: "chunk-recharts",
                  test: /[\\/]node_modules[\\/](recharts|d3-[a-z]+|victory-vendor)[\\/]/,
                  chunks: "all",
                  priority: 30,
                },
                // One stable chunk for radix primitives — used everywhere.
                radix: {
                  name: "chunk-radix",
                  test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                  chunks: "all",
                  priority: 25,
                },
              };
            }
          }
          return config;
        },
      }
    : {}),
};

export default nextConfig;
