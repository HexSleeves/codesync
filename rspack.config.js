import { defineConfig } from '@meteorjs/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

/**
 * Rspack configuration for Meteor projects.
 * Using Rspack for faster builds (Rust-based bundler).
 */
export default defineConfig(Meteor => {
  const plugins = [];

  // Enable Rsdoctor for bundle analysis when RSDOCTOR=true
  if (process.env.RSDOCTOR) {
    plugins.push(new RsdoctorRspackPlugin({}));
  }

  return {
    plugins,
    optimization: {
      // Extract common modules like @swc/helpers into a shared chunk
      splitChunks: {
        cacheGroups: {
          // Extract @swc/helpers into its own chunk to avoid duplication
          swcHelpers: {
            test: /[\\/]node_modules[\\/]@swc[\\/]helpers[\\/]/,
            name: 'swc-helpers',
            chunks: 'all',
            enforce: true,
            priority: 30,
          },
        },
      },
    },
    performance: {
      hints: Meteor.isProduction ? 'warning' : false,
      maxAssetSize: 400000,
      maxEntrypointSize: 500000,
    },
  };
});
