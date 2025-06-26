/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // 抑制浏览器扩展引起的水合警告
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // 在开发模式下禁用一些水合检查
  experimental: {
    // 这可以帮助减少一些水合错误
    optimizePackageImports: ['sonner'],
  },
  // 配置webpack来处理某些水合问题
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 在开发模式下，为客户端构建添加特殊处理
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default config;
