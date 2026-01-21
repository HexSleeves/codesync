import { defineConfig } from '@meteorjs/rspack';

/**
 * Rspack configuration for Meteor projects.
 * Using Rspack for faster builds (Rust-based bundler).
 */
export default defineConfig(Meteor => {
  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['postcss-loader'],
          type: 'css',
        },
      ],
    },
    optimization: {
      // Enable tree shaking
      usedExports: true,
      // Split chunks for better caching
      splitChunks: Meteor.isProduction ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      } : false,
    },
    devtool: Meteor.isDevelopment ? 'eval-source-map' : 'source-map',
    experiments: {
      // Enable incremental rebuilds for faster HMR
      incrementalRebuild: Meteor.isDevelopment,
    },
  };
});
