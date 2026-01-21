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
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000, // Keep chunks under 244KB
        cacheGroups: {
          // Split React into its own chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          // Split other vendors
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    },
    performance: {
      hints: Meteor.isProduction ? 'warning' : false,
      maxAssetSize: 300000,
      maxEntrypointSize: 400000,
    },
  };
});
