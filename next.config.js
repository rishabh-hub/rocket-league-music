// // next.config.js updated to fix both CSP and WASM loading issues

// const { paraglide } = require('@inlang/paraglide-next/plugin');

// const isDev = process.env.NODE_ENV !== 'production';

// const csp = `
//   default-src 'self';
//   script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.vercel-scripts.com;
//   style-src 'self' 'unsafe-inline';
//   connect-src 'self' blob: data: https://*.stripe.com;
//   worker-src 'self' blob:;
//   child-src 'self' blob:;
//   img-src 'self' data: blob: https:;
//   font-src 'self' data:;
//   frame-src 'self' https://*.stripe.com;
// `;
// const securityHeaders = [
//   {
//     key: 'X-Content-Type-Options',
//     value: 'nosniff',
//   },
//   {
//     key: 'X-Frame-Options',
//     value: 'SAMEORIGIN',
//   },
//   {
//     key: 'Content-Security-Policy',
//     value: csp.replace(/\s{2,}/g, '').trim(),
//   },
// ];

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'avatars.githubusercontent.com',
//       },
//       {
//         protocol: 'https',
//         hostname: 'lh3.googleusercontent.com',
//       },
//     ],
//   },
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   webpack: (config) => {
//     // Enable WebAssembly
//     config.experiments.asyncWebAssembly = true;

//     // Set output filename for assets

//     config.output.assetModuleFilename = `static/[hash][ext]`;

//     // Make sure public path is correctly set
//     config.output.publicPath = `/_next/`;

//     // Handle WASM files
//     // config.module.rules.push({
//     //   test: /\.wasm$/,
//     //   type: 'asset/resource',
//     //   generator: {
//     //     // Explicitly control where WASM files are output
//     //     filename: 'static/wasm/[hash][ext]',
//     //   },
//     // });

//     // Handle Web Workers

//     // Set webassembly module filename for consistent path
//     config.module.rules.push({
//       test: /\.(wasm|replay)$/,
//       resourceQuery: {
//         not: /module/,
//       },
//       type: 'asset/resource',
//     });
//     return config;
//   },
//   // Add security headers with the updated CSP
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: securityHeaders,
//       },
//     ];
//   },
// };

// module.exports = paraglide({
//   paraglide: {
//     project: './project.inlang',
//     outdir: './src/paraglide',
//   },
//   ...nextConfig,
// });
// Fixed next.config.js for development and production

// next.config.js with turbopack fixing for dev mode

const { paraglide } = require('@inlang/paraglide-next/plugin');

const isDev = process.env.NODE_ENV !== 'production';

//CSP that works on both production and development
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' blob: data: https://*.stripe.com;
  worker-src 'self' blob:;
  child-src 'self' blob:;
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  frame-src 'self' https://*.stripe.com;
`;

// Better CSP for production and development, more strict.
// Set up a permissive CSP for development
// const csp = `
//   default-src 'self';
//   script-src 'self' 'wasm-unsafe-eval' ${
//     isDev ? "'unsafe-eval' 'unsafe-inline'" : ''
//   } https://js.stripe.com https://*.vercel-scripts.com;
//   style-src 'self' 'unsafe-inline';
//   connect-src 'self' blob: data: https://*.stripe.com;
//   worker-src 'self' blob:;
//   child-src 'self' blob:;
//   img-src 'self' data: blob: https:;
//   font-src 'self' data:;
//   frame-src 'self' https://*.stripe.com;
// `;

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Only add these headers in production
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Referrer-Policy',
          value: 'no-referrer',
        },
      ]),
  {
    key: 'Content-Security-Policy',
    value: csp.replace(/\s{2,}/g, ' ').trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Important: Fix for Turbopack vs Webpack issue in production
  // This disables the use of Turbopack for server code
  experimental: {
    turbo: {
      rules: {
        // Disable the use of turbo for server components
        '*.server.js': {
          runtime: 'webpack',
        },
      },
    },
  },
  webpack: (config) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Set asset output path
    config.output.assetModuleFilename = `static/[hash][ext]`;

    // Set public path correctly
    config.output.publicPath = `/_next/`;

    // Handle WASM files
    config.module.rules.push({
      test: /\.(wasm|replay)$/,
      resourceQuery: {
        not: /module/,
      },
      type: 'asset/resource',
    });

    return config;
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = paraglide({
  paraglide: {
    project: './project.inlang',
    outdir: './src/paraglide',
  },
  ...nextConfig,
});
